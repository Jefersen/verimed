# PRD VeriMed AI: Versi 2.0 (Produk dan Teknis)

Dokumen kebutuhan produk dan teknis | Healthkathon 2026 | Versi 2.0, pasca lolos proposal (per 23 Oktober 2026) | Bukti klaim: data sintetis. Analitik: Data Sampel BPJS Kesehatan, hanya agregat.

## 1. Ringkasan

**Sistem.** VeriMed AI menyegel klaim dan hasil lab saat masuk (hash, Merkle root, tanda tangan, rantai append-only), menjalankan ekstraksi teks resume (AI atau fallback aturan) dan rule engine untuk menyorot upcoding dan unbundling beserta bukti, dan sejak versi 2.0 menjalankan analitik pola klaim berbasis ML pada Data Sampel BPJS Kesehatan. Keputusan akhir di verifikator.

**Cakupan sampai 1 November 2026 (video dan demo):** simulator hasil lab/LIS, vault bersegel, pengajuan dan revisi klaim, verifikasi segel, rule engine U1 dan B1 sampai B2, dashboard dua peran, Mode Demo, halaman Wawasan Data Sampel (agregat), dan koneksi AI (kunci API dengan pemilihan model manual; pemilihan otomatis bila waktu cukup). **Cakupan sampai Demo Day (21 November, tentatif):** aturan U2, U3, dan B3, pemilihan model otomatis, uji skala, dan penguatan stabilitas demo.

**Di luar cakupan:** integrasi mesin lab, VClaim, SatuSehat atau sistem BPJS asli; PKI penuh; Level 3 (bukti asal pengukuran dari mesin); data peserta JKN riil; pengiriman data sampel ke layanan eksternal apa pun.

**Batas klaim keamanan (wajib dipatuhi di kode dan antarmuka):** segel membuktikan apa yang diterima dan kapan, bukan keaslian pengukuran di sumber. Dilarang memakai klaim tamper-proof.

**Perubahan dari versi 1.0:**

- Modul Analitik Data Sampel (bagian 20) dan halaman Wawasan Data Sampel yang hanya membaca keluaran agregat.
- Aturan U3 dan B3 tidak lagi membandingkan tarif: tarif paket INA-CBG seragam (p99 rasio tagih terhadap median peer = 1,00). Pembandingnya lama rawat dan special items terhadap peer INA-CBG.
- Label selisih biaya tagih dan verifikasi dipakai berstrata dan ditulis sebagai label pendekatan (0,096% positif, bias ke rawat inap).
- Skema klaim sintetis mengikuti struktur FKRTL (kode INA-CBG, severity, lama rawat, diagnosis primer dan sekunder, special items).
- Data sampel hanya diproses lokal; tidak ada panggilan LLM atau layanan eksternal pada data sampel; folder data di luar repositori.
- Rencana kerja dipadatkan ke tenggat 1 November 2026.

## 2. Sasaran dan metrik keberhasilan

| Sasaran | Metrik (target prototype, belum terbukti) |
|---|---|
| Perubahan setelah segel terdeteksi | 100% pada skenario uji tamper (berkas, item tagihan, nilai lab, rantai) |
| Ekstraksi benar | Precision dan recall pada 20 kasus sintetis berlabel, dilaporkan apa adanya |
| False positive rule engine | Dilaporkan per aturan; target awal 10% atau kurang pada data uji sintetis |
| Analitik data sampel | Lift dan precision@K per strata terhadap label pendekatan; dilaporkan apa adanya beserta keterbatasan label |
| Uji skala segel | 50.000 sampai 100.000 klaim sintetis disegel; waktu per 1.000 klaim dan total dicatat |
| Waktu segel klaim | 300 ms atau kurang untuk klaim 10 berkas |
| Waktu verifikasi segel | 500 ms atau kurang |
| Analisis dengan AI | 25 detik atau kurang; mode fallback 2 detik atau kurang |
| Kunci API | Tidak pernah muncul di log, respons, atau repositori |
| Data sampel | Tidak ada baris mentah di UI, video, slide, repositori, maupun log |

## 3. Arsitektur

```
[Streamlit UI]  --HTTP-->  [FastAPI backend]
   Faskes / Verifikator / Admin      |
                                     +-- Ingestion lab (validasi, dedupe, level jaminan)
                                     +-- Claim service (segel, versi, verifikasi)
                                     +-- Crypto (kanonisasi, Merkle, Ed25519, rantai)
                                     +-- Extraction (LLM adapter + fallback regex)
                                     +-- Rule engine (YAML) + risk scoring
                                     +-- Insights reader (membaca keluaran agregat analitik)
                                     +-- AI connection (kunci terenkripsi, daftar model, auto-pilih)
                                     +-- Audit log, demo seeder
                                     |
              [SQLite]  [keys/ Ed25519]  [storage/ berkas]  [insights/ JSON agregat]
                                                                    ^
 [Analitik offline, komputer lokal] ---------------------------------+
   Data Sampel BPJS (di luar repo) -> fitur -> model -> agregat saja

 (opsional) Penyedia LLM: Anthropic / OpenAI / Gemini / kompatibel OpenAI
   hanya untuk data sintetis; tidak pernah menerima data sampel
```

**Alur hasil lab:** simulator kirim pesan bertanda HMAC, API validasi, hitung hash, buat seal, simpan, tampil di viewer faskes.

**Alur klaim:** faskes kirim klaim + berkas + rujukan ID hasil lab, API hitung daun hash, Merkle root, seal, simpan, lalu analisis (ekstraksi, rule engine, skor), antrian verifikator.

**Alur verifikasi:** verifikator ambil nilai lab dari vault berdasarkan ID, hitung ulang hash berkas yang diperlihatkan, bandingkan dengan seal, tampilkan cocok atau tidak cocok beserta daun yang berubah.

**Alur analitik (baru):** skrip offline membaca Data Sampel di komputer lokal, membentuk fitur, melatih model, lalu menulis hanya berkas agregat (summary.json, strata.json, signals.json, evaluation.json, scale_test.json) ke folder insights/. Backend dan halaman Wawasan Data Sampel hanya membaca berkas itu. Tidak ada baris mentah, tidak ada folder data di server atau repositori.

## 4. Bahan-bahan teknis dan kegunaannya

### 4.1 Perangkat lunak

| Bahan | Fungsi di sistem |
|---|---|
| Python 3.11 | Bahasa utama backend, UI, dan skrip evaluasi |
| FastAPI | Kerangka REST API; dokumentasi OpenAPI otomatis untuk uji dan demo |
| Uvicorn | Server ASGI untuk menjalankan FastAPI |
| Pydantic v2 | Skema permintaan/respons dan validasi keluaran LLM |
| SQLAlchemy 2 + SQLite | Penyimpanan data prototype (dapat diganti PostgreSQL); trigger SQLite menegakkan append-only |
| cryptography | Ed25519 (tanda tangan seal) dan Fernet (enkripsi kunci API di database) |
| hashlib (bawaan) | SHA-256 untuk daun hash, node Merkle, hash seal |
| httpx | Klien HTTP async untuk memanggil API penyedia LLM dengan batas waktu |
| tenacity | Percobaan ulang terbatas pada panggilan LLM |
| PyYAML | Memuat aturan (rules.yaml), paket (packages.yaml), kebijakan model (model_policy.yaml), kamus istilah |
| pypdf atau pdfplumber | Mengambil teks dari PDF resume medis |
| qrcode | QR untuk ID hasil lab dan klaim |
| Streamlit | UI multipage cepat untuk prototype |
| pandas dan scikit-learn | Tabel UI, hitung precision, recall, false positive rate |
| Faker + skrip seeder | Membuat data sintetis kasus bersih, upcoding, unbundling, tamper |
| pytest | Pengujian unit dan alur utama |
| python-dotenv | Memuat variabel lingkungan dari .env |
| Docker (opsional) | Menjalankan seluruh sistem dengan satu perintah |

### 4.2 Bahan data dan konfigurasi

| Bahan | Isi | Untuk apa | Penyiap atau validator |
|---|---|---|---|
| data/seed_cases.json | 15 sampai 20 kasus sintetis berlabel; skema klaim mengikuti FKRTL | Demo dan evaluasi bukti klaim | Tim; label oleh koder atau dokter bila ada |
| config/rules.yaml | Aturan U1 sampai U3, B1 sampai B3, F-SEV2, bobot | Rule engine | Tim; ambang klinis divalidasi |
| config/packages.yaml | Paket tindakan dan item yang termasuk (contoh sintetis) | Aturan B1 | Koder; rujukan resmi |
| config/terms_id.yaml | Kamus istilah Indonesia dan Inggris, singkatan | Fallback ekstraksi dan normalisasi | Tim dan dokter |
| config/ranges.yaml | Rentang wajar nilai lab dan satuan | Validasi ingestion | Dokter; rujukan resmi |
| config/model_policy.yaml | Pola nama model per tingkat | Pemilihan model otomatis | Tim |
| config/sources.yaml | Sumber terdaftar dan rahasia HMAC | Level jaminan 2 | Tim |
| Data Sampel BPJS Edisi 2025 (di luar repo) | FKRTL 2024 (1.699.219 baris), diagnosis sekunder (1.967.670), kepesertaan (2.590.751) | Analitik offline | Diperoleh lewat portal; dibaca per kolom dan chunk |
| icd10_info_dxmasuk.dta, icd10_info_dxprimer.dta, icd10_info.dta, icd10_info_pnk.dta | Kamus ID bilangan bulat ke kode ICD-10 3 digit; ID 9999 = tidak diketahui | Nama diagnosis dan peer group | Pakai versi .dta; 3 ID diagnosis primer (A78, G73, Q97) berbeda dari .xlsx |
| .env | Rahasia aplikasi dan konfigurasi | Kunci enkripsi, URL, mode | Setiap pengembang; tidak masuk repositori |

## 5. Struktur repositori

```
verimed/
  backend/
    app/main.py, config.py, db.py, models.py
    app/crypto/              # canonical.py, merkle.py, seal.py
    app/services/            # lab.py, claims.py, extract.py, rules.py, insights.py
    app/ai/providers/        # anthropic.py, openai.py, gemini.py, compat.py
    app/ai/selector.py, keystore.py
    app/api/                 # lab, claims, vault, rules, insights, settings, demo, audit
    tests/
  analytics/                 # BARU: berjalan offline di komputer lokal
    load.py                  # baca Data Sampel per kolom + chunk
    features.py              # fitur 1 sampai 5 dan label pendekatan
    models.py                # model lama rawat, Isolation Forest
    evaluate.py              # lift dan precision@K berstrata
    export.py                # tulis insights/*.json (agregat saja)
    scale_test.py            # uji skala penyegelan sintetis
  ui/
    Home.py, pages/          # termasuk Wawasan_Data_Sampel.py
    styles.css
  insights/                  # keluaran agregat (boleh masuk repo); data mentah TIDAK
  config/  data/  keys/  storage/
  scripts/seed.py, evaluate.py
  .env.example  .gitignore  docker-compose.yml  README.md
```

## 6. Model data

Semua waktu disimpan UTC (ISO 8601) dan ditampilkan WIB. ID berupa ULID atau UUID.

| Tabel | Kolom utama | Catatan |
|---|---|---|
| users | id, name, role (faskes, verifikator, admin), facility_id | Akun demo; bukan autentikasi produksi |
| facilities | id, name, class (kelas RS), region | Sintetis; dipakai benchmark B3 |
| sources | id, facility_id, name, kind (analyzer, lis), hmac_secret_hash, registered | Dasar Level 2 |
| lab_results | id, source_id, specimen_id, encounter_id, patient_pseudo_id, test, value, unit, sampled_at, received_at, payload_json, payload_hash, seal_id, assurance_level, status | Immutable (trigger) |
| claims | id, facility_id, encounter_id, patient_pseudo_id, admit_date, discharge_date, severity, tariff_claimed, diagnoses_json, procedures_json, resume_text, current_version, created_at | Baris induk |
| claim_versions | id, claim_id, version, snapshot_json, reason, created_by, created_at, seal_id | Immutable; revisi = baris baru |
| claim_items | id, claim_id, version, item_code, description, amount | Rincian tagihan per versi |
| files | id, claim_id, version, filename, mime, size, sha256, storage_path | Isi berkas di storage, hash di DB |
| lab_refs | claim_id, version, lab_result_id, lab_seal_hash | Mengikat klaim ke seal hasil lab |
| seals | id, kind (lab, claim), ref_id, version, merkle_root, prev_seal_hash, seal_hash, signature, key_id, created_at | Append-only (trigger) |
| findings | id, claim_id, version, rule_id, type, evidence_json, confidence, weight, created_at | Hasil rule engine |
| analyses | id, claim_id, version, extraction_json, extraction_mode (ai, fallback), model_id, risk_score, risk_band, created_at | Hasil analisis per versi |
| decisions | id, claim_id, version, actor, decision (telaah, klarifikasi, setujui), note, created_at | Keputusan verifikator |
| audit_log | id, actor, role, action, ref, detail_json, created_at | Append-only |
| settings | key, value_encrypted, updated_at | Berisi kunci API terenkripsi dan pilihan model |
| ai_models_cache | provider, model_id, display_name, created_at_provider, tier, flags_json, fetched_at | Cache daftar model |
| faskes_working_copy | claim_id, version, snapshot_json, updated_at | Salinan yang dapat diubah, mewakili berkas yang diperlihatkan faskes saat audit (untuk demo tamper) |

**Penegakan append-only.** Trigger SQLite BEFORE UPDATE dan BEFORE DELETE pada seals, lab_results, claim_versions, audit_log yang memanggil RAISE(ABORT). Koreksi hanya lewat baris atau versi baru.

**Catatan demo tamper.** Perubahan oleh faskes disimulasikan pada faskes_working_copy dan salinan vault demo (vault_demo_copy), bukan pada tabel asli, sehingga vault asli tetap utuh.

**Tambahan versi 2.0.** Tabel `icd10_codes` (id_int, kode3, nama_en, sumber_file); ID 9999 diperlakukan sebagai missing. Skema klaim sintetis mengikuti FKRTL: `inacbg_code`, `severity` (1 sampai 4, digit terakhir kode INA-CBG), `los_days`, `dx_primary_icd3`, `dx_secondary_icd3[]`, `special_items` (SA, SP, RR, SI, SD), `billed_amount`, dan `verified_amount` (kosong pada klaim baru). Hasil analitik tidak disimpan di database, tetapi sebagai berkas JSON di folder insights/.

## 7. Modul kriptografi dan penyegelan

### 7.1 Kanonisasi

Payload diubah menjadi JSON kanonik: UTF-8, kunci diurutkan, tanpa spasi, nilai uang berupa bilangan bulat rupiah, waktu ISO 8601 UTC. Fungsi yang sama dipakai saat menyegel dan memverifikasi.

### 7.2 Daun hash dan Merkle root

- Daun = SHA-256(0x00 + byte kanonik), simpul dalam = SHA-256(0x01 + kiri + kanan); simpul ganjil dibawa naik tanpa diduplikasi.
- Daun klaim (urutan tetap): (1) data terstruktur klaim, (2) setiap item tagihan berurutan kode, (3) setiap berkas (SHA-256 isi + nama), (4) setiap rujukan lab (ID + lab_seal_hash), (5) metadata versi.
- Daun hasil lab: satu daun payload kanonik.
- Menyimpan daftar daun (label + hash) bersama seal agar verifikasi dapat menunjuk daun yang berubah.

### 7.3 Seal dan rantai

- seal_hash = SHA-256(prev_seal_hash + merkle_root + kind + ref_id + version + created_at). Seal pertama memakai prev berupa 64 nol.
- signature = Ed25519(seal_hash) dengan kunci privat server; key_id disimpan pada seal.
- Rantai global: setiap seal menunjuk seal terakhir (apa pun jenisnya).

### 7.4 Verifikasi

1. Hitung ulang daun dari data dan berkas yang diperlihatkan (atau dari working copy).
2. Bandingkan Merkle root dengan seal; bila berbeda, laporkan daun yang tidak cocok (nama berkas, kode item, atau nilai).
3. Verifikasi tanda tangan dengan kunci publik sesuai key_id.
4. Verifikasi rantai: setiap seal_hash dihitung ulang dan prev cocok. Hasil: UTUH atau RUSAK di blok N.

### 7.5 Manajemen kunci

- Kunci Ed25519 dibuat otomatis saat pertama jalan dan disimpan di keys/ (izin 600), terpisah dari database dan tidak masuk repositori.
- Kunci publik tersedia di GET /vault/public-key; kunci lama dipertahankan untuk verifikasi seal lama (rotasi lewat key_id).
- Produksi: kunci di HSM atau KMS dan operator independen (di luar cakupan prototype).

### 7.6 Waktu

Cap waktu berasal dari jam server. Ini bukan cap waktu terpercaya pihak ketiga. Perluasan: RFC 3161 atau penjangkaran root harian (di luar cakupan).

## 8. Ingestion hasil lab (simulator LIS)

**Pesan masuk (POST /lab-results):** source_id, specimen_id, encounter_id, patient_pseudo_id, test, value, unit, sampled_at, timestamp, signature (HMAC-SHA256 dari payload kanonik + timestamp dengan rahasia sumber).

**Validasi (urut):**

1. Skema Pydantic lengkap dan tipe benar.
2. Source terdaftar? Ya: periksa HMAC dan selisih timestamp 5 menit atau kurang, lolos berarti Level 2. Tidak terdaftar atau HMAC gagal: tetap diterima sebagai Level 1 dengan peringatan, atau ditolak sesuai konfigurasi.
3. Dedupe: kunci = SHA-256(source_id + specimen_id + test + sampled_at); duplikat ditolak (status 409) dan dicatat sebagai percobaan replay.
4. Rentang wajar dari ranges.yaml; di luar rentang masuk status karantina (disegel tetapi bertanda perlu ditinjau).
5. Pasangan specimen, encounter, dan pasien konsisten dengan hasil sebelumnya pada encounter yang sama; tidak cocok berarti karantina.

**Level jaminan:** Level 1 (tercatat dan utuh sejak diterima), Level 2 (sumber terdaftar dan HMAC valid). Tidak ada Level 3. Setiap respons menyertakan teks batas: 'Segel membuktikan apa yang diterima dan kapan, bukan keaslian pengukuran di sumber.'

## 9. Pipeline klaim

**Pengajuan (POST /claims, multipart):** JSON klaim + berkas + daftar ID hasil lab. Layanan memeriksa bahwa ID lab ada dan milik encounter yang sama, mengambil lab_seal_hash, membentuk daun, membuat seal versi 1, menyimpan, lalu memicu analisis.

**Revisi (POST /claims/{id}/revise):** membuat versi baru yang menunjuk seal sebelumnya; menghitung diff (item, berkas, diagnosis); wajib memiliki alasan. Aturan R-AUDIT menandai klaim bila ada revisi setelah permintaan klarifikasi atau audit.

**Verifikasi (POST /claims/{id}/verify):** sesuai 7.4, dengan sumber pembanding berkas yang diunggah ulang atau faskes_working_copy.

**Keputusan:** hanya verifikator; tersimpan di decisions dan audit_log. Tidak ada penolakan otomatis.

## 10. Ekstraksi teks (AI dengan fallback)

**Tujuan:** mengubah resume medis berbahasa Indonesia menjadi entitas terstruktur.

**Keluaran wajib (skema Pydantic):** diagnoses[], procedures[], comorbidities[], medications[], findings[]. Setiap entitas berisi teks asli (kutipan), bentuk normal, petunjuk ICD-10 bila ada, penanda negasi, posisi awal dan akhir kutipan, dan tingkat keyakinan.

**Prompt (garis besar):**

- Sistem: Anda adalah pengekstrak entitas klinis. Hanya kembalikan JSON sesuai skema. Kutipan harus salinan persis dari teks. Jangan menyimpulkan di luar teks. Tandai negasi (misalnya: tidak ada, disangkal).
- Pengguna: teks resume + skema.
- Parameter: suhu 0, maksimum token 1.000, batas waktu 20 detik.

**Validasi pascapanggilan:**

1. JSON valid terhadap skema; bila gagal, satu kali perbaikan dengan pesan galat, lalu dihentikan.
2. Setiap kutipan wajib ditemukan persis di teks resume; entitas yang kutipannya tidak ada dibuang (mencegah halusinasi).
3. Entitas yang dinegasi tidak dihitung sebagai diagnosis aktif.

**Fallback:** bila tidak ada kunci, AI dimatikan, atau panggilan gagal, gunakan pencocokan kamus (terms_id.yaml) dan regex. Hasil ditandai extraction_mode = fallback dan tampil di UI.

**Cache:** kunci = SHA-256(teks + model_id + versi prompt).

**Perlindungan data sebelum panggilan eksternal:** pola 16 digit (NIK) dan pola nomor telepon diganti penanda; hanya ID pseudonim yang boleh ada. Bila lolos pemeriksaan, teks tidak dikirim dan fallback dipakai. Prototype hanya untuk data sintetis; data riil memerlukan model on-premise atau cloud pemerintah.

## 11. Rule engine dan skor risiko

### 11.1 Format aturan (rules.yaml)

```
- id: U1
  name: Anemia berat tanpa dukungan lab dan terapi
  type: upcoding
  weight: 40
  when:
    - diagnosis: anemia berat
    - lab: {test: hemoglobin, op: '>', value: THRESHOLD_ANEMIA_BERAT}
    - absent: {any_of: [transfusi, packed red cell]}
  evidence: [kutipan_teks, nilai_lab_vault, terapi_tercatat]
  rujukan: '[isi sesuai PPK / rujukan klinis resmi]'

- id: B1
  name: Item termasuk paket ditagih terpisah
  type: unbundling
  weight: 35
  when:
    - package_contains_separate_item: true
  evidence: [kode_paket, kode_item_terpisah]
```

Nilai ambang (THRESHOLD_...) adalah placeholder yang harus diisi dari rujukan resmi dan divalidasi dokter.

### 11.2 Daftar aturan

| ID | Jenis | Logika ringkas |
|---|---|---|
| U1 | Upcoding | Diagnosis anemia berat, tetapi Hb dari vault melebihi ambang dan tidak ada transfusi pada terapi (lapisan sintetis) |
| U2 | Upcoding | Diagnosis infeksi berat atau sepsis, tetapi tidak ada penanda infeksi atau kultur dan tidak ada antibiotik (lapisan sintetis) |
| U3 | Upcoding | Lama rawat aktual menyimpang jauh dari yang diharapkan untuk grup INA-CBG dan severity yang sama (selisih terhadap model lama rawat; pembanding peer, bukan tarif) |
| F-SEV2 | Upcoding (sinyal, bukan aturan keras) | Severity (FKL23) 2 atau lebih tanpa diagnosis sekunder; menandai sekitar 5,5% kunjungan di data sampel, jadi hanya berbobot kecil |
| B1 | Unbundling | Item yang termasuk dalam paket (packages.yaml) ditagih sebagai baris terpisah dalam encounter yang sama (lapisan sintetis) |
| B2 | Unbundling | Beberapa klaim pasien pseudonim sama di faskes sama dengan tanggal berimpit atau berjarak N hari atau kurang (N dapat dikonfigurasi); pada data sampel ditemukan 1.876 pasang kunjungan berimpit |
| B3 | Unbundling | Intensitas special items (SA, SP, RR, SI, SD) atau lama rawat menyimpang dari faskes sekelas pada grup INA-CBG yang sama; tidak memakai tarif karena tarif paket seragam |
| R-AUDIT | Integritas | Revisi setelah permintaan klarifikasi atau audit |
| R-SEAL | Integritas | Segel tidak cocok atau rantai rusak |

### 11.3 Skor risiko

- Skor = min(100, jumlah (bobot aturan x keyakinan)); R-SEAL menambah 50 dan memaksa pita Tinggi.
- Pita: Rendah di bawah 30, Sedang 30 sampai 69, Tinggi 70 ke atas. Angka ini awal dan harus dikalibrasi pada data uji.
- Fast-track: segel cocok, skor di bawah 30, tidak ada R-AUDIT.
- Setiap temuan menyimpan jejak bukti: kutipan teks, aturan dan rujukan, nilai pembanding dari vault. Tidak ada keluaran tanpa bukti.

## 12. Koneksi AI: kunci API dan pemilihan model otomatis

### 12.1 Alur pengguna

1. Admin membuka halaman Pengaturan Koneksi AI, memilih penyedia, menempel kunci API, menekan Hubungkan.
2. Backend memeriksa kunci dengan memanggil endpoint daftar model penyedia.
3. Daftar model disaring, diberi tingkat, dan disimpan di ai_models_cache.
4. Selector memilih model terbaik pada tingkat terpilih (default Seimbang) dan menguji dengan satu ekstraksi sintetis berstruktur.
5. Bila lolos, model disimpan sebagai aktif beserta alasan dan dua cadangan; bila gagal, kandidat berikutnya dicoba (maksimum 3).
6. UI menampilkan hasil, dan chip di bar atas berubah menjadi 'Ekstraksi: AI (nama model)'.

### 12.2 Adaptor penyedia

Antarmuka bersama: list_models(), complete_json(model, system, user, schema, max_tokens, timeout), ping().

| Penyedia | Daftar model | Panggilan generasi | Autentikasi |
|---|---|---|---|
| Anthropic | GET https://api.anthropic.com/v1/models | POST /v1/messages | Header x-api-key dan anthropic-version |
| OpenAI | GET https://api.openai.com/v1/models | POST /v1/chat/completions | Header Authorization Bearer |
| Google Gemini | GET https://generativelanguage.googleapis.com/v1beta/models | POST /v1beta/models/{model}:generateContent | Header x-goog-api-key |
| Kompatibel OpenAI | GET {base_url}/models | POST {base_url}/chat/completions | Bearer |

Catatan: bentuk respons dan nama bidang dapat berubah; adaptor harus dilindungi uji dengan respons tiruan, dan dokumentasi resmi penyedia menjadi acuan saat implementasi.

### 12.3 Penyaringan model

- Gemini: hanya model yang mendukung generateContent.
- OpenAI dan kompatibel: buang id yang memuat embedding, whisper, tts, dall-e, moderation, image, audio, realtime, transcribe, dan sejenisnya (daftar di model_policy.yaml).
- Semua: buang model yang ditandai usang bila penyedia menyediakannya.

### 12.4 Algoritma pemilihan otomatis

1. **Klasifikasi tingkat** dengan pola nama dari model_policy.yaml: Hemat (contoh: haiku, mini, nano, flash-lite), Terbaik (contoh: opus, pro, ultra, max), sisanya Seimbang (contoh: sonnet, flash). Pola dapat diedit tanpa mengubah kode.
2. **Urutkan** kandidat tingkat terpilih berdasarkan tanggal rilis dari penyedia (bila ada), kalau tidak berdasarkan nomor versi yang diurai dari id.
3. **Utamakan alias** tanpa sufiks tanggal bila tersedia; hindari id berakhiran preview, exp, experimental, beta kecuali tidak ada pilihan lain.
4. **Uji asap:** ekstraksi pada satu kalimat resume sintetis; lolos bila keluaran valid terhadap skema dan semua kutipan ada di teks.
5. **Simpan:** model aktif, alasan (teks singkat), cadangan 1 dan 2, tingkat, waktu pemilihan.
6. **Penyegaran:** tombol Segarkan dan tugas terjadwal setiap 24 jam saat kunci valid; pada mode otomatis, pemilihan dihitung ulang, pada mode manual pilihan pengguna dipertahankan.
7. **Failover:** bila model aktif mengembalikan galat tidak ditemukan atau tidak tersedia, pindah otomatis ke cadangan, catat di audit_log, dan tampilkan toast.

### 12.5 Penyimpanan kunci

- Kunci dienkripsi dengan Fernet memakai APP_SECRET dari lingkungan dan disimpan di tabel settings. Tanpa APP_SECRET, aplikasi menolak menyimpan kunci.
- API hanya mengembalikan connected, provider, key_hint (4 karakter terakhir), jumlah model, model aktif, waktu uji. Kunci tidak pernah dikembalikan.
- Kunci dimurnikan dari log dan pesan galat (pemfilter log dan penangan pengecualian).
- Variabel LLM_PROVIDER dan LLM_API_KEY di lingkungan server mengesampingkan pengaturan UI (UI menampilkan 'Kunci dari environment' dan mengunci kolom).
- Hapus kunci: menimpa nilai terenkripsi, menghapus cache model, memutuskan koneksi, dan mencatat di audit_log.
- Akses endpoint pengaturan dibatasi peran admin; batas laju 10 permintaan per menit.

### 12.6 Penanganan galat

| Kondisi | Perilaku |
|---|---|
| 401 atau 403 | Kunci ditolak; pesan 'Kunci tidak valid atau tidak punya akses'; tidak ada penyimpanan |
| 429 | Pesan batas laju; percobaan ulang dengan jeda maksimum 2 kali |
| Waktu habis atau jaringan | Pesan jaringan; tidak mengubah koneksi yang sudah ada |
| Tidak ada model teks | Kunci disimpan sebagai valid tetapi mode AI tidak aktif; pesan jelas |
| Uji asap gagal pada semua kandidat | Mode fallback aktif, banner kuning, tercatat di audit |

## 13. Spesifikasi API

Autentikasi prototype: token sesi berdasarkan akun demo (peran faskes, verifikator, admin). Semua respons galat memakai bentuk seragam (kode, pesan, rincian).

| Metode dan jalur | Peran | Fungsi |
|---|---|---|
| POST /lab-results | faskes | Terima hasil lab, segel, kembalikan ID, hash, level |
| GET /lab-results, /lab-results/{id} | faskes, verifikator | Daftar dan detail (read-only) |
| POST /claims | faskes | Ajukan klaim, segel versi 1, picu analisis |
| POST /claims/{id}/revise | faskes | Revisi sebagai versi baru |
| GET /claims, /claims/{id} | semua | Daftar dan detail klaim |
| POST /claims/{id}/verify | verifikator | Hitung ulang dan bandingkan dengan segel |
| POST /claims/{id}/analyze | verifikator | Jalankan ulang ekstraksi dan aturan |
| POST /claims/{id}/decision | verifikator | Simpan keputusan manusia |
| GET /vault, /vault/verify-chain, /vault/public-key | verifikator, admin | Daftar blok, periksa rantai, kunci publik |
| GET /rules, PUT /rules/{id}/toggle | verifikator, admin | Lihat dan aktif/nonaktifkan aturan |
| GET /audit | verifikator, admin | Log audit dengan filter |
| GET /settings/ai | admin | Status koneksi (tanpa kunci) |
| POST /settings/ai/connect | admin | Terima provider, api_key, base_url opsional; periksa kunci, ambil model, pilih otomatis |
| GET /settings/ai/models | admin | Daftar model dengan tingkat dan tanda |
| PUT /settings/ai/model | admin | Atur mode (auto atau manual), tingkat, dan model manual |
| POST /settings/ai/refresh | admin | Segarkan daftar model dan pemilihan |
| POST /settings/ai/test | admin | Uji model aktif; kembalikan waktu respons dan contoh keluaran |
| PUT /settings/ai/enabled | admin | Aktifkan atau matikan AI ekstraksi |
| DELETE /settings/ai | admin | Hapus kunci dan putuskan |
| POST /demo/seed, /demo/reset | admin, presenter | Isi atau reset data contoh |
| POST /demo/tamper-lab, /demo/tamper-claim-item, /demo/tamper-vault | presenter | Simulasi perubahan pada salinan |

**Endpoint tambahan versi 2.0 (hanya baca):**

| Metode dan jalur | Peran | Fungsi |
|---|---|---|
| GET /insights/summary | verifikator, admin | Ringkasan agregat dari insights/summary.json |
| GET /insights/strata | verifikator, admin | Metrik per strata |
| GET /insights/signals | verifikator, admin | Jumlah kunjungan per sinyal (sel kurang dari 10 disembunyikan) |
| GET /insights/evaluation | verifikator, admin | Lift dan precision@K beserta pembanding |
| GET /insights/scale-test | verifikator, admin | Hasil uji skala penyegelan |
| GET /icd10/{id} | semua | Nama diagnosis dari tabel icd10_codes |

Contoh respons status koneksi (tanpa kunci):

```
{
  "connected": true,
  "provider": "anthropic",
  "key_hint": "a1b2",
  "models_count": 8,
  "mode": "auto",
  "tier": "seimbang",
  "active_model": "<id model terpilih>",
  "reason": "Model terbaru tingkat Seimbang yang lolos uji keluaran terstruktur",
  "fallbacks": ["<id cadangan 1>", "<id cadangan 2>"],
  "key_source": "ui",
  "tested_at": "2026-10-11T12:00:00Z"
}
```

## 14. Keamanan dan privasi

| Area | Ketentuan |
|---|---|
| Data | Hanya sintetis; banner DATA SINTETIS; tidak ada data peserta JKN riil tanpa izin resmi |
| UU PDP | Minimisasi data, pseudonimisasi ID pasien, akses berbasis peran, jejak audit; produksi: data di infrastruktur BPJS atau pemerintah |
| Akses | RBAC pada setiap endpoint sesuai tabel API; faskes tidak punya hak ubah atau hapus pada data tersegel |
| Rahasia | APP_SECRET, kunci Ed25519, kunci API tidak ada di repositori; .env.example tanpa nilai nyata |
| Berkas | Batas 5 MB; tipe pdf, txt, json; periksa magic number; nama berkas dibersihkan |
| Jaringan | HTTPS saat dipublikasikan; CORS dibatasi; batas laju pada endpoint pengaturan dan ingestion |
| LLM | Tidak ada PII ke penyedia; data hanya sintetis; kunci tidak masuk log; keluaran divalidasi dan kutipan diverifikasi |
| Audit | Semua aksi penting tercatat dan tidak dapat diubah |
| Dependensi | Versi dikunci (requirements.txt), pemindaian kerentanan dasar sebelum rilis |

Ancaman yang diakui: manipulasi sebelum data diterima (tidak terdeteksi oleh segel; ditangani lewat pengecekan silang), kompromi kunci penandatangan, administrator yang berniat buruk (ditangani lewat pemisahan tugas pada produksi), replay (dedupe dan HMAC dengan timestamp).

**Tambahan versi 2.0 (aturan panitia dan data sampel):**

- Data Sampel hanya untuk Healthkathon, tidak disebarkan ke luar tim, disimpan di luar repositori (.gitignore) dan tidak ada di server demo.
- Tidak ada baris data mentah di UI, video, slide, atau log; hanya agregat. Usulan: sembunyikan sel dengan kurang dari 10 kunjungan.
- Analitik berjalan lokal; tidak ada panggilan LLM atau layanan eksternal pada data sampel.
- Bagian yang memakai data sampel berlabel Data Sampel BPJS Kesehatan (ter-deidentifikasi), bukan sintetis.
- Judul penelitian pada pakta integritas sama persis dengan judul di proposal, slide, dan video.
- Hasil analitik tidak dinyatakan sebagai kecurangan.

## 15. Pengujian dan evaluasi

**Uji unit dan integrasi (pytest):**

- Kanonisasi stabil dan deterministik.
- Merkle root konsisten; perubahan satu daun mengubah root.
- Seal dan rantai: perubahan satu blok membuat verifikasi rantai melaporkan blok yang benar.
- Trigger append-only menolak UPDATE dan DELETE.
- Ingestion: HMAC valid dan tidak valid, duplikat, di luar rentang, inkonsistensi encounter.
- Ekstraksi: validator menolak kutipan yang tidak ada; negasi tidak dihitung; fallback aktif tanpa kunci.
- Rule engine: setiap aturan punya kasus positif dan negatif.
- Pemilih model dengan daftar model tiruan untuk tiap penyedia: pemilihan tingkat, preferensi alias, failover.
- Kunci API tidak muncul di log, respons, maupun pesan galat.
- Alur ujung ke ujung mengikuti skrip demo.

**Evaluasi (scripts/evaluate.py):** membaca seed_cases.json berlabel, menjalankan analisis, menghitung precision, recall, false positive rate per aturan dan keseluruhan, serta perbandingan rule-only dengan rule + AI; menulis laporan (tabel dan CSV). Hasil dilaporkan apa adanya pada slide Bagian 5.

**Komposisi data uji:** kasus bersih, upcoding U1/U2/U3, unbundling B1/B2, tamper (berkas, item, nilai lab), dan kasus tepi (Hb awal rendah lalu transfusi, revisi sah).

**Pengujian analitik (baru):** (1) jumlah baris dan kunci unik sama dengan inventaris (1.699.219 kunjungan, FKL02 tanpa duplikat); (2) join diagnosis sekunder tanpa orphan; (3) FKL23 konsisten dengan digit terakhir FKL19; (4) keluaran insights/*.json lolos skema dan tidak memuat PSTV01, FKL02, atau sel kecil; (5) hasil model stabil terhadap seed acak; (6) metrik dilaporkan per strata beserta ukuran sampel; (7) scale_test.py mencatat waktu segel per 1.000 klaim.

## 16. Konfigurasi dan menjalankan

| Variabel (.env) | Fungsi |
|---|---|
| APP_SECRET | Kunci Fernet untuk mengenkripsi kunci API (wajib untuk menyimpan kunci) |
| DATABASE_URL | Default sqlite:///verimed.db |
| STORAGE_DIR, KEYS_DIR | Lokasi berkas dan kunci |
| LLM_PROVIDER, LLM_API_KEY, LLM_BASE_URL | Opsional; mengesampingkan pengaturan UI |
| LLM_TIMEOUT, LLM_MAX_TOKENS | Default 20 detik dan 1.000 token |
| HMAC_SKEW_SECONDS | Default 300 |
| FALLBACK_ONLY | true untuk memaksa mode aturan |
| DEMO_MODE | true menampilkan menu Mode Demo |

Perintah umum: pasang dependensi, jalankan scripts/seed.py, jalankan backend dengan Uvicorn, jalankan UI Streamlit, jalankan pytest. Opsi docker-compose menjalankan backend dan UI sekaligus.

## 17. Rencana pengerjaan

| Tahap | Isi | Tenggat | Hasil yang dapat didemokan |
|---|---|---|---|
| 1 | Alur inti stabil (segel, klaim, simulasi perubahan, verifikasi Tidak cocok) dan perbaikan Mode Demo | 25 Okt | Demo P0 berjalan |
| 2 | Pipeline analitik minimal (fitur 1 sampai 5, Isolation Forest, model lama rawat, lift@K) dan keluaran insights/*.json | 28 Okt | Angka agregat dari data nyata |
| 3 | Halaman Wawasan Data Sampel dan sorotan U1/U2 dengan bukti vault | 29 Okt | Dampak dan ML terlihat di UI |
| 4 | Model bisnis, uji skala, penjelasan LLM terikat bukti (opsional) | 30 Okt | Bahan video lengkap |
| 5 | Latihan penuh, rekam per adegan, edit, unggah YouTube Unlisted | 30-31 Okt | Video siap |
| 6 | Submit tautan di dashboard | 31 Okt (batas 1 Nov) | Bukti submit |
| 7 | Bila lolos 20 finalis: U2, U3, B3, pemilihan model otomatis, penguatan stabilitas | 2-17 Nov | Demo Day 21 Nov (tentatif) |

Jadwal mengikuti tenggat panitia (1 November 2026; jadwal November tentatif). Jika waktu mepet, potong penjelasan LLM dan pemilihan model otomatis lebih dulu; jangan memotong pipeline analitik minimal.

## 18. Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| Koneksi internet atau API LLM bermasalah saat demo | Mode fallback sebagai default; siapkan video rekaman |
| Format respons penyedia berubah | Adaptor per penyedia dengan uji tiruan; tombol Segarkan dan uji model |
| Halusinasi ekstraksi | Verifikasi kutipan terhadap teks; entitas tanpa kutipan dibuang |
| Ambang klinis salah | Placeholder bertanda jelas; validasi dokter atau rujukan resmi |
| Klaim berlebihan tentang keamanan | Teks batas wajib; kata terlarang diperiksa di UI |
| Waktu 9 hari tidak cukup | Urutan prioritas pada bagian 17; potong fitur opsional lebih dulu |
| Label analitik sangat jarang dan bias ke rawat inap | Evaluasi berstrata, lift@K, tulis keterbatasan label |
| Aturan severity 2 menandai sekitar 5,5% kunjungan | Hanya sinyal berbobot kecil; evaluasi false positive |
| Data mentah bocor di video, slide, atau repositori | Hanya agregat, .gitignore, tinjau sebelum unggah |
| Tautan unduh data sampel hanya berlaku 7 hari | Simpan salinan lokal yang aman; jangan dibagikan |

## 19. Pertanyaan terbuka

1. Apakah panitia mengizinkan agregat dari data sampel ditampilkan di video dan slide?
2. Apakah Demo Day live atau rekaman? Ini menentukan seberapa kuat mode fallback dan video cadangan.
3. Ambang klinis dan paket tindakan resmi apa yang menjadi acuan (perlu dokter atau koder).
4. Penyedia AI mana dan apakah ada anggaran kunci API; apakah penyedia eksternal boleh dipakai untuk data sintetis.
5. Arti PSTV16 (66% bernilai 2016) dan selisih jumlah bobot 302,1 juta dengan 282 juta penduduk.
6. Kerangka UI final (Streamlit atau React).

## 20. Modul Analitik Data Sampel (baru di versi 2.0)

Modul ini berjalan offline di komputer lokal anggota tim, membaca Data Sampel BPJS Kesehatan, dan menulis hanya berkas agregat. Tujuannya memberi bukti dampak dari data nasional dan porsi ML untuk kriteria Kreativitas, Dampak, dan Kesiapan Produk. Hasilnya indikasi untuk telaah, bukan penilaian kecurangan.

### 20.1 Data masukan

| File | Kolom dibaca | Catatan |
|---|---|---|
| 202403_fkrtl.dta | PSTV01, PSTV15, FKL02, FKL03, FKL04, FKL08, FKL13, FKL14, FKL17A, FKL18, FKL19, FKL23, FKL30, FKL32, kolom special items FKL33 sampai FKL46, FKL47, FKL48 | 1.699.219 baris, 629 MB; baca per kolom dan chunk 300.000 baris; convert_categoricals=False |
| 202405_diagnosissekunder.dta | FKL02, kode diagnosis sekunder | 1.967.670 baris; dipakai menghitung jumlah diagnosis sekunder per kunjungan |
| 2015202401_kepesertaan.dta | PSTV01, PSTV03, PSTV05, PSTV09, PSTV15 | 2.590.751 baris; umur, jenis kelamin, provinsi |
| icd10_info_dxprimer.dta dan icd10_info_dxmasuk.dta | ID bilangan bulat ke kode 3 digit | ID 9999 diperlakukan sebagai missing |

### 20.2 Praproses

- Kunci kunjungan FKL02 dan kunci pasien PSTV01; join diagnosis sekunder tanpa orphan.
- Lama rawat = FKL04 dikurangi FKL03 (hari); rawat inap bila lama rawat lebih dari 0 (11,4% kunjungan).
- Severity = FKL23 (1 sampai 4), konsisten dengan digit terakhir FKL19.
- Kode kosong special items ditulis literal NONE; hitung jumlah dan nilai special items per kunjungan.
- Peer group = grup dasar INA-CBG (FKL19 tanpa digit severity), jenis faskes (FKL08), dan severity.
- Bobot PSTV15 hanya untuk agregat populasi, bukan untuk melatih model.
- FKL31 tidak dipakai sebagai tarif per kasus; PSTV16 tidak dipakai sebagai tahun layanan sebelum artinya dicek.

### 20.3 Fitur

| # | Fitur | Sumber | Volume terverifikasi |
|---|---|---|---|
| 1 | Severity vs jumlah diagnosis sekunder | FKL23 + diagnosis sekunder | 94.036 kunjungan (5,53%) severity 2 atau lebih tanpa diagnosis sekunder |
| 2 | Lama rawat menyimpang dari peer INA-CBG | FKL03/04, FKL19, FKL13, FKL08 | Dihitung per grup |
| 3 | Intensitas special items di samping paket | FKL33 sampai FKL46 | 12.279 kunjungan (0,72%); bila dipakai, median 50% dari total tagihan |
| 4 | Kunjungan berimpit pasien sama | PSTV01 + FKL03/04 | 1.876 pasang, 1.841 pasien |
| 5 | Volume kunjungan berulang | PSTV01 | 207.099 pasien dengan lebih dari 1 kunjungan (maksimum 214) |
| 6 | Biaya tagih lebih besar dari biaya verifikasi (label, bukan fitur) | FKL47, FKL48 | 1.631 kunjungan (0,096%) |

### 20.4 Model

- **Model A (dapat dijelaskan):** gradient boosting memprediksi lama rawat dari grup INA-CBG dasar, severity, umur, jenis kelamin, jenis faskes, dan jumlah diagnosis sekunder. Sinyal = selisih lama rawat aktual dan prediksi, dinormalkan dengan sebaran residual per grup.
- **Model B:** Isolation Forest pada fitur 1 sampai 5 (tidak pada FKL47 mentah) untuk sinyal gabungan.
- **Alasan per kunjungan:** dua fitur yang paling menyimpang dari median peer ditulis sebagai kalimat templat, bukan keluaran LLM.
- **Pemisahan data:** latih dan uji dipisah per pasien agar tidak ada kebocoran antar kunjungan pasien yang sama; seed acak tetap.
- **Tidak ada** fine-tuning LLM dan tidak ada data sampel yang dikirim ke LLM.

### 20.5 Evaluasi

- **Label pendekatan:** FKL47 lebih besar dari FKL48 (1.631 kasus). Sekitar 82% berada di severity 2 dan rata-rata lama rawat 2,55 hari dibanding 0,39 hari pada populasi, sehingga label ini sebagian besar memisahkan rawat inap dari rawat jalan.
- **Wajib berstrata:** per grup INA-CBG dasar, atau per severity dan kelompok lama rawat (rawat inap dan rawat jalan dipisah).
- **Metrik:** lift@K dan precision@K (K = 100, 1.000, 10.000) terhadap prevalensi strata, disertai ukuran sampel.
- **Pembanding:** peringkat acak dan peringkat berdasarkan lama rawat saja. Model dianggap bernilai bila mengalahkan keduanya dalam strata.
- Laporkan apa adanya, termasuk bila lift mendekati 1.

### 20.6 Keluaran (folder insights/)

| Berkas | Isi |
|---|---|
| summary.json | Jumlah kunjungan dan pasien, distribusi severity, rawat inap, diagnosis sekunder (agregat) |
| strata.json | Per strata: n, prevalensi label, lift@K |
| signals.json | Jumlah kunjungan per sinyal dan ambang (sel kurang dari 10 disembunyikan) |
| evaluation.json | Lift dan precision@K model A, model B, dan pembanding |
| scale_test.json | Waktu penyegelan per 1.000 klaim sintetis dan total (50.000 sampai 100.000) |

Berkas tidak memuat PSTV01 maupun FKL02.

### 20.7 Klaim yang boleh dan tidak boleh

- **Boleh:** pada sampel FKRTL 2024 (1.699.219 kunjungan), sekian kunjungan memiliki sinyal tertentu; lift@K terhadap label pendekatan berstrata adalah sekian.
- **Tidak boleh:** menyebut hasil sebagai deteksi kecurangan; menyebut anemia berat terdeteksi dari data nyata (ICD-10 hanya 3 digit); memakai tarif sebagai sinyal; menampilkan baris mentah.

## 21. Kesesuaian dengan kriteria penilaian project

| Aspek | Dijawab oleh | Bukti yang ditunjukkan |
|---|---|---|
| Kreativitas dan Keunikan (GenAI/ML) | Segel dan sorotan beralasan; ekstraksi AI; model lama rawat dan Isolation Forest pada data nasional | Demo dan halaman Wawasan Data Sampel |
| Model Bisnis | Kerangka model bisnis pada Dokumen Induk bagian 11 | Slide model bisnis |
| Dampak | Angka agregat data sampel dan target pilot | Halaman Wawasan Data Sampel; evaluation.json |
| Presentasi dan Komunikasi | Video 7 bagian maksimal 10 menit | Video YouTube Unlisted |
| Kesiapan Produk | Uji skala, mode fallback, batas yang diakui jujur | scale_test.json; demo |
