# VeriMed

> **Platform Integritas & Verifikasi Kriptografis Klaim Pelayanan Kesehatan**  
> Solusi pencegahan fraud, audit trail bukti digital tak terbantahkan (*tamper-evident*), dan telaah klaim klinis berbasis bukti (*evidence-grounded AI*).

---

## 🌟 Fitur Utama

- **Penyegelan Kriptografis (Ed25519 & Merkle Trees)**: Setiap berkas klaim dan hasil laboratorium disegel dengan hash pohon Merkle deterministik dan tanda tangan digital untuk mendeteksi manipulasi seketika.
- **Deteksi Anomali & Aturan Klaim Nasional**: Mesin evaluasi aturan otomatis untuk mendeteksi *upcoding*, *unbundling*, ketidaksesuaian tingkat keparahan (*severity*), dan integritas data.
- **Integrasi Model AI Dinamis (BYOK - Bring Your Own Key)**:
  - Dukungan multi-provider: Google Gemini, OpenAI, Anthropic, dan OpenAI-Compat endpoint.
  - Pemindaian model aktif secara langsung (*live model discovery*) sesuai hak akses kunci API.
  - Validasi uji asap (*smoke test*) riil sebelum aktivasi model.
- **Jaminan Ketersediaan Fallback Deterministik**: Jika kuota AI habis atau jaringan bermasalah, sistem otomatis beroperasi pada mode fallback berbasis aturan ICD-10 Indonesia dan regex tanpa henti.
- **Pemisahan Peran Berbasis RBAC**: Alur kerja aman terpisah antara Admin/Verifikator Nasional dan Petugas Fasilitas Kesehatan (Faskes).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion (Framer Motion), Lucide Icons
- **Backend**: Express.js, TypeScript, Node.js Crypto (AES-256-GCM, SHA-256)
- **Tooling**: Vite, tsx

---

## 🚀 Memulai (Local Setup)

### Prasyarat
- Node.js (v18 ke atas)
- npm

### Instalasi & Menjalankan Aplikasi

1. **Clone repositori**:
   ```bash
   git clone https://github.com/Jefersen/verimed.git
   cd verimed
   ```

2. **Instal dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   Salin berkas `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Opsional: Isi `GEMINI_API_KEY` jika ingin langsung mengaktifkan kunci server default).*

4. **Jalankan Aplikasi dalam Mode Pengembangan**:
   ```bash
   npm run dev
   ```
   Buka peramban Anda di `http://localhost:3000`.

---

## 📜 Skrip yang Tersedia

- `npm run dev`: Menjalankan server Express dan Vite SPA development server.
- `npm run build`: Membangun bundle produksi.
- `npm run lint`: Memeriksa tipe data dengan TypeScript (`tsc --noEmit`).
- `npm test`: Menjalankan suite pengujian unit kriptografi dan aturan klaim.

---

## 📄 Lisensi
Hak Cipta © 2026 VeriMed. Seluruh hak cipta dilindungi undang-undang.
