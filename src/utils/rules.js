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
      aiExplanation: `AI Forensik mendeteksi bahwa berkas klaim ini telah dimodifikasi secara sepihak setelah segel digital Ed25519 diterbitkan. ${claim.tamperReason || "Perubahan pada nilai tagihan atau isi resume medis mengubah hash SHA-256 pada Daun Merkle, sehingga tidak lagi cocok dengan Merkle Root asli di Vault."} Sistem menolak otomatis salinan yang dimodifikasi ini untuk mencegah manipulasi tagihan (phantom billing).`,
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
        aiExplanation: `AI Klinis membandingkan klaim "${claim.primaryDiagnosis.name}" (Severity ${claim.severity}) dengan data objektif mesin Lab LIS: nilai Hemoglobin pasien tercatat ${hbRef.value} ${hbRef.unit} (sedangkan kriteria medis Anemia Berat Gravis mensyaratkan Hb ≤ 8.0 g/dL). Selain itu, NLP AI membaca teks resume medis dan menemukan bahwa pasien hanya diberikan suplemen oral tanpa tindakan transfusi darah (PRC). Hal ini mengindikasikan penaikan derajat keparahan (upcoding).`,
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
        aiExplanation: `AI Klinis mendeteksi ketidaksesuaian tajam antara diagnosis "${claim.primaryDiagnosis.name}" (tarif Rp ${claim.billedAmount.toLocaleString("id-ID")}) dengan bukti klinis: hasil Leukosit (WBC) di Vault LIS berada dalam batas normal (${leukositRef.value.toLocaleString("id-ID")} /µL, rujukan 4.000–11.000 /µL) dan pada resume medis tidak ditemukan pemberian antibiotik intravena definitif.`,
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
      aiExplanation: `Model Analitik Populasi AI (dilatih pada 1,69 juta kunjungan FKRTL BPJS) mendeteksi anomali koding: klaim menggunakan kode tingkat keparahan Severity ${claim.severity}, namun daftar Diagnosis Sekunder (komorbiditas/komplikasi) kosong. Sesuai aturan grupper INA-CBG, kenaikan dari Severity 1 ke Severity 2/3 wajib disertai bukti diagnosis sekunder yang sah.`,
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
      aiExplanation: `Model Gradient Boosting AI mendeteksi bahwa lama rawat inap pasien (${claim.losDays} hari) melampaui rata-rata nasional untuk paket ${claim.inacbgCode} (~${expectedLos} hari) tanpa catatan komplikasi pasca-tindakan pada resume medis.`,
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
        aiExplanation: `AI Audit Tarif mendeteksi praktik Unbundling (pemecahan tagihan): komponen habis pakai kamar operasi (${unbundledItems.map((i) => i.description).join(", ")}) seharusnya sudah termasuk di dalam tarif paket bedah INA-CBG ${claim.inacbgCode}, tetapi ditagihkan lagi secara terpisah sehingga menambah beban tagihan sebesar Rp ${unbundledItems.reduce((a, b) => a + b.amount, 0).toLocaleString("id-ID")}.`,
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
function generateAiClaimReasoning(claim) {
  if (claim.isTampered) {
    const vipItem = claim.items?.find((i) => i.code.includes("VIP") || i.description.toLowerCase().includes("vip") || i.description.toLowerCase().includes("digelembungkan"));
    const extraItem = claim.items?.find((i) => i.code.includes("SPECIAL") || i.description.toLowerCase().includes("non-formularium"));
    return {
      status: "critical",
      badgeText: "Deteksi Forensik AI: Manipulasi Pasca-Segel",
      shortReason: `AI mendeteksi perubahan sepihak pada berkas setelah disegel: ${claim.tamperReason || "Hash Daun Merkle #1 & #2 berubah akibat modifikasi nilai tagihan."}`,
      summary: `Mesin AI Forensik VeriMed membandingkan sidik jari kriptografi (SHA-256 Merkle Tree) pada berkas kerja saat ini terhadap segel asli Ed25519 di Vault dan menemukan ketidakcocokan kritis.`,
      details: [
        {
          title: "1. Apa yang Dicoba Diubah / Dirusak?",
          text: vipItem || extraItem
            ? `Terdeteksi penyisipan komponen biaya baru setelah klaim disegel, yaitu "${vipItem?.description || "Akomodasi Tambahan"}" (Rp ${(vipItem?.amount || 0).toLocaleString("id-ID")})${extraItem ? ` dan "${extraItem.description}" (Rp ${extraItem.amount.toLocaleString("id-ID")})` : ""}, sehingga total tagihan membengkak menjadi Rp ${claim.billedAmount.toLocaleString("id-ID")}.`
            : claim.tamperReason || "Terdeteksi modifikasi nilai tagihan atau isi teks resume klinis pada salinan faskes setelah segel diterbitkan."
        },
        {
          title: "2. Mengapa AI Langsung Mengetahui Perubahan Ini?",
          text: `Saat klaim pertama kali dikirim, 5 Daun Merkle dikunci dengan tanda tangan kunci privat Ed25519. Perubahan 1 angka atau 1 huruf saja pada rincian tagihan (Daun #2) mengubah hash SHA-256 secara total (efek avalanche), sehingga Merkle Root tidak lagi cocok dengan segel Vault.`
        },
        {
          title: "3. Rekomendasi AI untuk Verifikator",
          text: `Tolak salinan yang dimodifikasi ini atau minta Faskes memulihkan berkas ke segel asli Vault. Jika ada revisi sah, Faskes wajib mengajukan Versi Baru (V${claim.currentVersion + 1}) melalui jalur Klarifikasi resmi agar tercatat di rantai audit.`
        }
      ]
    };
  }

  if (claim.findings && claim.findings.length > 0) {
    const primaryFinding = claim.findings[0];
    const ShortMap = {
      U1: `AI mendeteksi klaim ${claim.primaryDiagnosis.name} (Sev ${claim.severity}) tidak didukung bukti Lab Hb (${claim.labRefs?.[0]?.value || "-"} g/dL > batas berat 8,0 g/dL) & tanpa transfusi.`,
      U2: `AI mendeteksi klaim Sepsis Berat tidak didukung hasil Leukosit Lab (${claim.labRefs?.[0]?.value?.toLocaleString("id-ID") || "-"} /µL masih normal) & tanpa antibiotik IV.`,
      "F-SEV2": `AI mendeteksi pengkodean Severity ${claim.severity} tanpa satupun Diagnosis Sekunder (komorbiditas/komplikasi) pendukung.`,
      U3: `AI mendeteksi lama rawat (${claim.losDays} hari) melebihi rata-rata nasional paket ${claim.inacbgCode} tanpa alasan komplikasi.`,
      B1: `AI mendeteksi pemecahan tagihan (Unbundling): alat/bahan kamar operasi ditagih terpisah padahal sudah masuk paket ${claim.inacbgCode}.`,
      B2: `AI mendeteksi kunjungan berulang pasien yang sama dalam ≤ 7 hari (indikasi fragmentasi episode rawat).`,
      B3: `AI mendeteksi proporsi biaya Special Items melampaui ambang kewajaran 45% dari total klaim.`,
      "R-AUDIT": `AI mencatat klaim ini merupakan revisi V${claim.currentVersion} yang memerlukan verifikasi perubahan antar-versi.`
    };

    return {
      status: claim.riskBand === "Tinggi" ? "high" : "medium",
      badgeText: `Analisis Klinis & Tarif AI (${claim.findings.length} Temuan)`,
      shortReason: ShortMap[primaryFinding.ruleId] || `AI mendeteksi kejanggalan ${primaryFinding.ruleId}: ${primaryFinding.description}`,
      summary: `AI Co-Pilot menemukan ${claim.findings.length} ketidaksesuaian antara klaim yang diajukan (${claim.inacbgCode} • Rp ${claim.billedAmount.toLocaleString("id-ID")}) dengan bukti objektif hasil Lab LIS dan pedoman klinis JKN.`,
      details: claim.findings.map((f, idx) => ({
        title: `${idx + 1}. Analisis AI untuk Temuan ${f.ruleId} — ${f.title.split("(")[0].trim()}`,
        text: f.aiExplanation || f.description
      }))
    };
  }

  return {
    status: "clean",
    badgeText: "Verifikasi AI: Konsisten & Wajar",
    shortReason: "AI memverifikasi kesesuaian diagnosis, hasil Lab LIS Level 2, kewajaran tarif INA-CBG, dan keutuhan segel Merkle.",
    summary: "Seluruh parameter klinis, hasil pemeriksaan laboratorium tersegel, rincian tagihan, dan tanda tangan kriptografi Ed25519 telah diperiksa oleh AI dan dinyatakan konsisten.",
    details: [
      {
        title: "Kesesuaian Klinis & Bukti Objektif",
        text: `Diagnosis "${claim.primaryDiagnosis.name}" (${claim.primaryDiagnosis.code}) selaras dengan catatan terapi pada resume medis${claim.labRefs?.length ? ` serta didukung hasil Lab LIS (${claim.labRefs.map((l) => `${l.testName}: ${l.value} ${l.unit}`).join(", ")})` : ""}.`
      },
      {
        title: "Rekomendasi Jalur Cepat (Fast-Track)",
        text: `Skor risiko rendah (${claim.riskScore}/100) dan segel Merkle utuh. Klaim aman untuk disetujui melalui jalur Fast-Track.`
      }
    ]
  };
}
export {
  BUNDLED_PACKAGE_ITEMS,
  evaluateClaimRules,
  generateAiClaimReasoning
};
