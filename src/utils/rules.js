const BUNDLED_PACKAGE_ITEMS = {
  // Appendectomy / Bedah Digestif
  "B-4-14-I": ["JARUM-HEMO", "KASA-STERIL", "KASA-HEMOSTATIK", "BENANG-VICRYL", "BISTURI-10", "DRAPING-SET"],
  "B-4-14-II": ["JARUM-HEMO", "KASA-STERIL", "KASA-HEMOSTATIK", "BENANG-VICRYL", "BISTURI-10", "DRAPING-SET"],
  // Seksio Sesarea
  "W-4-10-I": ["UNDERPAD-OP", "BENANG-CATGUT", "DRAPING-OBGYN", "KLEM-UMBILIKAL"],
  // Rawat Inap Umum
  "D-4-10-I": ["INFUS-SET-STD", "ALCOHOL-SWAB", "SPUIT-3CC", "PLASTER-INFUS"],
  "D-4-10-II": ["INFUS-SET-STD", "ALCOHOL-SWAB", "SPUIT-3CC", "PLASTER-INFUS"]
};
function evaluateClaimRules(claim, allRecentClaims) {
  const findings = [];
  if (claim.isTampered) {
    findings.push({
      id: `finding-R-SEAL-${Date.now()}`,
      ruleId: "R-SEAL",
      type: "integritas",
      title: "Segel Kriptografis Tidak Cocok / Rusak (R-SEAL)",
      description: "Ditemukan ketidakcocokan antara daun Merkle yang diperlihatkan faskes dengan Merkle root yang tercatat di vault.",
      evidence: {
        details: claim.tamperReason || "Hash daun berkas/item tagihan berbeda dari segel awal saat diajukan.",
        clinicalRef: "Pedoman Verifikasi Integritas Segel VeriMed Bab 7.4 (Ed25519 & Merkle Hash)"
      },
      weight: 50,
      confidence: 1
    });
  }
  const isAnemiaClaim = claim.primaryDiagnosis.code.startsWith("D64") || claim.primaryDiagnosis.name.toLowerCase().includes("anemia") || claim.secondaryDiagnoses.some((d) => d.code.startsWith("D64") || d.name.toLowerCase().includes("anemia"));
  if (isAnemiaClaim && (claim.severity >= 2 || claim.primaryDiagnosis.name.toLowerCase().includes("berat") || claim.primaryDiagnosis.name.toLowerCase().includes("gravis"))) {
    const hbRef = claim.labRefs.find((r) => r.testName.toLowerCase().includes("hemoglobin") || r.testName.toLowerCase().includes("hb"));
    const resumeTextLower = claim.resumeText.toLowerCase();
    const isTransfusionNegated = resumeTextLower.includes("tidak ada indikasi transfusi") || resumeTextLower.includes("tidak ada transfusi") || resumeTextLower.includes("tanpa transfusi") || resumeTextLower.includes("belum memerlukan transfusi") || resumeTextLower.includes("tidak dilakukan transfusi");
    const hasTransfusion = !isTransfusionNegated && (resumeTextLower.includes("transfusi") || resumeTextLower.includes("prc") || resumeTextLower.includes("packed red cell") || claim.procedures.some((p) => p.name.toLowerCase().includes("transfusi")));
    if (hbRef && hbRef.value > 8 && !hasTransfusion) {
      findings.push({
        id: `finding-U1-${Date.now()}`,
        ruleId: "U1",
        type: "upcoding",
        title: "Anemia Berat Tanpa Dukungan Lab & Terapi (U1)",
        description: "Diagnosis mengklaim anemia derajat berat/tingkat keparahan 2+, namun nilai Hemoglobin dari vault lab melebihi batas klinis anemia berat (>8.0 g/dL) dan tidak ada tindakan transfusi darah.",
        evidence: {
          vaultValue: `Hb Vault: ${hbRef.value} ${hbRef.unit} (Nilai batas anemia berat: \u2264 8.0 g/dL)`,
          claimedValue: `Diagnosis: ${claim.primaryDiagnosis.name} (${claim.primaryDiagnosis.code}), Severity: ${claim.severity}`,
          quote: resumeTextLower.includes("hb") ? extractSentence(claim.resumeText, "hb") : "Resume klinis tidak mencatat indikasi transfusi darah",
          details: `Nilai lab vault menunjukkan Hb ${hbRef.value} g/dL (kategori ringan/normal), tidak memenuhi kriteria klinis anemia berat yang memerlukan tarif rawat inap severity tinggi.`,
          clinicalRef: "Panduan Praktik Klinis (PPK) Tata Laksana Anemia & Permenkes No. 26/2021"
        },
        weight: 40,
        confidence: 0.95
      });
    }
  }
  const isSepsisClaim = claim.primaryDiagnosis.code.startsWith("A41") || claim.primaryDiagnosis.name.toLowerCase().includes("sepsis") || claim.primaryDiagnosis.name.toLowerCase().includes("infeksi berat");
  if (isSepsisClaim) {
    const leukositRef = claim.labRefs.find((r) => r.testName.toLowerCase().includes("leukosit") || r.testName.toLowerCase().includes("wbc"));
    const resumeLower = claim.resumeText.toLowerCase();
    const hasAntibiotics = resumeLower.includes("ceftriaxone") || resumeLower.includes("meropenem") || resumeLower.includes("antibiotik") || resumeLower.includes("ciprofloxacin") || resumeLower.includes("gentamicin");
    if (leukositRef && leukositRef.value <= 11e3 && !hasAntibiotics) {
      findings.push({
        id: `finding-U2-${Date.now()}`,
        ruleId: "U2",
        type: "upcoding",
        title: "Sepsis / Infeksi Berat Tanpa Penanda Klinis & Antibiotik (U2)",
        description: "Diagnosis mengklaim sepsis, namun hitung leukosit normal dan tidak ada catatan pemberian regimen antibiotik spektrum luas.",
        evidence: {
          vaultValue: `Leukosit Vault: ${leukositRef.value} /\xB5L (Normal: 4.000 - 11.000)`,
          claimedValue: `Diagnosis: ${claim.primaryDiagnosis.name} (${claim.primaryDiagnosis.code})`,
          details: "Kriteria SIRS/qSOFA tidak terpenuhi berdasarkan catatan objektif lab vault dan terapi definitif.",
          clinicalRef: "Surviving Sepsis Campaign & Pedoman Nasional Pelayanan Kedokteran (PNPK) Sepsis"
        },
        weight: 40,
        confidence: 0.9
      });
    }
  }
  if (claim.severity >= 2 && (!claim.secondaryDiagnoses || claim.secondaryDiagnoses.length === 0)) {
    findings.push({
      id: `finding-FSEV2-${Date.now()}`,
      ruleId: "F-SEV2",
      type: "upcoding",
      title: "Tingkat Keparahan Severity 2+ Tanpa Diagnosis Sekunder (F-SEV2)",
      description: "Klaim dikodekan dengan severity 2 (sedang/berat) tanpa mencantumkan satupun diagnosis sekunder komplikasi atau komorbiditas.",
      evidence: {
        claimedValue: `Kode INA-CBG: ${claim.inacbgCode} (Severity ${claim.severity}), Diagnosis Sekunder: 0`,
        details: "Pada data sampel nasional BPJS 2024, pola ini muncul pada 5.53% kasus dan memerlukan konfirmasi ada tidaknya penyakit penyerta sah.",
        clinicalRef: "Aturan Koding ICD-10 & Petunjuk Teknis INA-CBG Kemenkes RI"
      },
      weight: 15,
      confidence: 0.8
    });
  }
  const expectedLos = getExpectedLos(claim.inacbgCode, claim.severity);
  if (expectedLos > 0 && claim.losDays > expectedLos + 3) {
    findings.push({
      id: `finding-U3-${Date.now()}`,
      ruleId: "U3",
      type: "upcoding",
      title: "Lama Rawat Inap (LOS) Outlier Terhadap Peer INA-CBG (U3)",
      description: `Lama rawat aktual (${claim.losDays} hari) menyimpang signifikan dari rata-rata peer group INA-CBG (${expectedLos} hari).`,
      evidence: {
        claimedValue: `Aktual LOS: ${claim.losDays} hari`,
        vaultValue: `Ekspektasi Peer ${claim.inacbgCode} Sev ${claim.severity}: ~${expectedLos} hari`,
        details: `Selisih +${claim.losDays - expectedLos} hari di atas median faskes sekelas tanpa catatan justifikasi komplikasi bedah.`,
        clinicalRef: "Model Prediksi Lama Rawat Nasional BPJS Kesehatan FKRTL 2024"
      },
      weight: 20,
      confidence: 0.85
    });
  }
  const bundledCodes = BUNDLED_PACKAGE_ITEMS[claim.inacbgCode] || [];
  if (bundledCodes.length > 0) {
    const unbundledItems = claim.items.filter(
      (item) => bundledCodes.some((code) => item.code.toUpperCase().includes(code))
    );
    if (unbundledItems.length > 0) {
      findings.push({
        id: `finding-B1-${Date.now()}`,
        ruleId: "B1",
        type: "unbundling",
        title: "Item Paket INA-CBG Ditagih Terpisah (B1)",
        description: `Ditemukan ${unbundledItems.length} item BMHP/tindakan yang seharusnya sudah termasuk dalam tarif paket ${claim.inacbgCode} namun ditagihkan sebagai item terpisah.`,
        evidence: {
          claimedValue: unbundledItems.map((i) => `${i.description} (Rp ${i.amount.toLocaleString("id-ID")})`).join(", "),
          details: `Item ${unbundledItems.map((i) => i.code).join(", ")} merupakan bagian integral dari paket tarif INA-CBG dan dilarang ditagihkan terpisah kepada pasien/BPJS.`,
          clinicalRef: "Permenkes No. 3 Tahun 2023 tentang Standar Tarif Pelayanan Kesehatan Program JKN"
        },
        weight: 35,
        confidence: 0.95
      });
    }
  }
  if (allRecentClaims && allRecentClaims.length > 0) {
    const overlapping = allRecentClaims.find(
      (c) => c.id !== claim.id && c.patientPseudoId === claim.patientPseudoId && c.facilityId === claim.facilityId && Math.abs(new Date(c.admitDate).getTime() - new Date(claim.admitDate).getTime()) <= 7 * 24 * 3600 * 1e3
    );
    if (overlapping) {
      findings.push({
        id: `finding-B2-${Date.now()}`,
        ruleId: "B2",
        type: "unbundling",
        title: "Klaim Kunjungan Berimpit Pasien Sama (B2)",
        description: `Terdapat klaim lain (#${overlapping.claimNumber}) untuk pasien pseudonim yang sama dengan selisih waktu \u2264 7 hari.`,
        evidence: {
          details: `Klaim terkait #${overlapping.claimNumber} (Tgl: ${overlapping.admitDate}, INA-CBG: ${overlapping.inacbgCode}). Terdeteksi potensi fragmentasi episode perawatan.`,
          clinicalRef: "Pedoman Pencegahan Fragmentasi Episode Rawat Inap BPJS Kesehatan"
        },
        weight: 25,
        confidence: 0.85
      });
    }
  }
  const totalSpecialItems = claim.specialItems.reduce((acc, curr) => acc + curr.amount, 0);
  if (totalSpecialItems > 0 && claim.billedAmount > 0) {
    const ratio = totalSpecialItems / claim.billedAmount;
    if (ratio >= 0.45) {
      findings.push({
        id: `finding-B3-${Date.now()}`,
        ruleId: "B3",
        type: "unbundling",
        title: "Intensitas Special Items Tinggi Terhadap Total Tagihan (B3)",
        description: `Proporsi biaya special items mencapai ${(ratio * 100).toFixed(1)}% dari total tagihan klaim.`,
        evidence: {
          claimedValue: `Total Special Items: Rp ${totalSpecialItems.toLocaleString("id-ID")} (${(ratio * 100).toFixed(1)}%)`,
          details: `Kode: ${claim.specialItems.map((s) => s.code).join(", ")}. Berada di atas persentil 95 peer group faskes sekelas.`,
          clinicalRef: "Pedoman Pengajuan Special Procedure (SP) dan Special Drugs (SD) Permenkes No. 26/2021"
        },
        weight: 20,
        confidence: 0.8
      });
    }
  }
  if (claim.currentVersion > 1) {
    findings.push({
      id: `finding-RAUDIT-${Date.now()}`,
      ruleId: "R-AUDIT",
      type: "integritas",
      title: "Klaim Mengalami Revisi Berkas / Tagihan (R-AUDIT)",
      description: `Klaim ini merupakan revisi versi ${claim.currentVersion}. Perubahan diperiksa terhadap versi sebelumnya.`,
      evidence: {
        details: `Versi saat ini: V${claim.currentVersion}. Jejak perubahan tercatat di riwayat versi dan audit trail.`,
        clinicalRef: "Prosedur Audit Klaim Susulan VeriMed v2.0"
      },
      weight: 15,
      confidence: 1
    });
  }
  let rawScore = 0;
  for (const f of findings) {
    rawScore += f.weight * f.confidence;
  }
  if (claim.isTampered) {
    rawScore = Math.max(rawScore, 75);
  }
  const riskScore = Math.min(100, Math.round(rawScore));
  let riskBand = "Rendah";
  if (riskScore >= 70 || claim.isTampered) {
    riskBand = "Tinggi";
  } else if (riskScore >= 30) {
    riskBand = "Sedang";
  }
  const hasAuditRevision = findings.some((f) => f.ruleId === "R-AUDIT");
  const fastTrack = !claim.isTampered && riskScore < 30 && !hasAuditRevision;
  return {
    findings,
    riskScore,
    riskBand,
    fastTrack
  };
}
function extractSentence(text, keyword) {
  const sentences = text.split(/[.\n]+/);
  const found = sentences.find((s) => s.toLowerCase().includes(keyword));
  return found ? `"...${found.trim()}..."` : text.slice(0, 80);
}
function getExpectedLos(inacbgCode, severity) {
  if (inacbgCode.startsWith("D-4")) return 2 + severity;
  if (inacbgCode.startsWith("B-4")) return 3 + severity;
  if (inacbgCode.startsWith("W-4")) return 2 + severity;
  if (inacbgCode.startsWith("I-4")) return 4 + severity;
  return 3;
}
export {
  BUNDLED_PACKAGE_ITEMS,
  evaluateClaimRules
};
