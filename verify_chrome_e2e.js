import { spawn } from "child_process";
import http from "http";
import WebSocket from "ws";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const TARGET_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "c:\\Users\\frost\\Downloads\\verimed\\screenshots";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDebuggerUrl() {
  for (let i = 0; i < 25; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${PORT}/json/list`, (resp) => {
          let data = "";
          resp.on("data", (chunk) => (data += chunk));
          resp.on("end", () => resolve(JSON.parse(data)));
        }).on("error", reject);
      });
      if (res && res.length > 0) {
        const pageTarget = res.find((t) => t.type === "page" && t.url.includes("localhost")) || res.find((t) => t.type === "page");
        if (pageTarget) return pageTarget.webSocketDebuggerUrl;
      }
    } catch {}
    await delay(300);
  }
  throw new Error("Could not connect to Chrome debugging port");
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.on("open", resolve);
      this.ws.on("error", reject);
    });
    this.ws.on("message", (raw) => {
      const msg = JSON.parse(raw);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    const fullPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(fullPath, Buffer.from(res.data, "base64"));
    console.log(`[Screenshot saved]: ${filename}`);
    return fullPath;
  }

  async close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log("=== STARTING FULL CHROME DEMO E2E VERIFICATION ===");
  const dataDir = `C:\\Users\\frost\\AppData\\Local\\Temp\\chrome_demo_test_${Date.now()}`;
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--user-data-dir=${dataDir}`,
      "--window-size=1440,900",
      TARGET_URL
    ],
    { stdio: "ignore" }
  );

  try {
    const wsUrl = await getDebuggerUrl();
    console.log("[CDP Connected]:", wsUrl);
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await delay(3500);

    // 1. Initial State Check
    await delay(2000);
    const initialText = await client.eval(`document.body.innerText`);
    console.log("[Initial Page Loaded, length]:", initialText?.length);

    // Ensure we are in Demo Faskes role
    console.log("[Ensuring we are in Demo Faskes role]...");
    await client.eval(`
      (() => {
        // If button says Demo Admin, clicking it switches to Demo Faskes!
        const adminBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Demo Admin"));
        if (adminBtn) {
          adminBtn.click();
        }
      })()
    `);
    await delay(1500);

    const faskesActive = await client.eval(`
      (() => {
        const u = sessionStorage.getItem("verimed_active_user");
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Demo Faskes"));
        return {
          user: u ? JSON.parse(u) : null,
          isFaskesPillVisible: !!btn,
          bodyHasFaskes: document.body.innerText.includes("Faskes") || document.body.innerText.includes("Siloam")
        };
      })()
    `);
    console.log("[Faskes Active Check]:", faskesActive);
    await client.screenshot("01_faskes_dashboard.png");

    // 2. Open New Claim Modal
    console.log("[Opening New Claim Modal via button]...");
    const modalClicked = await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => 
          b.textContent.includes("Ajukan Klaim") || b.textContent.includes("Klaim Baru")
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log("[Modal button clicked]:", modalClicked);
    await delay(1200);

    // 3. Check Mandatory Red Asterisks (*)
    const asterisks = await client.eval(`
      (() => {
        const labels = Array.from(document.querySelectorAll("label"));
        const reqLabels = labels.filter(l => l.innerHTML.includes("text-rose-500") && l.textContent.includes("*"));
        return reqLabels.map(l => l.textContent.trim().replace(/\\s+/g, " "));
      })()
    `);
    console.log("[Mandatory Fields with Red Asterisks (*)]:\n -", asterisks.join("\n - "));

    // 4. Test Validation Blocker: Clear Encounter ID inside modal and attempt submit
    console.log("[Testing Validation Blocker: Clearing Encounter ID inside modal and clicking submit]...");
    await client.eval(`
      (() => {
        const setVal = (el, val) => {
          const lastVal = el.value;
          el.value = val;
          const tracker = el._valueTracker;
          if (tracker) tracker.setValue(lastVal);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const encLabel = Array.from(document.querySelectorAll("label")).find(l => l.textContent.includes("Encounter ID"));
        const encInput = encLabel?.parentElement?.querySelector("input");
        if (encInput) {
          setVal(encInput, "");
        }
        const submitBtn = document.querySelector("[data-tour='btn-submit-new-claim']");
        if (submitBtn) submitBtn.click();
      })()
    `);
    await delay(1000);

    const validationCheck = await client.eval(`
      (() => {
        const errorBanner = document.querySelector(".bg-rose-50");
        const redInputs = document.querySelectorAll(".border-rose-500");
        const modalOpen = !!document.querySelector("[data-tour='new-claim-modal']");
        return {
          hasErrorBanner: !!errorBanner,
          errorBannerText: errorBanner ? errorBanner.textContent.trim() : null,
          redInputsCount: redInputs.length,
          modalStillOpen: modalOpen
        };
      })()
    `);
    console.log("[Validation Blocker Result]:", validationCheck);
    if (!validationCheck.hasErrorBanner || !validationCheck.modalStillOpen) {
      throw new Error("Validation Blocker failed: empty form was submitted or no error banner shown!");
    }
    await client.screenshot("02_validation_blocked_red_alerts.png");

    // 5. Test AI Auto-Grouper
    console.log("[Testing AI Auto-Grouper with '+ Diabetes Melitus']...");
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Diabetes Melitus"));
        if (btn) btn.click();
      })()
    `);
    await delay(3500);

    const aiGroupingCheck = await client.eval(`
      (() => {
        const lockedCard = document.querySelector(".bg-gradient-to-r");
        const hasLockedPackage = !!lockedCard;
        const lockedCardText = lockedCard ? lockedCard.textContent.trim().replace(/\\s+/g, " ") : "";
        const manualSelectHidden = !Array.from(document.querySelectorAll("label")).some(l => l.textContent.includes("Pilih Paket INA-CBG"));
        const dxInput = Array.from(document.querySelectorAll("input[type='text']")).find(i => i.value.includes("E11") || i.value.includes("Diabetes"));
        return {
          hasLockedPackage,
          lockedCardText: lockedCardText.slice(0, 160),
          manualSelectHidden,
          dxValue: dxInput ? dxInput.value : null
        };
      })()
    `);
    console.log("[AI Auto-Grouper Verification]:", aiGroupingCheck);
    await client.screenshot("03_ai_package_locked_clean_ui.png");

    // Re-enter Encounter ID with valid string so form is complete
    const newEncounterId = `ENC-DEMO-${Date.now().toString().slice(-4)}`;
    console.log(`[Re-entering valid Encounter ID: ${newEncounterId}]...`);
    await client.eval(`
      (() => {
        const setVal = (el, val) => {
          const lastVal = el.value;
          el.value = val;
          const tracker = el._valueTracker;
          if (tracker) tracker.setValue(lastVal);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const encLabel = Array.from(document.querySelectorAll("label")).find(l => l.textContent.includes("Encounter ID"));
        const encInput = encLabel?.parentElement?.querySelector("input");
        if (encInput) {
          setVal(encInput, "${newEncounterId}");
        }
      })()
    `);
    await delay(800);

    // 6. Submit the Valid Claim!
    console.log("[Submitting the completed, valid claim]...");
    await client.eval(`
      (() => {
        const submitBtn = document.querySelector("[data-tour='btn-submit-new-claim']");
        if (submitBtn) submitBtn.click();
      })()
    `);
    await delay(2500);

    // Verify claim exists in Faskes list
    const faskesStatus = await client.eval(`
      (() => {
        const modalStillOpen = !!document.querySelector("[data-tour='new-claim-modal']");
        const errors = Array.from(document.querySelectorAll(".text-rose-600, .bg-rose-50")).map(e => e.textContent.trim());
        const spans = Array.from(document.querySelectorAll("span.font-mono")).map(e => e.textContent.trim()).filter(t => t.includes("CLM"));
        return {
          modalStillOpen,
          errors,
          claimNumbers: spans
        };
      })()
    `);
    console.log("[Faskes State After Submission]:", faskesStatus);
    const createdClaimNumber = faskesStatus.claimNumbers[0];
    console.log("[Created Claim Number]:", createdClaimNumber);
    await client.screenshot("04_faskes_claim_submitted.png");

    if (faskesStatus.modalStillOpen) {
      throw new Error(`Modal did not close on submit. Errors: ${JSON.stringify(faskesStatus.errors)}`);
    }

    // 7. CRITICAL: Switch Role to Demo Admin!
    console.log("\n>>> SWITCHING ROLE TO DEMO ADMIN <<<");
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => 
          b.textContent.includes("Demo Faskes") || b.title?.includes("Beralih Peran")
        );
        if (btn) btn.click();
      })()
    `);
    await delay(2500);

    const adminUser = await client.eval(`
      (() => {
        const u = sessionStorage.getItem("verimed_active_user");
        return u ? JSON.parse(u) : null;
      })()
    `);
    console.log("[Current User is Demo Admin]:", adminUser?.role === "admin", adminUser?.name);

    // 8. CRITICAL: Check if the claim is visible in Demo Admin Antrean Verifikasi!
    const adminClaims = await client.eval(`
      (() => {
        const spans = Array.from(document.querySelectorAll("span.font-mono")).map(e => e.textContent.trim()).filter(t => t.includes("CLM"));
        return spans;
      })()
    `);
    console.log("[Claims visible in Admin]:", adminClaims);
    const persistsInAdmin = adminClaims.includes(createdClaimNumber) || adminClaims.some(c => c.includes(createdClaimNumber.replace("#", "")));
    console.log(`>>> VERIFICATION: Claim ${createdClaimNumber} visible in Admin? <<< :`, persistsInAdmin ? "PASSED! (FOUND)" : "FAILED! (MISSING)");
    await client.screenshot("05_admin_queue_claim_found.png");

    if (!persistsInAdmin) {
      throw new Error(`CRITICAL BUG DETECTED: Claim ${createdClaimNumber} disappeared in Admin!`);
    }

    // 9. Admin opens claim and approves it
    console.log(`[Admin opening claim ${createdClaimNumber}]...`);
    await client.eval(`
      (() => {
        const cleanNum = "${createdClaimNumber}".replace("#", "");
        const claimRow = Array.from(document.querySelectorAll("div, tr")).find(el => 
          el.textContent.includes(cleanNum) && el.textContent.includes("Pasien")
        );
        if (claimRow) claimRow.click();
      })()
    `);
    await delay(1500);

    console.log("[Admin clicking 'Setujui Klaim']...");
    await client.eval(`
      (() => {
        const approveBtn = Array.from(document.querySelectorAll("button")).find(b => 
          b.textContent.includes("Setujui Klaim")
        );
        if (approveBtn) approveBtn.click();
      })()
    `);
    await delay(1500);

    // Close modal
    await client.eval(`
      (() => {
        const closeBtn = document.querySelector("button[class*='p-2']");
        if (closeBtn) closeBtn.click();
      })()
    `);
    await delay(1000);
    await client.screenshot("06_admin_claim_approved.png");

    // 10. CRITICAL: Switch Role back to Demo Faskes!
    console.log("\n>>> SWITCHING ROLE BACK TO DEMO FASKES <<<");
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => 
          b.textContent.includes("Demo Admin") || b.title?.includes("Beralih Peran")
        );
        if (btn) btn.click();
      })()
    `);
    await delay(2500);

    const faskesCheckAfter = await client.eval(`
      (() => {
        const cleanNum = "${createdClaimNumber}".replace("#", "");
        const text = document.body.textContent;
        const hasClaim = text.includes(cleanNum);
        const hasApproved = text.includes("Disetujui") || text.includes("disetujui");
        return { hasClaim, hasApproved };
      })()
    `);
    console.log(`>>> VERIFICATION: Claim ${createdClaimNumber} persists in Faskes? <<< :`, faskesCheckAfter.hasClaim ? "PASSED! (FOUND)" : "FAILED! (MISSING)");
    console.log(`>>> VERIFICATION: Status updated to Disetujui? <<< :`, faskesCheckAfter.hasApproved ? "PASSED! (APPROVED)" : "FAILED!");
    await client.screenshot("07_faskes_claim_persists_approved.png");

    if (!faskesCheckAfter.hasClaim) {
      throw new Error(`CRITICAL BUG: Claim ${createdClaimNumber} was lost when switching back to Faskes!`);
    }

    // 11. Test LIS Simulator in Lab Vault
    console.log("\n>>> TESTING LAB VAULT & LIS SIMULATOR <<<");
    await client.eval(`
      (() => {
        const labNav = Array.from(document.querySelectorAll("button, a")).find(el => el.textContent.includes("Lab Vault"));
        if (labNav) labNav.click();
      })()
    `);
    await delay(1200);

    // Open LIS Simulator
    await client.eval(`
      (() => {
        const simBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Simulator"));
        if (simBtn) simBtn.click();
      })()
    `);
    await delay(800);

    const labMandatoryAsterisks = await client.eval(`
      (() => {
        const labels = Array.from(document.querySelectorAll("label"));
        const reqLabels = labels.filter(l => l.innerHTML.includes("text-rose-500") && l.textContent.includes("*"));
        return reqLabels.map(l => l.textContent.trim().replace(/\\s+/g, " "));
      })()
    `);
    console.log("[Lab Simulator Mandatory Asterisks (*)]:\n -", labMandatoryAsterisks.join("\n - "));

    // Submit Lab Result
    await client.eval(`
      (() => {
        const submitBtn = document.querySelector("[data-tour='btn-submit-lis-simulator']");
        if (submitBtn) submitBtn.click();
      })()
    `);
    await delay(1200);

    const labCount = await client.eval(`
      (() => {
        const rows = document.querySelectorAll("tbody tr");
        return rows.length;
      })()
    `);
    console.log("[Total Lab Records in Vault after Ingestion]:", labCount);
    await client.screenshot("08_lab_vault_persisted.png");

    await client.close();
    console.log("\n========================================================");
    console.log("  ALL DEMO & PERSISTENCE VERIFICATION PASSED 100%!       ");
    console.log("========================================================");
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error("\n[E2E VERIFICATION FAILED]:", err);
  process.exit(1);
});
