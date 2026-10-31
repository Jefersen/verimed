import { buildClaimLeaves, createSeal } from "../utils/crypto.js";
import { evaluateClaimRules } from "../utils/rules.js";
const INITIAL_USERS = [
  {
    id: "USR-ADMIN-01",
    name: "dr. Budi Setiawan, Sp.PK",
    email: "admin@verimed.id",
    role: "admin",
    facilityName: "Kantor Cabang BPJS & VeriMed Central",
    pairingCode: "BPJS-KC-JKT01",
    isDemo: true
  },
  {
    id: "USR-FASKES-01",
    name: "dr. Rina Puspita (Koder Klaim)",
    email: "faskes@siloam.co.id",
    role: "faskes",
    facilityId: "FASKES-01",
    facilityName: "RS Siloam Sejahtera",
    pairingCode: "BPJS-KC-JKT01",
    isDemo: true
  },
  {
    id: "USR-FASKES-02",
    name: "dr. Ahmad Santoso (Manajer Medis)",
    email: "rsud@bhaktihusada.go.id",
    role: "faskes",
    facilityId: "FASKES-02",
    facilityName: "RSUD Bhakti Husada",
    pairingCode: "BPJS-KC-JKT01",
    isDemo: true
  }
];
const INITIAL_LAB_RESULTS = [
  {
    id: "MRI-2026-090",
    facilityId: "FASKES-01",
    facilityName: "RS Siloam Sejahtera",
    sourceId: "DICOM-MRI-01",
    sourceName: "Siemens MAGNETOM Altea 1.5T MRI",
    specimenId: "DCM-9901",
    encounterId: "ENC-2026-009",
    patientPseudoId: "PASIEN-7721",
    test: "MRI Brain 1.5T (Skor ASPECTS)",
    value: 6,
    unit: "Skor",
    referenceRange: "10 - 10 (Normal)",
    isAbnormal: true,
    sampledAt: "2026-10-14T08:10:00Z",
    receivedAt: "2026-10-14T08:42:00Z",
    payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    sealId: "SEAL-MRI-090",
    assuranceLevel: "Level 2",
    status: "valid"
  },
  {
    id: "LAB-2026-081",
    facilityId: "FASKES-01",
    facilityName: "RS Siloam Sejahtera",
    sourceId: "LIS-SYS-01",
    sourceName: "Sysmex XN-1000 Hematology",
    specimenId: "SPEC-8801",
    encounterId: "ENC-2026-001",
    patientPseudoId: "PASIEN-1234",
    test: "Trombosit",
    value: 78e3,
    unit: "/\xB5L",
    referenceRange: "150.000 - 450.000",
    isAbnormal: true,
    sampledAt: "2026-10-10T07:15:00Z",
    receivedAt: "2026-10-10T07:45:00Z",
    payloadHash: "4f7b2c9e110298ea330081bf447dca98822901aa7789d02334b0eecc71829abc",
    sealId: "SEAL-LAB-081",
    assuranceLevel: "Level 2",
    status: "valid"
  },
  {
    id: "LAB-2026-082",
    facilityId: "FASKES-01",
    facilityName: "RS Siloam Sejahtera",
    sourceId: "LIS-SYS-01",
    sourceName: "Sysmex XN-1000 Hematology",
    specimenId: "SPEC-8802",
    encounterId: "ENC-2026-002",
    patientPseudoId: "PASIEN-5566",
    test: "Hemoglobin (Hb)",
    value: 11.4,
    unit: "g/dL",
    referenceRange: "12.0 - 16.0",
    isAbnormal: false,
    sampledAt: "2026-10-11T08:00:00Z",
    receivedAt: "2026-10-11T08:30:00Z",
    payloadHash: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
    sealId: "SEAL-LAB-082",
    assuranceLevel: "Level 2",
    status: "valid"
  },
  {
    id: "LAB-2026-083",
    facilityId: "FASKES-01",
    facilityName: "RS Siloam Sejahtera",
    sourceId: "LIS-ARCH-02",
    sourceName: "Abbott Architect c8000",
    specimenId: "SPEC-8803",
    encounterId: "ENC-2026-005",
    patientPseudoId: "PASIEN-8899",
    test: "Hitung Leukosit (WBC)",
    value: 7200,
    unit: "/\xB5L",
    referenceRange: "4.000 - 11.000",
    isAbnormal: false,
    sampledAt: "2026-10-12T09:20:00Z",
    receivedAt: "2026-10-12T09:50:00Z",
    payloadHash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    sealId: "SEAL-LAB-083",
    assuranceLevel: "Level 2",
    status: "valid"
  },
  {
    id: "LAB-2026-084",
    facilityId: "FASKES-02",
    facilityName: "RSUD Bhakti Husada",
    sourceId: "LIS-SYS-01",
    sourceName: "Sysmex XN-1000 Hematology",
    specimenId: "SPEC-8804",
    encounterId: "ENC-2026-003",
    patientPseudoId: "PASIEN-3344",
    test: "Hitung Leukosit (WBC)",
    value: 16800,
    unit: "/\xB5L",
    referenceRange: "4.000 - 11.000",
    isAbnormal: true,
    sampledAt: "2026-10-12T14:10:00Z",
    receivedAt: "2026-10-12T14:35:00Z",
    payloadHash: "bbccddeeff00112233445566778899aabbccddeeff00112233445566778899aa",
    sealId: "SEAL-LAB-084",
    assuranceLevel: "Level 2",
    status: "valid"
  },
  {
    id: "LAB-2026-085",
    facilityId: "FASKES-01",
    facilityName: "RS Siloam Sejahtera",
    sourceId: "LIS-ROCHE-03",
    sourceName: "Cobas 6000 Clinical Chemistry",
    specimenId: "SPEC-8805",
    encounterId: "ENC-2026-006",
    patientPseudoId: "PASIEN-9012",
    test: "Ureum Darah",
    value: 142,
    unit: "mg/dL",
    referenceRange: "15 - 45",
    isAbnormal: true,
    sampledAt: "2026-10-14T06:30:00Z",
    receivedAt: "2026-10-14T07:05:00Z",
    payloadHash: "c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8",
    sealId: "SEAL-LAB-085",
    assuranceLevel: "Level 2",
    status: "valid"
  }
];
function createInitialClaim(raw, prevSealHash) {
  const sealSource = raw._originalUntampered ? { ...raw, ...raw._originalUntampered } : raw;
  const leaves = buildClaimLeaves({
    encounterId: sealSource.encounterId,
    patientPseudoId: sealSource.patientPseudoId,
    admitDate: sealSource.admitDate,
    dischargeDate: sealSource.dischargeDate,
    inacbgCode: sealSource.inacbgCode,
    severity: sealSource.severity,
    billedAmount: sealSource.billedAmount,
    items: sealSource.items,
    resumeText: sealSource.resumeText,
    labRefs: sealSource.labRefs,
    version: sealSource.currentVersion
  });
  const seal = createSeal({
    kind: "claim",
    refId: raw.id,
    version: raw.currentVersion,
    leaves,
    prevSealHash,
    createdAt: raw.createdAt
  });
  const partialClaim = {
    ...raw,
    seal,
    findings: [],
    riskScore: 0,
    riskBand: "Rendah",
    fastTrack: true
  };
  const evalResult = evaluateClaimRules(partialClaim);
  return {
    claim: {
      ...partialClaim,
      findings: evalResult.findings,
      riskScore: evalResult.riskScore,
      riskBand: evalResult.riskBand,
      fastTrack: evalResult.fastTrack
    },
    seal
  };
}
const seed1 = createInitialClaim(
  {
    id: "CLM-001",
    claimNumber: "CLM-2026-001",
    facilityId: "FASKES-01",
    facilityName: "RS Siloam Sejahtera",
    encounterId: "ENC-2026-001",
    patientPseudoId: "PASIEN-1234",
    patientAge: 29,
    patientGender: "L",
    admitDate: "2026-10-10",
    dischargeDate: "2026-10-13",
    losDays: 3,
    inacbgCode: "D-4-10-I",
    inacbgDescription: "Demam Berdarah Dengue Ringan (Rawat Inap)",
    severity: 1,
    billedAmount: 435e4,
    primaryDiagnosis: { code: "A91", name: "Dengue Hemorrhagic Fever" },
    secondaryDiagnoses: [{ code: "R50.9", name: "Demam Tidak Terspesifikasi" }],
    procedures: [{ code: "89.52", name: "Elektrokardiogram (EKG)" }],
    specialItems: [],
    items: [
      { code: "AKOM-RI-1", description: "Akomodasi Rawat Inap Kelas 1 (3 hari)", amount: 18e5 },
      { code: "VISIT-DR-SP", description: "Visite Dokter Spesialis Penyakit Dalam", amount: 9e5 },
      { code: "OBAT-INF-RL", description: "Cairan Ringer Laktat & Obat Simptomatis", amount: 11e5 },
      { code: "LAB-PAKET-DBD", description: "Pemeriksaan Darah Rutin & Trombosit Serial", amount: 55e4 }
    ],
    resumeText: "Pasien masuk dengan keluhan demam tinggi 4 hari disertai nyeri sendi dan ruam ptekie. Trombosit awal 78.000 /\xB5L, leukosit 3.400 /\xB5L. Diberikan resusitasi cairan kristaloid RL 1.500 mL/24 jam. Hari ke-3 demam turun bebas, nafsu makan membaik, trombosit naik menjadi 135.000 /\xB5L. Pasien dipulangkan dalam kondisi stabil.",
    currentVersion: 1,
    status: "disetujui",
    labRefs: [
      {
        labResultId: "LAB-2026-081",
        labSealHash: "4f7b2c9e110298ea330081bf447dca98822901aa7789d02334b0eecc71829abc",
        testName: "Trombosit",
        value: 78e3,
        unit: "/\xB5L"
      }
    ],
    createdAt: "2026-10-13T10:00:00Z",
    updatedAt: "2026-10-13T10:00:00Z"
  },
  "0".repeat(64)
);
const seed2 = createInitialClaim(
  {
    id: "CLM-002",
    claimNumber: "CLM-2026-002",
    facilityId: "FASKES-01",
    facilityName: "RS Siloam Sejahtera",
    encounterId: "ENC-2026-002",
    patientPseudoId: "PASIEN-5566",
    patientAge: 46,
    patientGender: "P",
    admitDate: "2026-10-11",
    dischargeDate: "2026-10-15",
    losDays: 4,
    inacbgCode: "D-4-10-II",
    inacbgDescription: "Anemia Berat Derajat Sedang-Tinggi (Rawat Inap)",
    severity: 2,
    billedAmount: 89e5,
    primaryDiagnosis: { code: "D64.9", name: "Anemia Berat Gravis" },
    secondaryDiagnoses: [{ code: "K29.7", name: "Gastritis Erosif" }],
    procedures: [{ code: "44.13", name: "Gastroskopi Diagnostik" }],
    specialItems: [],
    items: [
      { code: "AKOM-RI-2", description: "Akomodasi Perawatan Rawat Inap 4 Hari", amount: 32e5 },
      { code: "VISIT-SP-PD", description: "Visite Spesialis Penyakit Dalam", amount: 16e5 },
      { code: "TND-ENDOSKOPI", description: "Tindakan Endoskopi Saluran Cerna", amount: 28e5 },
      { code: "MEDS-ORAL", description: "Obat Oral Sukralfat & Multivitamin Fe", amount: 13e5 }
    ],
    resumeText: "Pasien datang mengeluh badan mudah lelah dan pusing berputar sejak 1 minggu. Pasien memiliki riwayat dispepsia kronis. Dilakukan gastroskopi tampak gastritis erosif ringan. Nilai laboratorium Hb tercatat 11.4 g/dL. Diberikan suplemen oral zat besi dan antasida. Tidak ada indikasi transfusi darah selama perawatan. Keluhan membaik saat keluar.",
    currentVersion: 1,
    status: "ditelaah",
    labRefs: [
      {
        labResultId: "LAB-2026-082",
        labSealHash: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
        testName: "Hemoglobin (Hb)",
        value: 11.4,
        unit: "g/dL"
      }
    ],
    createdAt: "2026-10-15T11:20:00Z",
    updatedAt: "2026-10-15T11:20:00Z"
  },
  seed1.seal.sealHash
);
const seed3 = createInitialClaim(
  {
    id: "CLM-003",
    claimNumber: "CLM-2026-003",
    facilityId: "FASKES-02",
    facilityName: "RSUD Bhakti Husada",
    encounterId: "ENC-2026-003",
    patientPseudoId: "PASIEN-3344",
    patientAge: 24,
    patientGender: "L",
    admitDate: "2026-10-12",
    dischargeDate: "2026-10-16",
    losDays: 4,
    inacbgCode: "B-4-14-I",
    inacbgDescription: "Prosedur Apendektomi Ringan (Paket Bedah)",
    severity: 1,
    billedAmount: 112e5,
    primaryDiagnosis: { code: "K35.8", name: "Apendisitis Akut Lainnya" },
    secondaryDiagnoses: [],
    procedures: [{ code: "47.09", name: "Apendektomi Terbuka Lainnya" }],
    specialItems: [],
    items: [
      { code: "PAKET-INA-B414I", description: "Paket Tarif INA-CBG Apendektomi", amount: 84e5 },
      { code: "KASA-HEMOSTATIK", description: "Kasa Hemostatik Surgicel Penahan Perdarahan", amount: 135e4 },
      { code: "JARUM-HEMO", description: "Jarum Jahit Khusus Benang Vicryl Operasi", amount: 85e4 },
      { code: "DRAPING-SET", description: "Draping Set Steril Kamar Operasi Bedah", amount: 6e5 }
    ],
    resumeText: "Pasien dirawat dengan apendisitis akut perforasi fokal. Dilakukan operasi apendektomi darurat pada 12 Oktober 2026 jam 19.30 WIB. Operasi berjalan lancar perdarahan minimal (50 cc). Pasien rawat bangsal 3 hari pasca operasi, drain dicabut hari ke-3, flatus positif, luka operasi kering. Pasien pulang rawat jalan.",
    currentVersion: 1,
    status: "klarifikasi",
    clarifications: [
      {
        id: "CLR-001",
        requestedAt: "2026-10-16T16:02:18Z",
        requestedBy: "dr. Budi Setiawan, Sp.PK (Admin & Verifikator)",
        question: "Ditemukan item kasa hemostatik & jarum jahit ditagihkan terpisah dari paket INA-CBG B-4-14-I (Aturan B1). Mohon konfirmasi rincian tindakan atau lakukan revisi item tagihan."
      }
    ],
    labRefs: [
      {
        labResultId: "LAB-2026-084",
        labSealHash: "bbccddeeff00112233445566778899aabbccddeeff00112233445566778899aa",
        testName: "Hitung Leukosit (WBC)",
        value: 16800,
        unit: "/\xB5L"
      }
    ],
    createdAt: "2026-10-16T14:40:00Z",
    updatedAt: "2026-10-16T14:40:00Z"
  },
  seed2.seal.sealHash
);
const seed4 = createInitialClaim(
  {
    id: "CLM-004",
    claimNumber: "CLM-2026-004",
    facilityId: "FASKES-02",
    facilityName: "RSUD Bhakti Husada",
    encounterId: "ENC-2026-004",
    patientPseudoId: "PASIEN-7711",
    patientAge: 53,
    patientGender: "L",
    admitDate: "2026-10-13",
    dischargeDate: "2026-10-18",
    losDays: 5,
    inacbgCode: "D-4-10-I",
    inacbgDescription: "Demam Tifoid Ringan (Rawat Inap)",
    severity: 1,
    billedAmount: 145e5,
    // Disengaja diubah pada salinan faskes
    primaryDiagnosis: { code: "A01.0", name: "Demam Tifoid" },
    secondaryDiagnoses: [],
    procedures: [],
    specialItems: [],
    items: [
      { code: "AKOM-RI-VIP", description: "Akomodasi Ruang VIP (Tagihan Digelembungkan)", amount: 95e5 },
      { code: "OBAT-SPECIAL", description: "Obat Injeksi Tambahan Non-Formularium", amount: 5e6 }
    ],
    _originalUntampered: {
      billedAmount: 45e5,
      items: [
        { code: "AKOM-RI-1", description: "Akomodasi Rawat Inap Kelas 1 (5 Hari)", amount: 25e5 },
        { code: "OBAT-STD", description: "Terapi Antibiotik Ceftriaxone 2g/hari & Infus", amount: 2e6 }
      ],
      resumeText: "Pasien tifoid rawat inap 5 hari. Terapi ceftriaxone 2 gram/hari. Pasien dipulangkan dalam kondisi afebris dan klinis stabil."
    },
    _tamperedData: {
      billedAmount: 145e5,
      items: [
        { code: "AKOM-RI-VIP", description: "Akomodasi Ruang VIP (Tagihan Digelembungkan)", amount: 95e5 },
        { code: "OBAT-SPECIAL", description: "Obat Injeksi Tambahan Non-Formularium", amount: 5e6 }
      ],
      resumeText: "Pasien tifoid rawat inap 5 hari. Terapi ceftriaxone 2 gram/hari. [Catatan faskes: Berkas tagihan ini dimodifikasi secara sepihak setelah penyerahan segel awal]"
    },
    resumeText: "Pasien tifoid rawat inap 5 hari. Terapi ceftriaxone 2 gram/hari. [Catatan faskes: Berkas tagihan ini dimodifikasi secara sepihak setelah penyerahan segel awal]",
    currentVersion: 1,
    status: "ditelaah",
    labRefs: [],
    isTampered: true,
    tamperReason: "Leaf #1 (Data Terstruktur & Billed Amount) dan Leaf #2 (Rincian Tagihan) tidak cocok dengan hash segel vault!",
    createdAt: "2026-10-18T16:00:00Z",
    updatedAt: "2026-10-18T16:00:00Z"
  },
  seed3.seal.sealHash
);
const seed5 = createInitialClaim(
  {
    id: "CLM-005",
    claimNumber: "CLM-2026-005",
    facilityId: "FASKES-01",
    facilityName: "RS Siloam Sejahtera",
    encounterId: "ENC-2026-005",
    patientPseudoId: "PASIEN-8899",
    patientAge: 62,
    patientGender: "P",
    admitDate: "2026-10-14",
    dischargeDate: "2026-10-21",
    losDays: 7,
    inacbgCode: "A-4-10-II",
    inacbgDescription: "Sepsis Berat Tanpa Ventilasi (Rawat Inap)",
    severity: 2,
    billedAmount: 168e5,
    primaryDiagnosis: { code: "A41.9", name: "Sepsis, Tidak Terspesifikasi" },
    secondaryDiagnoses: [],
    // F-SEV2 triggered (Severity >= 2 tanpa dx sekunder)
    procedures: [{ code: "96.04", name: "Pemasangan Kateter Vena Sentral" }],
    specialItems: [{ code: "SP", name: "Special Procedure Central Line", amount: 25e5 }],
    items: [
      { code: "ICU-CARE-4D", description: "Perawatan Ruang Intensif HCU 4 Hari", amount: 9e6 },
      { code: "AKOM-RI-3D", description: "Perawatan Ruang Perawatan Biasa 3 Hari", amount: 33e5 },
      { code: "PROC-CVC", description: "Tindakan Kanulasi CVC", amount: 25e5 },
      { code: "MEDS-SUPPORT", description: "Cairan Ringer Fundin & Parasetamol Infus", amount: 2e6 }
    ],
    resumeText: "Pasien lansia 62 tahun dirujuk dengan penurunan kesadaran somnolen dan febris. Didiagnosis kerja sepsis. Pemeriksaan lab vault menunjukkan Leukosit 7.200 /\xB5L (dalam rentang normal 4.000-11.000). Pasien tidak mendapatkan terapi antibiotik definitif intravena selama perawatan, hanya cairan hidrasi kristaloid.",
    currentVersion: 2,
    status: "ditelaah",
    labRefs: [
      {
        labResultId: "LAB-2026-083",
        labSealHash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        testName: "Hitung Leukosit (WBC)",
        value: 7200,
        unit: "/\xB5L"
      }
    ],
    createdAt: "2026-10-21T09:30:00Z",
    updatedAt: "2026-10-22T13:00:00Z"
  },
  seed4.seal.sealHash
);
const seed6 = createInitialClaim(
  {
    id: "CLM-006",
    claimNumber: "CLM-2026-006",
    facilityId: "FASKES-01",
    facilityName: "RS Siloam Sejahtera",
    encounterId: "ENC-2026-006",
    patientPseudoId: "PASIEN-9012",
    patientAge: 58,
    patientGender: "L",
    admitDate: "2026-10-15",
    dischargeDate: "2026-10-18",
    losDays: 3,
    inacbgCode: "N-4-10-I",
    inacbgDescription: "Gagal Ginjal Kronik & Hemodialisis Reguler",
    severity: 1,
    billedAmount: 62e5,
    primaryDiagnosis: { code: "N18.5", name: "Penyakit Ginjal Kronik Stadium 5" },
    secondaryDiagnoses: [{ code: "I10", name: "Hipertensi Esensial" }],
    procedures: [{ code: "39.95", name: "Hemodialisis" }],
    specialItems: [{ code: "SI", name: "Special Investigation USG Ginjal", amount: 12e5 }],
    items: [
      { code: "TND-HD", description: "Tindakan Hemodialisis 2 Sesi", amount: 36e5 },
      { code: "AKOM-RI-HD", description: "Akomodasi Observasi Post-HD", amount: 14e5 },
      { code: "MEDS-EPO", description: "Erythropoietin (EPO) Injeksi 3000 IU", amount: 12e5 }
    ],
    resumeText: "Pasien PGK On HD reguler 2x seminggu. Datang untuk sesi dialisis rutin dan evaluasi akses fistula AV cimino. Laboratorium ureum 142 mg/dL, kreatinin 8.2 mg/dL. HD berjalan lancar tanpa hipotensi intradialitik. Pasien rawat inap 3 hari karena keluhan edema ekstremitas.",
    currentVersion: 1,
    status: "menunggu_verifikasi",
    labRefs: [
      {
        labResultId: "LAB-2026-085",
        labSealHash: "c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8",
        testName: "Ureum Darah",
        value: 142,
        unit: "mg/dL"
      }
    ],
    createdAt: "2026-10-18T17:00:00Z",
    updatedAt: "2026-10-18T17:00:00Z"
  },
  seed5.seal.sealHash
);
const INITIAL_CLAIMS = [
  seed1.claim,
  seed2.claim,
  seed3.claim,
  seed4.claim,
  seed5.claim,
  seed6.claim
];
const INITIAL_SEALS = [
  seed1.seal,
  seed2.seal,
  seed3.seal,
  seed4.seal,
  seed5.seal,
  seed6.seal
];
const INITIAL_AUDIT_LOGS = [
  {
    id: "LOG-001",
    actor: "dr. Rina Puspita",
    role: "faskes",
    action: "PENGAJUAN_KLAIM",
    ref: "CLM-2026-001",
    details: "Pengajuan klaim baru DBD Ringan dan penerbitan Segel Merkle V1.",
    timestamp: "2026-10-13T10:00:05Z"
  },
  {
    id: "LOG-002",
    actor: "dr. Budi Setiawan",
    role: "admin",
    action: "VERIFIKASI_FAST_TRACK",
    ref: "CLM-2026-001",
    details: "Verifikasi segel Merkle UTUH, skor risiko 10. Persetujuan Fast-Track terbit.",
    timestamp: "2026-10-13T10:35:12Z"
  },
  {
    id: "LOG-003",
    actor: "dr. Rina Puspita",
    role: "faskes",
    action: "PENGAJUAN_KLAIM",
    ref: "CLM-2026-002",
    details: "Pengajuan klaim Anemia Berat Severity 2 dan penyegelan kriptografis.",
    timestamp: "2026-10-15T11:20:00Z"
  },
  {
    id: "LOG-004",
    actor: "dr. Budi Setiawan",
    role: "admin",
    action: "TANDAI_TELAAH",
    ref: "CLM-2026-002",
    details: "Aturan U1 terdeteksi: Hb vault 11.4 g/dL melebihi ambang anemia berat tanpa transfusi. Klaim ditandai Telaah Medis.",
    timestamp: "2026-10-15T14:15:30Z"
  },
  {
    id: "LOG-005",
    actor: "dr. Ahmad Santoso",
    role: "faskes",
    action: "PENGAJUAN_KLAIM",
    ref: "CLM-2026-003",
    details: "Pengajuan klaim Apendektomi Bedah Digestif B-4-14-I.",
    timestamp: "2026-10-16T14:40:00Z"
  },
  {
    id: "LOG-006",
    actor: "dr. Budi Setiawan",
    role: "admin",
    action: "MINTA_KLARIFIKASI",
    ref: "CLM-2026-003",
    details: "Aturan B1 terdeteksi: Kasa hemostatik & jarum jahit ditagih terpisah dari paket INA-CBG. Verifikator meminta klarifikasi faskes.",
    timestamp: "2026-10-16T16:02:18Z"
  },
  {
    id: "LOG-007",
    actor: "dr. Budi Setiawan",
    role: "admin",
    action: "DETEKSI_SEGEL_RUSAK",
    ref: "CLM-2026-004",
    details: "Peringatan Integritas Kritis: Perbedaan Merkle root working copy terhadap segel awal. Aturan R-SEAL terpicu.",
    timestamp: "2026-10-18T16:05:00Z"
  }
];
const NATIONAL_INSIGHTS = {
  metadata: {
    datasetName: "Data Sampel BPJS Kesehatan FKRTL Edisi 2025 (Tahun Layanan 2024)",
    totalVisits: 1699219,
    uniquePatients: 1214880,
    totalFacilities: 2842,
    legalNotice: "Data Sampel BPJS Kesehatan (ter-deidentifikasi). Angka analitik disajikan hanya dalam bentuk agregat statistik. Hasil model ML merupakan indikasi telaah pola klinis, bukan penentuan kecurangan mutlak."
  },
  summary: {
    inpatientVisits: 193711,
    inpatientPercent: 11.4,
    outpatientVisits: 1505508,
    outpatientPercent: 88.6,
    avgLosInpatient: 3.42,
    severityDistribution: [
      { level: "Severity 1 (Ringan)", count: 1400156, percent: 82.4, color: "#10b981" },
      { level: "Severity 2 (Sedang)", count: 205605, percent: 12.1, color: "#f59e0b" },
      { level: "Severity 3 (Berat)", count: 81562, percent: 4.8, color: "#ef4444" },
      { level: "Severity 4 (Kritis/Khusus)", count: 11896, percent: 0.7, color: "#8b5cf6" }
    ]
  },
  signals: [
    {
      id: "F-SEV2",
      name: "Severity 2+ Tanpa Diagnosis Sekunder",
      count: 94036,
      percent: 5.53,
      description: "Kasus dengan kode severity sedang/berat tanpa satupun kode diagnosis sekunder penyerta.",
      status: "Perhatian Khusus"
    },
    {
      id: "LOS-OUTLIER",
      name: "Lama Rawat (LOS) Menyimpang Outlier",
      count: 42180,
      percent: 2.48,
      description: "Lama rawat aktual melebihi >3 hari dari ekspektasi model prediksi peer group INA-CBG.",
      status: "Pola Anomali"
    },
    {
      id: "SPECIAL-ITEMS",
      name: "Intensitas Special Items (SA/SP/RR/SI/SD) Tinggi",
      count: 12279,
      percent: 0.72,
      description: "Proporsi special items > 40% dari total tagihan klaim INA-CBG faskes.",
      status: "Perlu Konfirmasi"
    },
    {
      id: "PAIRED-ENCOUNTERS",
      name: "Kunjungan Berimpit Pasien Sama (\u2264 7 Hari)",
      count: 1876,
      percent: 0.11,
      description: "Terdeteksi 1.876 pasang kunjungan pada 1.841 pasien di faskes yang sama dengan tanggal berdekatan.",
      status: "Potensi Fragmentasi"
    },
    {
      id: "REPEATED-VISITORS",
      name: "Volume Kunjungan Berulang Tinggi (>5x / Tahun)",
      count: 207099,
      percent: 12.19,
      description: "Pasien kronis/terapi berkala yang membutuhkan kontinuitas pemantauan perawatan.",
      status: "Monitoring Rutin"
    }
  ],
  mlEvaluation: {
    description: "Evaluasi Model Prediksi vs Label Pendekatan Selisih Tagihan & Verifikasi (1.631 Kasus Terverifikasi)",
    models: [
      {
        modelName: "Model A: Gradient Boosting (Lama Rawat Residual)",
        type: "Interpretable White-box ML",
        features: "INA-CBG Dasar, Severity, Umur, Jenis Kelamin, Kelas Faskes, Jumlah Dx Sekunder",
        liftAt100: "3.42x",
        precisionAt100: "32.8%",
        liftAt1000: "2.18x",
        precisionAt1000: "21.8%"
      },
      {
        modelName: "Model B: Isolation Forest (Gabungan Multi-Fitur 1-5)",
        type: "Unsupervised Anomaly Scoring",
        features: "Fitur 1-5 gabungan (tanpa mengikutsertakan tarif mentah)",
        liftAt100: "4.15x",
        precisionAt100: "39.8%",
        liftAt1000: "2.84x",
        precisionAt1000: "28.4%"
      },
      {
        modelName: "Baseline Pembanding: Peringkat Berdasarkan LOS Saja",
        type: "Heuristic Baseline",
        features: "Hanya lama rawat tanpa penyesuaian peer",
        liftAt100: "1.45x",
        precisionAt100: "14.5%",
        liftAt1000: "1.18x",
        precisionAt1000: "11.8%"
      }
    ]
  },
  scaleTest: {
    description: "Uji Skala Penyegelan Kriptografis Sintetis (Ed25519 & Merkle Tree Root)",
    benchmarks: [
      {
        volume: "50.000 Klaim Sintetis",
        totalTimeSeconds: 12.8,
        timePerThousandMs: 256,
        avgVerificationTimeMs: 4.2,
        merkleDepth: 4,
        tamperDetectionRate: "100.0%"
      },
      {
        volume: "100.000 Klaim Sintetis",
        totalTimeSeconds: 24.2,
        timePerThousandMs: 242,
        avgVerificationTimeMs: 4.1,
        merkleDepth: 4,
        tamperDetectionRate: "100.0%"
      }
    ]
  }
};
export {
  INITIAL_AUDIT_LOGS,
  INITIAL_CLAIMS,
  INITIAL_LAB_RESULTS,
  INITIAL_SEALS,
  INITIAL_USERS,
  NATIONAL_INSIGHTS
};
