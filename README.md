# Certiflow — Certificate Generator (Frontend)

Frontend statis (HTML/CSS/JS murni, tanpa build step) untuk aplikasi
**Certiflow**, dirancang untuk di-hosting di **GitHub Pages** dan berbicara
ke backend **Google Apps Script** lewat REST API (arsitektur `gas-pro-api`).

## Struktur

```
├── index.html          ← Konsol Admin & Operator (SPA)
├── public.html         ← Form pendaftaran peserta (dibuka via ?event=ID)
├── css/style.css        ← Seluruh styling ("Vibrant Enterprise SaaS")
└── js/
    ├── config.js         ← ISI URL BACKEND ANDA DI SINI (GAS_URL)
    ├── api.js            ← Lapisan fetch() ke backend (jangan diedit)
    ├── common.js         ← Utilitas bersama (toast, modal, dll.)
    ├── console.js        ← Logika konsol Admin/Operator
    └── public.js         ← Logika form pendaftaran peserta
```

## Sebelum deploy

1. Deploy backend `Kode.gs` sebagai Google Apps Script Web App (lihat
   `PANDUAN-INSTALASI.md`) dan salin URL `/exec`-nya.
2. Buka `js/config.js`, ganti nilai `GAS_URL` dengan URL tersebut.
3. Push seluruh isi folder ini (bukan folder pembungkusnya) ke repository
   GitHub, aktifkan GitHub Pages dari branch `main` folder `root`.

## Alur pengguna

- **Peserta**: buka `public.html?event=ID_ACARA` (link ini otomatis
  dibuatkan oleh Operator dari menu "Publikasikan Tautan" di konsol).
- **Admin/Operator**: buka `index.html`, login dengan kredensial masing-masing.

## Catatan migrasi penting

- Login Admin **tidak lagi** memakai deteksi akun Google otomatis — sekarang
  email + password (tersimpan ter-hash di sheet `Admins`). Password awal
  dicetak di Execution Log Apps Script saat `setupAppEnvironment()` dijalankan.
- Tautan pendaftaran publik dibangun di sisi klien (`public.html?event=...`),
  bukan lagi dari URL `/exec` backend — karena backend sekarang murni API JSON.

Detail lengkap ada di `PANDUAN-INSTALASI.md`.
