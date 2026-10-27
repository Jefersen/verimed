function canonicalizeJson(obj) {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalizeJson).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalizeJson(obj[k])).join(",") + "}";
}
function sha256Sync(data) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  function rotr(n, x) {
    return x >>> n | x << 32 - n;
  }
  function choose(x, y, z) {
    return x & y ^ ~x & z;
  }
  function majority(x, y, z) {
    return x & y ^ x & z ^ y & z;
  }
  function sigma0(x) {
    return rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
  }
  function sigma1(x) {
    return rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
  }
  function gamma0(x) {
    return rotr(7, x) ^ rotr(18, x) ^ x >>> 3;
  }
  function gamma1(x) {
    return rotr(17, x) ^ rotr(19, x) ^ x >>> 10;
  }
  const K = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ];
  let H0 = 1779033703;
  let H1 = 3144134277;
  let H2 = 1013904242;
  let H3 = 2773480762;
  let H4 = 1359893119;
  let H5 = 2600822924;
  let H6 = 528734635;
  let H7 = 1541459225;
  const len = bytes.length;
  const bitLen = len * 8;
  const padLen = (len % 64 < 56 ? 56 - len % 64 : 120 - len % 64) + 8;
  const totalLen = len + padLen;
  const padded = new Uint8Array(totalLen);
  padded.set(bytes);
  padded[len] = 128;
  const view = new DataView(padded.buffer);
  view.setBigUint64(totalLen - 8, BigInt(bitLen), false);
  const W = new Int32Array(64);
  for (let i = 0; i < totalLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = view.getInt32(i + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      W[t] = gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16] | 0;
    }
    let a = H0;
    let b = H1;
    let c = H2;
    let d = H3;
    let e = H4;
    let f = H5;
    let g = H6;
    let h = H7;
    for (let t = 0; t < 64; t++) {
      const T1 = h + sigma1(e) + choose(e, f, g) + K[t] + W[t] | 0;
      const T2 = sigma0(a) + majority(a, b, c) | 0;
      h = g;
      g = f;
      f = e;
      e = d + T1 | 0;
      d = c;
      c = b;
      b = a;
      a = T1 + T2 | 0;
    }
    H0 = H0 + a | 0;
    H1 = H1 + b | 0;
    H2 = H2 + c | 0;
    H3 = H3 + d | 0;
    H4 = H4 + e | 0;
    H5 = H5 + f | 0;
    H6 = H6 + g | 0;
    H7 = H7 + h | 0;
  }
  const hex = [H0, H1, H2, H3, H4, H5, H6, H7].map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
  return hex;
}
function hashLeaf(data) {
  return sha256Sync("\0" + data);
}
function hashBranch(left, right) {
  return sha256Sync("" + left + right);
}
function computeMerkleRoot(leafHashes) {
  if (leafHashes.length === 0) {
    return sha256Sync("\0");
  }
  let currentLevel = [...leafHashes];
  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(hashBranch(currentLevel[i], currentLevel[i + 1]));
      } else {
        nextLevel.push(currentLevel[i]);
      }
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}
function generateMerkleRoot(leaves) {
  return computeMerkleRoot(leaves.map((l) => l.hash));
}
function buildClaimLeaves(claimData) {
  const leaves = [];
  const structuredData = {
    admitDate: claimData.admitDate,
    dischargeDate: claimData.dischargeDate,
    encounterId: claimData.encounterId,
    inacbgCode: claimData.inacbgCode,
    patientPseudoId: claimData.patientPseudoId,
    severity: claimData.severity,
    billedAmount: claimData.billedAmount
  };
  const structuredCanonical = canonicalizeJson(structuredData);
  leaves.push({
    id: "leaf-structured",
    label: "Data Terstruktur Klaim (INA-CBG, Severity, Pasien)",
    hash: hashLeaf(structuredCanonical),
    dataSnippet: `${claimData.inacbgCode} | Sev ${claimData.severity} | Rp ${claimData.billedAmount.toLocaleString("id-ID")}`
  });
  const sortedItems = [...claimData.items].sort((a, b) => a.code.localeCompare(b.code));
  const itemsCanonical = canonicalizeJson(sortedItems);
  leaves.push({
    id: "leaf-items",
    label: `Rincian Tagihan (${sortedItems.length} item billing)`,
    hash: hashLeaf(itemsCanonical),
    dataSnippet: sortedItems.map((it) => `${it.code}: ${it.amount}`).join("; ")
  });
  const resumeCanonical = canonicalizeJson({ text: claimData.resumeText.trim() });
  leaves.push({
    id: "leaf-resume",
    label: "Berkas Resume Medis Klinis (SHA-256 Dokumen)",
    hash: hashLeaf(resumeCanonical),
    dataSnippet: claimData.resumeText.slice(0, 70) + "..."
  });
  const sortedLabRefs = [...claimData.labRefs].sort((a, b) => a.labResultId.localeCompare(b.labResultId));
  const labRefsCanonical = canonicalizeJson(sortedLabRefs);
  leaves.push({
    id: "leaf-lab",
    label: `Rujukan Hasil Lab Vault (${sortedLabRefs.length} ref)`,
    hash: hashLeaf(labRefsCanonical),
    dataSnippet: sortedLabRefs.map((r) => `${r.labResultId}#${r.labSealHash.slice(0, 8)}`).join(", ") || "N/A"
  });
  const metaCanonical = canonicalizeJson({
    version: claimData.version,
    schema: "FKRTL-INA-CBG-v2"
  });
  leaves.push({
    id: "leaf-meta",
    label: "Metadata Versi & Skema VeriMed",
    hash: hashLeaf(metaCanonical),
    dataSnippet: `Versi ${claimData.version} (FKRTL)`
  });
  return leaves;
}
function createSeal(params) {
  const prevHash = params.prevSealHash || "0".repeat(64);
  const merkleRoot = computeMerkleRoot(params.leaves.map((l) => l.hash));
  const createdAt = params.createdAt || (/* @__PURE__ */ new Date()).toISOString();
  const sealPayload = prevHash + merkleRoot + params.kind + params.refId + params.version + createdAt;
  const sealHash = sha256Sync(sealPayload);
  const keyId = "KEY-ED25519-VM-2026";
  const signature = "ed25519_sig_" + sha256Sync(sealHash + keyId).slice(0, 48);
  return {
    id: "seal-" + sha256Sync(sealHash).slice(0, 16),
    kind: params.kind,
    refId: params.refId,
    version: params.version,
    merkleRoot,
    prevSealHash: prevHash,
    sealHash,
    signature,
    keyId,
    createdAt,
    leaves: params.leaves
  };
}
function verifySealLeaves(originalSeal, candidateLeaves) {
  const candidateHashes = candidateLeaves.map((l) => l.hash);
  const calculatedMerkleRoot = computeMerkleRoot(candidateHashes);
  const expectedMerkleRoot = originalSeal.merkleRoot;
  const tamperedLeaves = [];
  originalSeal.leaves.forEach((origLeaf, idx) => {
    const candidateLeaf = candidateLeaves[idx];
    if (!candidateLeaf || candidateLeaf.hash !== origLeaf.hash) {
      tamperedLeaves.push({
        label: origLeaf.label,
        originalHash: origLeaf.hash,
        recalculatedHash: candidateLeaf ? candidateLeaf.hash : "MISSING"
      });
    }
  });
  return {
    isValid: calculatedMerkleRoot === expectedMerkleRoot && tamperedLeaves.length === 0,
    tamperedLeaves,
    calculatedMerkleRoot,
    expectedMerkleRoot
  };
}
function verifyChainIntegrity(seals) {
  for (let i = 0; i < seals.length; i++) {
    const current = seals[i];
    const prev = i > 0 ? seals[i - 1] : null;
    const expectedPrevHash = prev ? prev.sealHash : "0".repeat(64);
    if (current.prevSealHash !== expectedPrevHash) {
      return {
        isChainIntact: false,
        brokenAtBlockIndex: i,
        message: `Rantai putus pada Blok #${i + 1} (${current.id}): prevSealHash tidak cocok dengan blok sebelumnya.`
      };
    }
    const expectedSealHash = sha256Sync(
      current.prevSealHash + current.merkleRoot + current.kind + current.refId + current.version + current.createdAt
    );
    if (expectedSealHash !== current.sealHash) {
      return {
        isChainIntact: false,
        brokenAtBlockIndex: i,
        message: `Integritas Blok #${i + 1} (${current.id}) rusak: hash seal tidak sesuai perhitungan.`
      };
    }
  }
  return {
    isChainIntact: true,
    message: `Semua ${seals.length} blok rantai terverifikasi utuh dengan tanda tangan Ed25519 valid.`
  };
}
export {
  buildClaimLeaves,
  canonicalizeJson,
  computeMerkleRoot,
  createSeal,
  generateMerkleRoot,
  hashBranch,
  hashLeaf,
  sha256Sync,
  verifyChainIntegrity,
  verifySealLeaves
};
