/**
 * ============================================================
 * CERTIFICATE GENERATOR (Certiflow) — Mode Publik (public.html)
 * ============================================================
 * Form pendaftaran & generate sertifikat untuk peserta (tanpa login).
 * Dibuka via public.html?event=ID — window.PUBLIC_EVENT_ID diisi oleh
 * public.html dari query string ?event= sebelum file ini dimuat.
 * Aksi backend yang dipakai: getEventPublicInfo (GET, publik),
 * registerAndGenerate (POST, publik) — lihat js/api.js & Kode.gs.
 */

  /**
   * ============================================================
   * MODE PUBLIK — Halaman Pendaftaran & Generate Peserta
   * ============================================================
   * Tidak memakai sidebar/login. Dirender langsung ke #publicRoot
   * berdasarkan window.PUBLIC_EVENT_ID yang dikirim server dari doGet().
   */
  function initPublicMode() {
    const eventId = window.PUBLIC_EVENT_ID;
    if (!eventId) {
      renderPublicError('Tautan tidak valid. Parameter acara tidak ditemukan pada URL.');
      hideLoadingOverlay();
      return;
    }
  
    // Jaring pengaman: jika server tidak merespons dalam 15 detik (mis. cold-start
    // deployment baru, koneksi lambat, atau error tak terduga), tampilkan pesan
    // yang jelas + tombol coba lagi, alih-alih membiarkan halaman kosong selamanya.
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      hideLoadingOverlay();
      renderPublicError('Waktu tunggu habis saat memuat data acara. Ini bisa terjadi jika aplikasi baru saja di-deploy (butuh beberapa detik untuk "pemanasan"), atau koneksi internet lambat.');
      renderRetryButton();
    }, 15000);
  
    GAS()
      .withSuccessHandler(res => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        hideLoadingOverlay();
        if (!res || !res.success) { renderPublicError(res ? res.message : 'Respons server tidak valid.'); renderRetryButton(); return; }
        renderPublicRegistrationForm(eventId, res.data);
      })
      .withFailureHandler(err => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        hideLoadingOverlay();
        renderPublicError(err.message);
        renderRetryButton();
      })
      .getEventPublicInfo(eventId);
  }
  
  function renderRetryButton() {
    const root = document.getElementById('publicRoot');
    if (!root) return;
    root.insertAdjacentHTML('beforeend', `
      <div class="text-center" style="margin-top:14px;">
        <button class="btn btn-secondary btn-sm" onclick="location.reload()"><i class="bi bi-arrow-clockwise"></i> Muat Ulang Halaman</button>
      </div>`);
  }
  
  function renderPublicError(message) {
    const root = document.getElementById('publicRoot');
    if (!root) return;
    root.innerHTML = `
      <div class="public-card">
        <div class="public-body text-center">
          <div class="success-badge" style="background:var(--status-danger-bg);">
            <i class="bi bi-x-lg" style="color:var(--status-danger-text);font-size:26px;"></i>
          </div>
          <h1 style="font-size:19px;">Tidak Dapat Membuka Halaman</h1>
          <p class="text-muted">${escapeHtml(message)}</p>
        </div>
      </div>`;
  }
  
  function renderPublicRegistrationForm(eventId, ev) {
    document.getElementById('publicRoot').innerHTML = `
      <div class="public-card">
        <div class="public-hero">
          <span class="badge" style="background:rgba(255,255,255,0.2);color:#fff;">
            <i class="bi bi-qr-code"></i> Portal Pendaftaran Publik
          </span>
          <h1>${escapeHtml(ev.nama)}</h1>
          <div style="font-size:13px;opacity:0.9;">
            <i class="bi bi-calendar3"></i> ${formatDate(ev.tanggal)} &nbsp;•&nbsp;
            <i class="bi bi-building"></i> ${escapeHtml(ev.penyelenggara)}
          </div>
        </div>
        <div class="public-body">
          <form id="publicRegForm" onsubmit="event.preventDefault(); submitPublicRegistration('${eventId}');">
            <div class="form-group">
              <label class="form-label">Nama Lengkap <span class="req">*</span></label>
              <div class="input-with-icon">
                <span class="icon-prefix"><i class="bi bi-person"></i></span>
                <input type="text" class="form-control" id="pubNama" placeholder="Nama sesuai yang ingin dicetak" required>
              </div>
              <div class="form-hint">Akan tercetak persis pada sertifikat resmi Anda.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Alamat Email <span class="req">*</span></label>
              <div class="input-with-icon">
                <span class="icon-prefix"><i class="bi bi-envelope"></i></span>
                <input type="email" class="form-control" id="pubEmail" placeholder="nama@email.com" required>
              </div>
              <div class="form-hint">Salinan sertifikat akan dikirim ke email ini.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Peran / Sebagai Apa <span class="req">*</span></label>
              <select class="form-control" id="pubPeran" required>
                <option value="Peserta">Peserta</option>
                <option value="Pemateri">Pemateri</option>
                <option value="Panitia">Panitia</option>
                <option value="Moderator">Moderator</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Format Sertifikat</label>
              <div class="segmented" id="pubFormatSegmented">
                <button type="button" class="active" data-val="pdf" onclick="selectPubFormat(this,'pdf')">PDF</button>
                <button type="button" data-val="image" onclick="selectPubFormat(this,'image')">Gambar (PNG)</button>
                <button type="button" data-val="both" onclick="selectPubFormat(this,'both')">Keduanya</button>
              </div>
            </div>
            <div class="callout callout-info mt-16 mb-16">
              <i class="bi bi-shield-check" style="margin-top:1px;"></i>
              <div>Kebijakan Satu Kali Pendaftaran &mdash; setiap peserta hanya dapat men-generate satu sertifikat untuk acara ini. Pengiriman ulang dengan nama/email yang sama akan mengambil sertifikat yang sudah ada.</div>
            </div>
            <button type="submit" class="btn btn-primary btn-full" id="pubSubmitBtn">
              <i class="bi bi-lightning-charge-fill"></i> Generate Sertifikat Saya
            </button>
            <p class="text-center text-muted" style="font-size:12px;margin-top:10px;">Proses instan &bull; membutuhkan waktu sekitar 3&ndash;5 detik</p>
          </form>
        </div>
      </div>`;
    window._pubFormat = 'pdf';
  }
  
  function selectPubFormat(btn, val) {
    document.querySelectorAll('#pubFormatSegmented button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window._pubFormat = val;
  }
  
  function submitPublicRegistration(eventId) {
    const nama = document.getElementById('pubNama').value.trim();
    const email = document.getElementById('pubEmail').value.trim();
    const peran = document.getElementById('pubPeran').value;
    if (!nama || !email) { showToast('Belum lengkap', 'Nama dan email wajib diisi.', 'warning'); return; }
  
    const btn = document.getElementById('pubSubmitBtn');
    const resetBtn = () => { btn.disabled = false; btn.innerHTML = '<i class="bi bi-lightning-charge-fill"></i> Generate Sertifikat Saya'; };
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Memproses...';
  
    const timeoutId = setTimeout(() => {
      showToast('Masih Diproses', 'Proses generate memakan waktu lebih lama dari biasanya. Mohon tunggu atau muat ulang halaman jika lebih dari 1 menit.', 'warning');
    }, 20000);
  
    GAS()
      .withSuccessHandler(res => {
        clearTimeout(timeoutId);
        if (!res || !res.success) {
          showToast('Gagal', res ? res.message : 'Respons server tidak valid. Coba muat ulang halaman.', 'danger');
          resetBtn();
          return;
        }
        renderPublicResult(res.data);
      })
      .withFailureHandler(err => {
        clearTimeout(timeoutId);
        showToast('Error', err.message, 'danger');
        resetBtn();
      })
      .registerAndGenerate({ eventId, nama, email, peran, outputFormat: window._pubFormat || 'pdf' });
  }
  
  function renderPublicResult(data) {
    const downloadUrl = data.pdfUrl || data.imageUrl || data.fileUrl;
    document.getElementById('publicRoot').innerHTML = `
      <div class="public-card">
        <div class="public-body text-center">
          <div class="success-badge">
            <i class="bi bi-check-lg" style="color:var(--status-success-text);font-size:28px;"></i>
          </div>
          <h1 style="font-size:20px;">Sertifikat Anda Siap!</h1>
          <p class="text-muted">
            Berhasil dibuat untuk <strong>${escapeHtml(data.nama)}</strong> (${escapeHtml(data.peran)})
            pada acara <strong>${escapeHtml(data.eventName)}</strong>.
          </p>
          <div class="flex-center gap-8" style="justify-content:center;margin:14px 0;">
            <span class="badge badge-neutral mono">${escapeHtml(data.certNumber)}</span>
            <span class="badge badge-success"><span class="badge-dot"></span> Terbit</span>
          </div>
          <div class="divider"></div>
          ${data.pdfUrl ? `<a href="${data.pdfUrl}" target="_blank" class="btn btn-primary btn-full mb-16"><i class="bi bi-download"></i> Unduh Sertifikat (PDF)</a>` : ''}
          ${data.imageUrl ? `<a href="${data.imageUrl}" target="_blank" class="btn ${data.pdfUrl ? 'btn-secondary' : 'btn-primary'} btn-full mb-16"><i class="bi bi-image"></i> Unduh Sertifikat (Gambar PNG)</a>` : ''}
          <div class="callout ${data.emailStatus === 'Terkirim' ? 'callout-info' : 'callout-warning'} text-left">
            <i class="bi bi-envelope" style="margin-top:1px;"></i>
            <div>
              ${data.emailStatus === 'Terkirim'
                ? `Salinan sertifikat juga telah dikirim ke <strong>${escapeHtml(data.email)}</strong>.`
                : `Sertifikat berhasil dibuat, namun pengiriman email mengalami kendala. Silakan unduh langsung menggunakan tombol di atas.`}
            </div>
          </div>
          <p class="text-muted" style="font-size:12px;margin-top:14px;">Ada kesalahan penulisan nama? Hubungi panitia/operator acara ini untuk koreksi.</p>
        </div>
      </div>`;
  }

