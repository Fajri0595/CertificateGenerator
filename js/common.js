/**
 * ============================================================
 * CERTIFICATE GENERATOR (Certiflow) — Frontend Common (utilitas bersama)
 * ============================================================
 * Dipakai oleh index.html (konsol Admin/Operator) maupun public.html
 * (form peserta). Arsitektur: gas-pro-api — semua panggilan backend
 * lewat GAS() (lihat js/api.js), yang meniru API google.script.run
 * tapi berbasis fetch() murni, sehingga bisa dipanggil dari frontend
 * yang di-hosting terpisah (GitHub Pages), bukan hanya dari dalam
 * ekosistem Google. State sesi (token) disimpan di localStorage,
 * bukan lagi di sesi HtmlService.
 */

// ── State Global ──
const AppState = {
  role: null,               // 'admin' | 'operator'
  admin: null,               // { token, email, nama }
  operator: null,            // { token, username, namaLengkap, assignedEventId }
  templates: [],
  certificateFields: [],
  events: [],
  operatorsList: [],
  currentPage: null
};
  
  document.addEventListener('DOMContentLoaded', () => {
    if (window.APP_MODE === 'public') {
      initPublicMode();
    } else {
      initConsoleMode();
    }
  
    // Jaring pengaman terakhir: apapun penyebabnya (error tak terduga, mismatch
    // konfigurasi, dll), halaman TIDAK BOLEH tetap kosong tanpa penjelasan lebih
    // dari 12 detik. Jika masih kosong, paksa tampilkan pesan + tombol reload.
    setTimeout(() => {
      const publicRoot = document.getElementById('publicRoot');
      const appContainer = document.getElementById('app-container');
      const target = publicRoot || appContainer;
      const stillEmpty = target && target.innerHTML.trim() === '';
      if (stillEmpty) {
        showFatalErrorFallback(
          'Halaman tidak selesai memuat dalam waktu wajar. Ini biasanya karena error ' +
          'JavaScript tak terduga. Buka DevTools Console (F12) untuk detail teknis, ' +
          'atau muat ulang halaman.'
        );
      }
    }, 12000);
  });
  
  /**
   * Jaring pengaman global: menangkap error JavaScript tak terduga di mana pun
   * asalnya, dan memastikan pengguna tidak pernah melihat halaman kosong tanpa
   * penjelasan. Tidak menimpa konten yang sudah berhasil dirender.
   */
  window.addEventListener('error', (e) => {
    console.error('[Uncaught Error]', e.message, 'at', e.filename + ':' + e.lineno);
    showFatalErrorFallback('Terjadi kesalahan JavaScript tak terduga: ' + e.message);
  });
  
  function showFatalErrorFallback(message) {
    hideLoadingOverlay();
    const target = document.getElementById('publicRoot') || document.getElementById('app-container');
    if (!target || target.innerHTML.trim() !== '') return; // jangan menimpa konten yang sudah berhasil tampil
    target.innerHTML = `
      <div style="max-width:460px;margin:15vh auto 0;padding:28px;background:#fff;border:1px solid #FECACA;
        border-radius:16px;text-align:center;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 4px 14px rgba(0,0,0,0.06);">
        <div style="font-size:15px;font-weight:700;color:#991B1B;margin-bottom:8px;">⚠ Terjadi Kesalahan</div>
        <div style="font-size:13px;color:#64748B;line-height:1.5;">${message}</div>
        <button onclick="location.reload()" style="margin-top:16px;padding:9px 18px;border-radius:10px;
          border:1px solid #E2E8F0;background:#fff;cursor:pointer;font-weight:600;font-size:13px;">
          Muat Ulang Halaman
        </button>
      </div>`;
  }
  
  function hideLoadingOverlay() {
    const el = document.getElementById('loadingOverlay');
    if (el) { el.style.opacity = '0'; setTimeout(() => el.style.display = 'none', 200); }
  }
  
  // ════════════════════════════════════════════════════════
  // UTILITAS: TOAST
  // ════════════════════════════════════════════════════════
  function showToast(title, message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast-item ' + type;
    const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-x-circle-fill' : type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';
    el.innerHTML = `
      <i class="bi ${icon}" style="font-size:16px;margin-top:1px;"></i>
      <div>
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-msg">${escapeHtml(message)}</div>
      </div>`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 4500);
  }
  
  // ════════════════════════════════════════════════════════
  // UTILITAS: MODAL GENERIK
  // ════════════════════════════════════════════════════════
  function openModal(innerHtml, large) {
    const backdrop = document.getElementById('modalBackdrop');
    const box = document.getElementById('modalBox');
    box.className = 'modal-box' + (large ? ' modal-lg' : '');
    box.innerHTML = innerHtml;
    backdrop.classList.add('show');
  }
  function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('show');
  }
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'modalBackdrop') closeModal();
  });
  
  // ════════════════════════════════════════════════════════
  // UTILITAS UMUM
  // ════════════════════════════════════════════════════════
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
  function formatDate(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return isoStr; }
  }
  function formatDateTime(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return isoStr; }
  }
  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => showToast('Disalin', (label || 'Teks') + ' disalin ke clipboard.', 'success'));
  }
  function skeletonBlock(height) {
    return `<div class="skeleton" style="height:${height || 80}px;border-radius:12px;"></div>`;
  }
  
  // ════════════════════════════════════════════════════════
  // PAGE GUARD — mencegah respons GAS() yang datang
  // terlambat menulis ke halaman yang sudah ditinggalkan (race condition).
  // Setiap fungsi render halaman WAJIB memeriksa ini di awal success handler.
  // ════════════════════════════════════════════════════════
  function isCurrentPage(pageId) {
    return AppState.currentPage === pageId;
  }
  
  /**
   * Menampilkan status gagal-muat di tempat elemen skeleton berada, lengkap
   * dengan tombol "Coba Lagi", agar tidak ada kotak yang macet tanpa penjelasan
   * jika sebuah GAS() gagal (error server, timeout, dsb).
   */
  function renderFetchError(elementId, message, retryFnName) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = `
      <div class="card table-empty" style="text-align:center;">
        <i class="bi bi-exclamation-triangle" style="font-size:22px;color:var(--status-danger-text);"></i>
        <p style="margin:10px 0 4px;font-weight:600;">Gagal memuat data</p>
        <p class="text-muted" style="font-size:12.5px;margin-bottom:14px;">${escapeHtml(message || 'Terjadi kesalahan tak terduga.')}</p>
        ${retryFnName ? `<button class="btn btn-secondary btn-sm" onclick="${retryFnName}()"><i class="bi bi-arrow-clockwise"></i> Coba Lagi</button>` : ''}
      </div>`;
  }
  
  // ════════════════════════════════════════════════════════
  // SIDEBAR MOBILE
  // ════════════════════════════════════════════════════════
  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
    document.getElementById('sidebarOverlay').classList.toggle('show');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('show');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }

