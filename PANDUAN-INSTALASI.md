# Panduan Instalasi — Certiflow (Migrasi ke GitHub Pages)

Panduan ini mengasumsikan Anda **belum pernah** memakai Git/GitHub sebelumnya.
Ikuti berurutan dari Bagian 1.

---

## Bagian 1 — Pasang Backend (Google Apps Script)

1. Buka [script.google.com](https://script.google.com) → **Proyek baru**.
2. Hapus semua isi file `Code.gs` bawaan, ganti namanya jadi `Kode.gs` (klik titik
   tiga di sebelah nama file → Ganti nama), lalu **tempel** seluruh isi file
   `Kode.gs` yang diberikan terpisah di chat ini.
3. Di dropdown fungsi (sebelah tombol ▷ Jalankan), pilih **`setupAppEnvironment`**,
   lalu klik **Jalankan**. Google akan meminta izin akses (Drive, Sheets, Gmail,
   Slides) — klik **Izinkan**.
4. Buka **Execution log** (Ctrl+Enter atau menu Lihat → Log Eksekusi). Catat baris:
   ```
   👑 Admin pertama : nama@email-anda.com
   🔑 Password awal : xxxxxxxxxx   ← SALIN SEKARANG, tidak ditampilkan lagi.
   ```
   **Simpan password ini** — inilah kredensial login Admin pertama Anda.
5. Klik **Deploy** (pojok kanan atas) → **Deployment baru**:
   - Jenis: **Aplikasi Web**
   - Execute as: **Me (Anda)**
   - Who has access: **Anyone** (wajib, agar bisa diakses dari GitHub Pages)
   - Klik **Deploy**, lalu **salin URL `/exec`** yang muncul. Contoh:
     `https://script.google.com/macros/s/AKfycb.../exec`

> **Setiap kali Anda mengedit `Kode.gs`**, buat **Deployment baru** lagi (atau
> "Manage deployments" → edit versi) agar perubahan ikut ter-publish — sekadar
> menyimpan file saja tidak otomatis memperbarui URL yang sudah live.

---

## Bagian 2 — Konfigurasi Frontend

1. Ekstrak ZIP frontend yang diberikan.
2. Buka `js/config.js` dengan text editor, ganti baris:
   ```js
   const GAS_URL = 'https://script.google.com/macros/s/GANTI_DENGAN_ID_DEPLOYMENT_ANDA/exec';
   ```
   dengan URL `/exec` dari Bagian 1 langkah 5.
3. (Opsional) Coba dulu secara lokal: buka `index.html` langsung di browser
   (klik dua kali) untuk cek tampilan login muncul dengan benar sebelum di-deploy.

---

## Bagian 3 — Deploy ke GitHub Pages

> **Penting — baca dulu sebelum mulai:** folder yang Anda `git init` **harus**
> folder hasil ekstraksi ZIP itu sendiri (yang isinya langsung `index.html`,
> `public.html`, `css/`, `js/` — **bukan** folder pembungkus lain). Jalankan
> `dir` (Windows) atau `ls` (Mac/Linux) dan pastikan `index.html` muncul
> langsung di baris hasilnya SEBELUM melanjutkan.

Ringkasan perintah (jalankan satu-satu di terminal, dari dalam folder frontend):

```bash
git init
git add .
git commit -m "Deploy awal Certiflow"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Lalu di GitHub: buka repo → **Settings → Pages** → Source: branch `main`,
folder `/ (root)` → **Save**. Situs Anda akan aktif di
`https://USERNAME.github.io/NAMA-REPO/` dalam 1–2 menit.

**Jika Anda baru pertama kali pakai Git** (belum install, belum punya akun
GitHub, belum tahu Personal Access Token, dsb.) — beri tahu saya di chat ini,
saya akan memandu setiap langkah satu per satu sambil menunggu hasil dari
Anda, termasuk cara mengatasi error yang mungkin muncul.

---

## Bagian 4 — Uji Coba

1. Buka `https://USERNAME.github.io/NAMA-REPO/index.html`.
2. Login sebagai Admin dengan email + password dari Bagian 1 langkah 4.
3. Buat template, struktur konten, acara, dan akun operator seperti biasa.
4. Login sebagai Operator di tab berbeda, lengkapi konten & publikasikan acara.
5. Buka tautan publik yang muncul (`.../public.html?event=...`) di jendela
   incognito untuk mensimulasikan peserta mendaftar.

## Troubleshooting Cepat

| Gejala | Penyebab | Solusi |
|---|---|---|
| Halaman tampil tanpa styling, Console (F12) menunjukkan 404 untuk `.css`/`.js` | Struktur folder rata di root (biasanya karena upload lewat web GitHub, bukan `git push`) | Deploy ulang via terminal (`git init` dari folder yang benar), jangan pakai tombol "Upload files" di web GitHub |
| Login gagal terus / data tidak muncul sama sekali | `GAS_URL` di `js/config.js` belum diisi atau salah | Cek ulang URL `/exec`, pastikan deployment Apps Script "Who has access" = **Anyone** |
| Error di konsol browser: `Failed to fetch` / CORS | Deployment GAS belum "Anyone", atau URL memakai `/dev` bukan `/exec` | Redeploy sebagai Web App baru, pastikan akses **Anyone** dan URL berakhiran `/exec` |
| Password admin awal hilang/lupa | Log eksekusi hanya menampilkan sekali | Buka sheet `Admins` di spreadsheet, hapus baris admin lama, jalankan `setupAppEnvironment()` lagi untuk dapat password baru |

Kalau Anda mentok di langkah mana pun — kirim screenshot pesan errornya di
chat ini, saya bantu telusuri.
