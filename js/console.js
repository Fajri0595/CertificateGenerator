/**
 * ============================================================
 * CERTIFICATE GENERATOR (Certiflow) — Mode Konsol (index.html)
 * ============================================================
 * SPA Admin & Operator. Login Admin memakai email/password (bukan lagi
 * deteksi akun Google otomatis — lihat catatan di handleAdminLogin/
 * initConsoleMode di bawah) supaya kompatibel dipanggil dari frontend
 * eksternal (GitHub Pages) lewat fetch(), bukan hanya dari dalam
 * ekosistem Google. Login Operator (username/password + token) sudah
 * kompatibel sejak awal, tidak diubah logikanya sama sekali.
 */

  /**
   * ============================================================
   * MODE KONSOL — Admin & Operator
   * ============================================================
   */
  function initConsoleMode() {
    const savedAdmin = localStorage.getItem('certgen_admin_session');
    const savedOperator = localStorage.getItem('certgen_operator_session');

    // 1) Coba pulihkan sesi Admin dari localStorage (login sekarang pakai
    //    email/username + password — bukan lagi deteksi akun Google otomatis,
    //    karena frontend ini dipanggil dari luar ekosistem Google via fetch()).
    if (savedAdmin) {
      try {
        const parsed = JSON.parse(savedAdmin);
        GAS()
          .withSuccessHandler(res => {
            hideLoadingOverlay();
            if (res.success) {
              AppState.role = 'admin';
              AppState.admin = Object.assign({}, res.data, { token: parsed.token });
              renderConsoleShell();
            } else {
              localStorage.removeItem('certgen_admin_session');
              renderLoginPage();
            }
          })
          .withFailureHandler(() => { hideLoadingOverlay(); localStorage.removeItem('certgen_admin_session'); renderLoginPage(); })
          .adminCheckSession(parsed.token);
        return;
      } catch (e) { /* lanjut ke pengecekan operator */ }
    }

    // 2) Coba pulihkan sesi Operator dari localStorage
    if (savedOperator) {
      try {
        const parsed = JSON.parse(savedOperator);
        GAS()
          .withSuccessHandler(res => {
            hideLoadingOverlay();
            if (res.success) {
              AppState.role = 'operator';
              AppState.operator = Object.assign({}, res.data, { token: parsed.token });
              renderConsoleShell();
            } else {
              localStorage.removeItem('certgen_operator_session');
              renderLoginPage();
            }
          })
          .withFailureHandler(() => { hideLoadingOverlay(); localStorage.removeItem('certgen_operator_session'); renderLoginPage(); })
          .operatorCheckSession(parsed.token);
        return;
      } catch (e) { /* lanjut ke login */ }
    }

    hideLoadingOverlay();
    renderLoginPage();
  }
  
  function renderLoginPage() {
    const main = document.getElementById('mainContent');
    const sidebarEl = document.getElementById('sidebar');
    const topbarEl = document.querySelector('.topbar-mobile');
    // Jika elemen shell konsol ini tidak ditemukan, kita sebenarnya sedang berada
    // di shell PUBLIK (mode terdeteksi salah) — jangan lanjutkan render login di
    // sini, biarkan initPublicMode() yang menangani, hindari crash diam-diam.
    if (!main || !sidebarEl || !topbarEl) {
      console.error('renderLoginPage dipanggil tapi elemen shell konsol tidak ditemukan. window.APP_MODE =', window.APP_MODE);
      return;
    }
    main.style.marginLeft = '0';
    main.style.maxWidth = 'none';
    main.style.padding = '0';
    main.style.width = '100%';
    sidebarEl.style.display = 'none';
    topbarEl.style.display = 'none';
  
    document.getElementById('app-container').innerHTML = `
      <div class="login-shell">
        <div class="login-card">
          <div style="text-align:center;margin-bottom:24px;">
            <img src="favicon.svg" alt="Certiflow Logo" style="width:58px;height:58px;filter:drop-shadow(0 6px 16px rgba(99,102,241,0.35));margin-bottom:10px;">
            <div style="font-weight:800;font-size:22px;letter-spacing:-0.02em;background:linear-gradient(135deg,#0f172a 0%,#4338ca 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Certiflow Pro</div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:500;">Enterprise Certificate Management Platform</div>
          </div>
          <div class="login-tabs">
            <button class="active" id="tabAdminBtn" onclick="switchLoginTab('admin')">Admin</button>
            <button id="tabOperatorBtn" onclick="switchLoginTab('operator')">Operator</button>
          </div>
  
          <div id="loginTabAdmin">
            <h2 style="margin:0 0 6px;font-size:19px;">Admin Login</h2>
            <p class="text-muted" style="font-size:13px;margin-bottom:20px;">Masuk dengan email &amp; password admin.</p>
            <form onsubmit="event.preventDefault(); handleAdminLogin();" style="text-align:left;">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="adminUsername" placeholder="admin@email.com" required>
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" id="adminPassword" placeholder="••••••••" required>
              </div>
              <button type="submit" class="btn btn-primary btn-full" id="adminLoginBtn">
                <i class="bi bi-box-arrow-in-right"></i> Masuk sebagai Admin
              </button>
            </form>
          </div>
  
          <div id="loginTabOperator" class="hidden">
            <h2 style="margin:0 0 6px;font-size:19px;">Operator Login</h2>
            <p class="text-muted" style="font-size:13px;margin-bottom:20px;">Masuk dengan kredensial yang diberikan admin.</p>
            <form onsubmit="event.preventDefault(); handleOperatorLogin();" style="text-align:left;">
              <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" class="form-control" id="opUsername" placeholder="username" required>
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" id="opPassword" placeholder="••••••••" required>
              </div>
              <button type="submit" class="btn btn-primary btn-full" id="opLoginBtn">
                <i class="bi bi-box-arrow-in-right"></i> Masuk ke Konsol
              </button>
            </form>
            <p class="text-muted" style="font-size:12px;margin-top:14px;">Lupa kredensial? Hubungi admin Anda.</p>
          </div>
        </div>
      </div>`;
  }
  
  function switchLoginTab(tab) {
    document.getElementById('tabAdminBtn').classList.toggle('active', tab === 'admin');
    document.getElementById('tabOperatorBtn').classList.toggle('active', tab === 'operator');
    document.getElementById('loginTabAdmin').classList.toggle('hidden', tab !== 'admin');
    document.getElementById('loginTabOperator').classList.toggle('hidden', tab !== 'operator');
  }
  
  function handleAdminLogin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const btn = document.getElementById('adminLoginBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Memeriksa...';
  
    GAS()
      .withSuccessHandler(res => {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Masuk sebagai Admin';
        if (!res.success) { showToast('Login Gagal', res.message, 'danger'); return; }
        localStorage.setItem('certgen_admin_session', JSON.stringify({ token: res.data.token }));
        AppState.role = 'admin';
        AppState.admin = res.data;
        renderConsoleShell();
      })
      .withFailureHandler(err => {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Masuk sebagai Admin';
        showToast('Error', err.message, 'danger');
      })
      .adminLogin(username, password);
  }
  
  function handleOperatorLogin() {
    const username = document.getElementById('opUsername').value.trim();
    const password = document.getElementById('opPassword').value;
    const btn = document.getElementById('opLoginBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Memeriksa...';
  
    GAS()
      .withSuccessHandler(res => {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Masuk ke Konsol';
        if (!res.success) { showToast('Login Gagal', res.message, 'danger'); return; }
        localStorage.setItem('certgen_operator_session', JSON.stringify({ token: res.data.token }));
        AppState.role = 'operator';
        AppState.operator = res.data;
        renderConsoleShell();
      })
      .withFailureHandler(err => {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Masuk ke Konsol';
        showToast('Error', err.message, 'danger');
      })
      .operatorLogin(username, password);
  }
  
  function openChangePasswordModal() {
    openModal(`
      <div class="modal-header"><h3>Ganti Password Admin</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>
      <div class="callout callout-info mb-16"><i class="bi bi-info-circle" style="margin-top:1px;"></i><div>Pilih sendiri password yang mudah Anda ingat. Tetap disimpan dengan aman (ter-enkripsi), tidak dalam bentuk teks biasa.</div></div>
      <div class="form-group">
        <label class="form-label">Password Baru</label>
        <input type="password" class="form-control" id="newAdminPassword" placeholder="Minimal 6 karakter">
      </div>
      <div class="form-group">
        <label class="form-label">Ulangi Password Baru</label>
        <input type="password" class="form-control" id="newAdminPasswordConfirm" placeholder="Ketik ulang password baru">
      </div>
      <button class="btn btn-primary btn-full" onclick="submitChangeAdminPassword()" id="changePassBtn"><i class="bi bi-check-lg"></i> Simpan Password Baru</button>
    `);
  }

  function submitChangeAdminPassword() {
    const pass1 = document.getElementById('newAdminPassword').value;
    const pass2 = document.getElementById('newAdminPasswordConfirm').value;
    if (!pass1 || pass1.length < 6) { showToast('Belum lengkap', 'Password minimal 6 karakter.', 'warning'); return; }
    if (pass1 !== pass2) { showToast('Tidak cocok', 'Kedua password yang diketik harus sama.', 'warning'); return; }

    const btn = document.getElementById('changePassBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';

    GAS()
      .withSuccessHandler(res => {
        if (!res.success) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Simpan Password Baru'; showToast('Gagal', res.message, 'danger'); return; }
        showToast('Berhasil', res.message, 'success');
        closeModal();
      })
      .withFailureHandler(err => { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Simpan Password Baru'; showToast('Error', err.message, 'danger'); })
      .adminChangePassword(AppState.admin.token, pass1);
  }

  function handleLogout() {
    if (typeof DataCache !== 'undefined') DataCache.clear();
    localStorage.removeItem('certgen_admin_session');
    localStorage.removeItem('certgen_operator_session');
    AppState.role = null; AppState.admin = null; AppState.operator = null;
    location.reload();
  }
  
  /**
   * Menampilkan shell konsol (sidebar + konten) sesuai peran yang sedang login.
   */
  function renderConsoleShell() {
    const main = document.getElementById('mainContent');
    main.style.marginLeft = '';
    main.style.maxWidth = '';
    main.style.padding = '';
    main.style.width = '';
    document.getElementById('sidebar').style.display = 'flex';
    document.querySelector('.topbar-mobile').style.display = '';
    document.getElementById('sidebarFooter').style.display = 'block';
    document.getElementById('changePasswordLink').style.display = AppState.role === 'admin' ? 'block' : 'none';
  
    const roleTag = document.getElementById('sidebarRoleTag');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRoleLabel = document.getElementById('userRoleLabel');
    const nav = document.getElementById('sidebarNav');
  
    if (AppState.role === 'admin') {
      roleTag.textContent = 'ADMIN';
      userName.textContent = AppState.admin.email;
      userRoleLabel.textContent = 'Administrator';
      userAvatar.textContent = (AppState.admin.nama || AppState.admin.email).charAt(0).toUpperCase();
      nav.innerHTML = [
        navItem('dashboard', 'bi-speedometer2', 'Dashboard'),
        navItem('templates', 'bi-easel3', 'Template Sertifikat'),
        navItem('fields', 'bi-ui-checks-grid', 'Struktur Konten'),
        navItem('events', 'bi-calendar-event', 'Acara'),
        navItem('operators', 'bi-people', 'Akun Operator'),
        navItem('history', 'bi-clock-history', 'Riwayat Generate')
      ].join('');
      navigateTo('dashboard');
    } else {
      roleTag.textContent = 'OPERATOR';
      userName.textContent = AppState.operator.namaLengkap;
      userRoleLabel.textContent = '@' + AppState.operator.username;
      userAvatar.textContent = AppState.operator.namaLengkap.charAt(0).toUpperCase();
      nav.innerHTML = [
        navItem('op-overview', 'bi-grid-1x2', 'Ringkasan Acara'),
        navItem('op-content', 'bi-pencil-square', 'Isi Konten & Template'),
        navItem('op-preview', 'bi-eye', 'Pratinjau Sertifikat'),
        navItem('op-publish', 'bi-qr-code', 'Publikasikan Tautan')
      ].join('');
      navigateTo('op-overview');
    }

    // Hangatkan cache di background agar menu lainnya terbuka instan saat diklik pertama kali
    prefetchConsoleData();
  }
  
  function prefetchConsoleData() {
    setTimeout(() => {
      if (AppState.role === 'admin') {
        GAS().getAdminDashboardStats();
        GAS().getTemplates();
        GAS().getEvents();
        GAS().getOperators();
      } else if (AppState.role === 'operator' && AppState.operator && AppState.operator.assignedEventId) {
        const evId = AppState.operator.assignedEventId;
        GAS().getOperatorDashboardStats(evId);
        GAS().getEventById(evId);
        GAS().withSuccessHandler(res => {
          if (res.success && Array.isArray(res.data)) {
            res.data.filter(t => t.Status === 'Active').forEach(t => {
              GAS().getCertificateFields(t.ID);
            });
          }
        }).getTemplates();
      }
    }, 200);
  }

  function navItem(id, icon, label) {
    return `<li><a class="nav-link" data-page="${id}" onclick="navigateTo('${id}')"><span class="icon"><i class="bi ${icon}"></i></span><span>${label}</span></a></li>`;
  }
  
  /**
   * Router SPA — mengganti isi #app-container tanpa reload apapun.
   */
  function navigateTo(pageId) {
    AppState.currentPage = pageId;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === pageId));
    closeSidebar();
  
    const titles = {
      dashboard: 'Dashboard', templates: 'Template Sertifikat', fields: 'Struktur Konten Sertifikat',
      events: 'Acara', operators: 'Akun Operator', history: 'Riwayat Generate',
      'op-overview': 'Ringkasan Acara', 'op-content': 'Isi Konten & Template',
      'op-preview': 'Pratinjau Sertifikat', 'op-publish': 'Publikasikan Tautan'
    };
    document.getElementById('mobileTitle').textContent = titles[pageId] || 'Certiflow';

    const c = document.getElementById('app-container');
    if (c) {
      c.classList.remove('view-enter');
      void c.offsetWidth; // Memicu reflow browser agar animasi view-enter berjalan halus
      c.classList.add('view-enter');
    }
  
    const router = {
      dashboard: renderAdminDashboard,
      templates: renderAdminTemplates,
      fields: renderAdminFields,
      events: renderAdminEvents,
      operators: renderAdminOperators,
      history: renderAdminHistory,
      'op-overview': renderOperatorOverview,
      'op-content': renderOperatorContent,
      'op-preview': renderOperatorPreview,
      'op-publish': renderOperatorPublish
    };
    if (router[pageId]) router[pageId]();
  }
  
  /**
   * ============================================================
   * ADMIN — DASHBOARD
   * ============================================================
   */
  function renderAdminDashboard(forceRefresh) {
    const c = document.getElementById('app-container');
    const cached = !forceRefresh && (typeof DataCache !== 'undefined') && DataCache.get('getAdminDashboardStats', []);

    c.innerHTML = `
      <div class="flex-between mb-16">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle" style="margin:0;">Ringkasan operasional seluruh acara dan sertifikat.</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btnRefreshDash" onclick="refreshAdminDashboard()">
          <i class="bi bi-arrow-clockwise" id="iconRefreshDash"></i> Segarkan
        </button>
      </div>
      <div id="dashStats" class="grid grid-4 mb-16">${cached ? '' : [1,2,3,4].map(() => skeletonBlock(100)).join('')}</div>
      <div class="card" id="dashRecent">${cached ? '' : skeletonBlock(200)}</div>`;
  
    const gasCaller = forceRefresh ? GAS().fresh() : GAS();
    gasCaller
      .withSuccessHandler(res => {
        if (!isCurrentPage('dashboard')) return;
        const icon = document.getElementById('iconRefreshDash');
        if (icon) icon.classList.remove('spin-icon');
        if (!res.success) { showToast('Error', res.message, 'danger'); return; }
        const d = res.data;
        const statsEl = document.getElementById('dashStats');
        if (!statsEl) return;
        statsEl.innerHTML = `
          ${statCard('bi-calendar-event', d.totalEvents, 'Total Acara')}
          ${statCard('bi-people-fill', d.totalParticipants, 'Total Peserta')}
          ${statCard('bi-patch-check-fill', d.totalGenerated, 'Sertifikat Terbit')}
          ${statCard('bi-person-badge', d.activeOperators, 'Operator Aktif')}
        `;
        const recentEl = document.getElementById('dashRecent');
        if (!recentEl) return;
        recentEl.innerHTML = `
          <div class="flex-between mb-16">
            <h2 class="section-title" style="margin:0;">Acara Terbaru</h2>
            ${d.gmailRemainingQuota !== null ? `<span class="badge ${d.gmailRemainingQuota < 20 ? 'badge-warning' : 'badge-info'}"><i class="bi bi-envelope"></i> Kuota Gmail: ${d.gmailRemainingQuota}/hari</span>` : ''}
          </div>
          ${d.recentEvents.length === 0 ? `<div class="table-empty">Belum ada acara. Mulai dari menu "Acara".</div>` : `
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Nama Acara</th><th>Tanggal</th><th>Operator</th><th>Terbit</th><th>Status</th></tr></thead>
              <tbody>
                ${d.recentEvents.map(ev => `
                  <tr>
                    <td><strong>${escapeHtml(ev.nama)}</strong></td>
                    <td>${formatDate(ev.tanggal)}</td>
                    <td>@${escapeHtml(ev.operator || '-')}</td>
                    <td>${ev.issued}</td>
                    <td>${statusBadge(ev.status)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`}`;
      })
      .withFailureHandler(err => {
        const icon = document.getElementById('iconRefreshDash');
        if (icon) icon.classList.remove('spin-icon');
        showToast('Error', err.message, 'danger');
      })
      .getAdminDashboardStats();
  }

  function refreshAdminDashboard() {
    const icon = document.getElementById('iconRefreshDash');
    if (icon) icon.classList.add('spin-icon');
    renderAdminDashboard(true);
  }
  
  function statCard(icon, value, label) {
    return `<div class="card stat-card"><div class="stat-icon"><i class="bi ${icon}"></i></div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
  }
  function statusBadge(status) {
    const map = {
      Active: '<span class="badge badge-success"><span class="badge-dot"></span> Aktif</span>',
      Draft: '<span class="badge badge-neutral">Draft</span>',
      Inactive: '<span class="badge badge-neutral">Nonaktif</span>',
      Disabled: '<span class="badge badge-danger">Dinonaktifkan</span>',
      Sudah: '<span class="badge badge-success">Sudah</span>',
      Belum: '<span class="badge badge-warning">Belum</span>',
      Terkirim: '<span class="badge badge-success">Terkirim</span>',
      Gagal: '<span class="badge badge-danger">Gagal</span>'
    };
    return map[status] || `<span class="badge badge-neutral">${escapeHtml(status || '-')}</span>`;
  }
  
  /**
   * ============================================================
   * ADMIN — TEMPLATE SERTIFIKAT
   * ============================================================
   */
  function renderAdminTemplates(forceRefresh) {
    const c = document.getElementById('app-container');
    const cached = !forceRefresh && (typeof DataCache !== 'undefined') && DataCache.get('getTemplates', []);

    c.innerHTML = `
      <div class="flex-between mb-16">
        <div>
          <h1 class="page-title">Template Sertifikat</h1>
          <p class="page-subtitle" style="margin:0;">Kelola template Google Slide yang terhubung ke aplikasi.</p>
        </div>
        <div class="flex gap-8">
          <button class="btn btn-secondary btn-sm" id="btnRefreshTpl" onclick="refreshAdminTemplates()">
            <i class="bi bi-arrow-clockwise" id="iconRefreshTpl"></i> Segarkan
          </button>
          <button class="btn btn-primary" onclick="openAddTemplateModal()"><i class="bi bi-plus-lg"></i> Tambah Template</button>
        </div>
      </div>
      <div id="templatesGrid" class="grid grid-3">${cached ? '' : [1,2,3].map(() => skeletonBlock(180)).join('')}</div>`;
  
    loadTemplates(() => {
      const icon = document.getElementById('iconRefreshTpl');
      if (icon) icon.classList.remove('spin-icon');
      renderTemplatesGrid();
    }, forceRefresh);
  }

  function refreshAdminTemplates() {
    const icon = document.getElementById('iconRefreshTpl');
    if (icon) icon.classList.add('spin-icon');
    renderAdminTemplates(true);
  }
  
  function loadTemplates(callback, forceRefresh) {
    const gasCaller = forceRefresh ? GAS().fresh() : GAS();
    gasCaller
      .withSuccessHandler(res => {
        if (res.success) AppState.templates = res.data;
        else showToast('Error', res.message, 'danger');
        if (callback) callback();
      })
      .withFailureHandler(err => {
        showToast('Error', err.message, 'danger');
        renderFetchError('templatesGrid', err.message, 'renderAdminTemplates');
      })
      .getTemplates();
  }
  
  /**
   * Fallback aman jika thumbnail Google Slide gagal dimuat (mis. file belum
   * dibagikan cukup luas untuk viewer saat ini). Dipanggil lewat atribut onerror.
   */
  function handleTemplateImgError_(imgEl) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'aspect-ratio:16/9;border-radius:10px;background:repeating-linear-gradient(45deg,#F1F5F9,#F1F5F9 10px,#E2E8F0 10px,#E2E8F0 20px);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px;';
    wrapper.innerHTML = '<i class="bi bi-easel3" style="font-size:22px;"></i>';
    if (imgEl && imgEl.parentNode) imgEl.replaceWith(wrapper);
  }
  
  /**
   * Markup thumbnail Google Slide asli, dengan fallback otomatis ke ikon generik
   * jika gambar gagal dimuat (mis. file belum dibagikan cukup luas, atau viewer
   * tidak memiliki akses ke Slide tersebut).
   */
  function templateThumbHtml(slideId) {
    return `<img src="https://drive.google.com/thumbnail?id=${slideId}&sz=w500"
      style="aspect-ratio:16/9;border-radius:10px;width:100%;object-fit:cover;display:block;background:#F1F5F9;"
      onerror="handleTemplateImgError_(this)" alt="Pratinjau template">`;
  }
  
  function renderTemplatesGrid() {
    const grid = document.getElementById('templatesGrid');
    if (!grid) return;
    if (AppState.templates.length === 0) {
      grid.innerHTML = `<div class="card table-empty" style="grid-column:1/-1;">Belum ada template. Klik "Tambah Template" untuk menghubungkan Google Slide pertama Anda.</div>`;
      return;
    }
    grid.innerHTML = AppState.templates.map(t => `
      <div class="card">
        <div style="margin-bottom:12px;">${templateThumbHtml(t.SlideId)}</div>
        <div class="flex-between mb-16" style="margin-bottom:8px;">
          <strong>${escapeHtml(t.Nama)}</strong>
          ${t.Status === 'Active' ? '<span class="badge badge-success"><span class="badge-dot"></span> Aktif</span>' : '<span class="badge badge-neutral">Nonaktif</span>'}
        </div>
        <a href="https://docs.google.com/presentation/d/${t.SlideId}/edit" target="_blank" class="btn-ghost" style="font-size:12px;"><i class="bi bi-box-arrow-up-right"></i> Edit di Google Slides</a>
        <div class="divider"></div>
        <button class="btn btn-secondary btn-sm w-100" onclick="toggleTemplate('${t.ID}')">
          ${t.Status === 'Active' ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      </div>`).join('');
  }
  
  function openAddTemplateModal() {
    openModal(`
      <div class="modal-header"><h3>Tambah Template Baru</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>
      <div class="form-group">
        <label class="form-label">Nama Template</label>
        <input type="text" class="form-control" id="newTplName" placeholder="Misal: Sertifikat Seminar Formal">
      </div>
      <div class="form-group">
        <label class="form-label">Link / ID Google Slide</label>
        <input type="text" class="form-control" id="newTplSlide" placeholder="https://docs.google.com/presentation/d/....">
        <div class="form-hint">Slide pertama pada file akan dipakai sebagai desain sertifikat. Gunakan tag <span class="tag-chip">{{nama_peserta}}</span> dan <span class="tag-chip">{{peran}}</span> di dalam desain.</div>
      </div>
      <button class="btn btn-primary btn-full" onclick="submitAddTemplate()" id="addTplBtn"><i class="bi bi-check-lg"></i> Simpan Template</button>
    `);
  }
  
  function submitAddTemplate() {
    const name = document.getElementById('newTplName').value.trim();
    const slide = document.getElementById('newTplSlide').value.trim();
    if (!name || !slide) { showToast('Belum lengkap', 'Nama dan link Slide wajib diisi.', 'warning'); return; }
    const btn = document.getElementById('addTplBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Memvalidasi...';
  
    GAS()
      .withSuccessHandler(res => {
        btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Simpan Template';
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        showToast('Berhasil', 'Template berhasil ditambahkan.', 'success');
        closeModal();
        if (res.data && res.data.ID) {
          if (!Array.isArray(AppState.templates)) AppState.templates = [];
          AppState.templates.unshift(res.data);
          if (typeof DataCache !== 'undefined') {
            DataCache.set('getTemplates', [], { success: true, data: AppState.templates });
          }
          renderTemplatesGrid();
        } else {
          loadTemplates(() => renderTemplatesGrid());
        }
      })
      .withFailureHandler(err => { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Simpan Template'; showToast('Error', err.message, 'danger'); })
      .addTemplate(name, slide);
  }
  
  function toggleTemplate(id) {
    const t = AppState.templates && AppState.templates.find(x => x.ID === id);
    if (!t) return;
    const oldStatus = t.Status;
    const newStatus = oldStatus === 'Active' ? 'Inactive' : 'Active';
    t.Status = newStatus;
    renderTemplatesGrid(); // Update tampilan seketika (0 ms)

    GAS()
      .withSuccessHandler(res => {
        if (!res.success) {
          t.Status = oldStatus;
          renderTemplatesGrid();
          showToast('Gagal', res.message, 'danger');
          return;
        }
        if (typeof DataCache !== 'undefined') {
          DataCache.set('getTemplates', [], { success: true, data: AppState.templates });
        }
        showToast('Berhasil', `Status template diperbarui menjadi ${newStatus === 'Active' ? 'Aktif' : 'Nonaktif'}.`, 'success');
      })
      .withFailureHandler(err => {
        t.Status = oldStatus;
        renderTemplatesGrid();
        showToast('Error', err.message, 'danger');
      })
      .toggleTemplateStatus(id);
  }
  
  /**
   * ============================================================
   * ADMIN — STRUKTUR KONTEN SERTIFIKAT
   * ============================================================
   */
  function renderAdminFields() {
    const c = document.getElementById('app-container');
    const cachedTpls = (typeof DataCache !== 'undefined') && DataCache.get('getTemplates', []);
    const templates = (cachedTpls && cachedTpls.data && cachedTpls.data.success) ? cachedTpls.data.data : AppState.templates;

    c.innerHTML = `
      <h1 class="page-title">Struktur Konten Sertifikat</h1>
      <p class="page-subtitle">Setiap template memiliki struktur variabel kontennya masing-masing — pilih template untuk mengaturnya.</p>
      <div class="callout callout-dark mb-16">
        <i class="bi bi-shield-lock" style="margin-top:1px;"></i>
        <div>Field <strong>Nama Peserta</strong> ({{nama_peserta}}) dan <strong>Peran</strong> ({{peran}}) terkunci dan berlaku untuk SEMUA template karena diisi otomatis dari formulir pendaftaran peserta.</div>
      </div>
      <div class="card mb-16">
        <label class="form-label">Pilih Template</label>
        <select class="form-control" id="fieldsTemplateSelect" onchange="onFieldsTemplateChange()">
          ${templates && templates.length
            ? '<option value="">— Pilih template —</option>' + templates.map(t => `<option value="${t.ID}">${escapeHtml(t.Nama)}${t.Status !== 'Active' ? ' (nonaktif)' : ''}</option>`).join('')
            : '<option value="">Memuat daftar template...</option>'}
        </select>
      </div>
      <div class="card" id="fieldsCard" style="display:none;"></div>`;

    window._fieldsSelectedTemplate = '';

    if (!templates || templates.length === 0) {
      GAS()
        .withSuccessHandler(res => {
          if (!isCurrentPage('fields')) return;
          const sel = document.getElementById('fieldsTemplateSelect');
          if (!sel) return;
          if (!res.success || res.data.length === 0) {
            sel.innerHTML = '<option value="">Belum ada template — buat dulu di menu "Template Sertifikat"</option>';
            return;
          }
          AppState.templates = res.data;
          sel.innerHTML = '<option value="">— Pilih template —</option>' +
            res.data.map(t => `<option value="${t.ID}">${escapeHtml(t.Nama)}${t.Status !== 'Active' ? ' (nonaktif)' : ''}</option>`).join('');
        })
        .withFailureHandler(err => showToast('Error', err.message, 'danger'))
        .getTemplates();
    }
  }

  function onFieldsTemplateChange(forceRefresh) {
    const templateId = document.getElementById('fieldsTemplateSelect').value;
    const card = document.getElementById('fieldsCard');
    window._fieldsSelectedTemplate = templateId;
    if (!templateId) { card.style.display = 'none'; card.innerHTML = ''; return; }

    card.style.display = '';
    const cached = !forceRefresh && (typeof DataCache !== 'undefined') && DataCache.get('getCertificateFields', [templateId]);
    if (!cached) {
      card.innerHTML = skeletonBlock(240);
    }

    const gasCaller = forceRefresh ? GAS().fresh() : GAS();
    gasCaller
      .withSuccessHandler(res => {
        if (!isCurrentPage('fields')) return;
        if (!res.success) { renderFetchError('fieldsCard', res.message, 'renderAdminFields'); return; }
        AppState.certificateFields = res.data;
        renderFieldsEditor();
      })
      .withFailureHandler(err => {
        if (!isCurrentPage('fields')) return;
        renderFetchError('fieldsCard', err.message, 'renderAdminFields');
      })
      .getCertificateFields(templateId);
  }
  
  function renderFieldsEditor() {
    const card = document.getElementById('fieldsCard');
    if (!card) return;
    card.innerHTML = `
      <div id="fieldsList">${AppState.certificateFields.map((f, i) => fieldRow(f, i)).join('')}</div>
      <button class="btn btn-secondary mt-16" onclick="addFieldRow()"><i class="bi bi-plus-lg"></i> Tambah Field Kustom untuk Template Ini</button>
      <div class="divider"></div>
      <button class="btn btn-primary" onclick="saveFields()" id="saveFieldsBtn"><i class="bi bi-save"></i> Simpan Struktur Template Ini</button>`;
  }
  
  function fieldRow(f, i) {
    const locked = f.IsLocked === true || f.IsLocked === 'true';
    return `
      <div class="card" style="margin-bottom:10px;padding:14px 16px;${locked ? 'background:#F8FAFC;' : ''}" data-idx="${i}">
        <div class="grid grid-4" style="align-items:end;gap:10px;">
          <div class="form-group" style="margin:0;">
            <label class="form-label">Label Field</label>
            <input class="form-control field-label" value="${escapeHtml(f.FieldLabel)}" ${locked ? 'disabled' : ''}>
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">Variable Tag</label>
            <input class="form-control field-tag mono" value="${escapeHtml(f.VariableTag)}" ${locked ? 'disabled' : ''}>
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">Tipe Input</label>
            <select class="form-control field-type" ${locked ? 'disabled' : ''}>
              <option value="text" ${f.InputType === 'text' ? 'selected' : ''}>Teks</option>
              <option value="textarea" ${f.InputType === 'textarea' ? 'selected' : ''}>Teks Panjang</option>
              <option value="date" ${f.InputType === 'date' ? 'selected' : ''}>Tanggal</option>
            </select>
          </div>
          <div class="flex gap-8" style="justify-content:flex-end;">
            ${locked ? '<span class="badge badge-info"><i class="bi bi-lock-fill"></i> Semua Template</span>' : `<button class="btn btn-danger btn-sm" onclick="removeFieldRow(this)"><i class="bi bi-trash"></i></button>`}
          </div>
        </div>
      </div>`;
  }
  
  function addFieldRow() {
    AppState.certificateFields.push({ ID: '', FieldLabel: '', VariableTag: '', InputType: 'text', Required: true, IsLocked: false });
    renderFieldsEditor();
  }
  function removeFieldRow(btn) {
    const idx = Number(btn.closest('[data-idx]').dataset.idx);
    AppState.certificateFields.splice(idx, 1);
    renderFieldsEditor();
  }
  
  function saveFields() {
    if (!window._fieldsSelectedTemplate) { showToast('Belum lengkap', 'Pilih template terlebih dahulu.', 'warning'); return; }
    const rows = document.querySelectorAll('#fieldsList [data-idx]');
    const fields = [];
    rows.forEach((row, i) => {
      const original = AppState.certificateFields[i];
      const locked = original.IsLocked === true || original.IsLocked === 'true';
      fields.push({
        ID: original.ID,
        FieldLabel: locked ? original.FieldLabel : row.querySelector('.field-label').value.trim(),
        VariableTag: locked ? original.VariableTag : row.querySelector('.field-tag').value.trim(),
        InputType: locked ? original.InputType : row.querySelector('.field-type').value,
        Required: true,
        IsLocked: locked
      });
    });
    const btn = document.getElementById('saveFieldsBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
  
    GAS()
      .withSuccessHandler(res => {
        btn.disabled = false; btn.innerHTML = '<i class="bi bi-save"></i> Simpan Struktur Template Ini';
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        showToast('Berhasil', res.message || 'Struktur template berhasil disimpan.', 'success');
        AppState.certificateFields = fields;
        if (typeof DataCache !== 'undefined') {
          DataCache.set('getCertificateFields', [window._fieldsSelectedTemplate], { success: true, data: fields });
        }
        renderFieldsEditor();
      })
      .withFailureHandler(err => {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-save"></i> Simpan Struktur Template Ini';
        showToast('Error', err.message, 'danger');
      })
      .saveCertificateFields(window._fieldsSelectedTemplate, fields);
  }
  
  /**
   * ============================================================
   * ADMIN — ACARA (EVENTS)
   * ============================================================
   */
  function renderAdminEvents(forceRefresh) {
    const c = document.getElementById('app-container');
    const cached = !forceRefresh && (typeof DataCache !== 'undefined') && DataCache.get('getEvents', []);

    c.innerHTML = `
      <div class="flex-between mb-16">
        <div>
          <h1 class="page-title">Acara</h1>
          <p class="page-subtitle" style="margin:0;">Kelola acara, alokasi operator, dan status distribusi.</p>
        </div>
        <div class="flex gap-8">
          <button class="btn btn-secondary btn-sm" id="btnRefreshEvents" onclick="refreshAdminEvents()">
            <i class="bi bi-arrow-clockwise" id="iconRefreshEvents"></i> Segarkan
          </button>
          <button class="btn btn-primary" onclick="openCreateEventModal()"><i class="bi bi-plus-lg"></i> Buat Acara</button>
        </div>
      </div>
      <div class="table-wrap" id="eventsTableWrap">${cached ? '' : skeletonBlock(240)}</div>`;
  
    const gasCaller = forceRefresh ? GAS().fresh() : GAS();
    gasCaller
      .withSuccessHandler(res => {
        const icon = document.getElementById('iconRefreshEvents');
        if (icon) icon.classList.remove('spin-icon');
        if (!isCurrentPage('events')) return;
        if (!res.success) { renderFetchError('eventsTableWrap', res.message, 'renderAdminEvents'); return; }
        AppState.events = res.data;
        renderEventsTable();
      })
      .withFailureHandler(err => {
        const icon = document.getElementById('iconRefreshEvents');
        if (icon) icon.classList.remove('spin-icon');
        if (!isCurrentPage('events')) return;
        renderFetchError('eventsTableWrap', err.message, 'renderAdminEvents');
      })
      .getEvents();
  }

  function refreshAdminEvents() {
    const icon = document.getElementById('iconRefreshEvents');
    if (icon) icon.classList.add('spin-icon');
    renderAdminEvents(true);
  }
  
  function renderEventsTable() {
    const wrap = document.getElementById('eventsTableWrap');
    if (!wrap) return;
    if (AppState.events.length === 0) {
      wrap.innerHTML = `<div class="card table-empty">Belum ada acara. Klik "Buat Acara" untuk memulai.</div>`;
      return;
    }
    wrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Nama Acara</th><th>Tanggal</th><th>Operator</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${AppState.events.slice().reverse().map(ev => `
            <tr>
              <td><strong>${escapeHtml(ev.Nama)}</strong><br><span class="text-muted" style="font-size:12px;">${escapeHtml(ev.Penyelenggara)}</span></td>
              <td>${formatDate(ev.Tanggal)}</td>
              <td>@${escapeHtml(ev.OperatorUsername)}</td>
              <td>${statusBadge(ev.Status)}</td>
              <td class="text-right">
                ${ev.Status === 'Active' ? `<button class="btn btn-danger btn-sm" onclick="deactivateEventAction('${ev.ID}')">Nonaktifkan</button>` : ''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }
  
  function openCreateEventModal() {
    const cachedOps = (typeof DataCache !== 'undefined') && DataCache.get('getOperators', []);
    if (cachedOps && cachedOps.data && cachedOps.data.success) {
      showCreateEventModalWithOps(cachedOps.data.data.filter(o => o.Status === 'Active'));
      return;
    }
    if (AppState.operatorsList && AppState.operatorsList.length) {
      showCreateEventModalWithOps(AppState.operatorsList.filter(o => o.Status === 'Active'));
      return;
    }
    GAS()
      .withSuccessHandler(res => {
        const ops = res.success ? res.data.filter(o => o.Status === 'Active') : [];
        showCreateEventModalWithOps(ops);
      })
      .withFailureHandler(err => showToast('Error', err.message, 'danger'))
      .getOperators();
  }

  function showCreateEventModalWithOps(ops) {
    openModal(`
      <div class="modal-header"><h3>Buat Acara Baru</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>
      <div class="form-group">
        <label class="form-label">Nama Acara</label>
        <input type="text" class="form-control" id="evNama" placeholder="Misal: Webinar AI & Machine Learning 2025">
      </div>
      <div class="form-group">
        <label class="form-label">Tanggal Acara</label>
        <input type="date" class="form-control" id="evTanggal">
      </div>
      <div class="form-group">
        <label class="form-label">Penyelenggara</label>
        <input type="text" class="form-control" id="evPenyelenggara" placeholder="Misal: Fakultas Ilmu Komputer">
      </div>
      <div class="form-group">
        <label class="form-label">Operator Penanggung Jawab</label>
        <select class="form-control" id="evOperator">
          ${ops.length === 0 ? '<option value="">Belum ada operator aktif</option>' : ops.map(o => `<option value="${o.Username}">${escapeHtml(o.NamaLengkap)} (@${o.Username})</option>`).join('')}
        </select>
        ${ops.length === 0 ? '<div class="form-hint">Buat akun operator terlebih dahulu di menu "Akun Operator".</div>' : ''}
      </div>
      <button class="btn btn-primary btn-full" onclick="submitCreateEvent()" id="createEvBtn" ${ops.length === 0 ? 'disabled' : ''}><i class="bi bi-check-lg"></i> Buat Acara</button>
    `);
  }
  
  function submitCreateEvent() {
    const payload = {
      nama: document.getElementById('evNama').value.trim(),
      tanggal: document.getElementById('evTanggal').value,
      penyelenggara: document.getElementById('evPenyelenggara').value.trim(),
      operatorUsername: document.getElementById('evOperator').value
    };
    if (!payload.nama || !payload.tanggal || !payload.penyelenggara || !payload.operatorUsername) {
      showToast('Belum lengkap', 'Semua field wajib diisi.', 'warning'); return;
    }
    const btn = document.getElementById('createEvBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Membuat...';
  
    GAS()
      .withSuccessHandler(res => {
        btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Buat Acara';
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        showToast('Berhasil', 'Acara berhasil dibuat.', 'success');
        closeModal();

        const newEvent = (res.data && res.data.ID) ? res.data : {
          ID: (res.data && (res.data.id || res.data.ID)) || ('EV-' + Date.now()),
          Nama: payload.nama,
          Tanggal: payload.tanggal,
          Penyelenggara: payload.penyelenggara,
          OperatorUsername: payload.operatorUsername,
          TemplateId: '',
          Status: 'Active',
          CreatedAt: new Date().toISOString()
        };
        if (!Array.isArray(AppState.events)) AppState.events = [];
        AppState.events.push(newEvent);
        if (typeof DataCache !== 'undefined') {
          DataCache.set('getEvents', [], { success: true, data: AppState.events });
        }
        renderEventsTable();
      })
      .withFailureHandler(err => { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Buat Acara'; showToast('Error', err.message, 'danger'); })
      .createEvent(payload);
  }
  
  function deactivateEventAction(eventId) {
    const ev = AppState.events && AppState.events.find(e => e.ID === eventId);
    if (!ev) return;
    const oldStatus = ev.Status;
    ev.Status = 'Inactive';
    renderEventsTable(); // Update tampilan seketika (0 ms)

    GAS()
      .withSuccessHandler(res => {
        if (!res.success) {
          ev.Status = oldStatus;
          renderEventsTable();
          showToast('Gagal', res.message, 'danger');
          return;
        }
        if (typeof DataCache !== 'undefined') {
          DataCache.set('getEvents', [], { success: true, data: AppState.events });
        }
        showToast('Berhasil', 'Acara dinonaktifkan.', 'success');
      })
      .withFailureHandler(err => {
        ev.Status = oldStatus;
        renderEventsTable();
        showToast('Error', err.message, 'danger');
      })
      .deactivateEvent(eventId);
  }
  
  /**
   * ============================================================
   * ADMIN — AKUN OPERATOR
   * ============================================================
   */
  function renderAdminOperators(forceRefresh) {
    const c = document.getElementById('app-container');
    const cached = !forceRefresh && (typeof DataCache !== 'undefined') && DataCache.get('getOperators', []);

    c.innerHTML = `
      <div class="flex-between mb-16">
        <div>
          <h1 class="page-title">Akun Operator</h1>
          <p class="page-subtitle" style="margin:0;">Kelola kredensial operator per acara.</p>
        </div>
        <div class="flex gap-8">
          <button class="btn btn-secondary btn-sm" id="btnRefreshOps" onclick="refreshAdminOperators()">
            <i class="bi bi-arrow-clockwise" id="iconRefreshOps"></i> Segarkan
          </button>
          <button class="btn btn-primary" onclick="openCreateOperatorModal()"><i class="bi bi-plus-lg"></i> Buat Akun Operator</button>
        </div>
      </div>
      <div class="table-wrap" id="operatorsTableWrap">${cached ? '' : skeletonBlock(240)}</div>`;
  
    const gasCaller = forceRefresh ? GAS().fresh() : GAS();
    gasCaller
      .withSuccessHandler(res => {
        const icon = document.getElementById('iconRefreshOps');
        if (icon) icon.classList.remove('spin-icon');
        if (!isCurrentPage('operators')) return;
        if (!res.success) { renderFetchError('operatorsTableWrap', res.message, 'renderAdminOperators'); return; }
        AppState.operatorsList = res.data;
        renderOperatorsTable();
      })
      .withFailureHandler(err => {
        const icon = document.getElementById('iconRefreshOps');
        if (icon) icon.classList.remove('spin-icon');
        if (!isCurrentPage('operators')) return;
        renderFetchError('operatorsTableWrap', err.message, 'renderAdminOperators');
      })
      .getOperators();
  }

  function refreshAdminOperators() {
    const icon = document.getElementById('iconRefreshOps');
    if (icon) icon.classList.add('spin-icon');
    renderAdminOperators(true);
  }
  
  function renderOperatorsTable() {
    const wrap = document.getElementById('operatorsTableWrap');
    if (!wrap) return;
    if (AppState.operatorsList.length === 0) {
      wrap.innerHTML = `<div class="card table-empty">Belum ada operator. Klik "Buat Akun Operator" untuk menambahkan.</div>`;
      return;
    }
    wrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Nama</th><th>Username</th><th>Acara Ditugaskan</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${AppState.operatorsList.map(o => `
            <tr>
              <td><div class="flex-center gap-8"><div class="avatar" style="width:28px;height:28px;font-size:11px;">${o.NamaLengkap.charAt(0)}</div>${escapeHtml(o.NamaLengkap)}</div></td>
              <td class="mono">@${escapeHtml(o.Username)}</td>
              <td>${o.AssignedEventId ? '<span class="badge badge-info">Ditugaskan</span>' : '<span class="text-muted">Belum ada</span>'}</td>
              <td>${o.Status === 'Active' ? '<span class="badge badge-success"><span class="badge-dot"></span> Aktif</span>' : '<span class="badge badge-danger">Nonaktif</span>'}</td>
              <td class="text-right">
                <button class="btn btn-secondary btn-sm" onclick="regenPassword('${o.Username}', this)">Reset Password</button>
                <button class="btn ${o.Status === 'Active' ? 'btn-danger' : 'btn-secondary'} btn-sm" onclick="toggleOperator('${o.Username}')">${o.Status === 'Active' ? 'Nonaktifkan' : 'Aktifkan'}</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }
  
  function openCreateOperatorModal() {
    openModal(`
      <div class="modal-header"><h3>Buat Akun Operator</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>
      <div class="callout callout-info mb-16"><i class="bi bi-shield-check" style="margin-top:1px;"></i><div>Password akan digenerate otomatis dan hanya ditampilkan sekali. Segera salin dan bagikan secara aman.</div></div>
      <div class="form-group">
        <label class="form-label">Nama Lengkap</label>
        <input type="text" class="form-control" id="opNamaLengkap" placeholder="Nama operator">
      </div>
      <div class="form-group">
        <label class="form-label">Username</label>
        <input type="text" class="form-control" id="opUsernameNew" placeholder="username_unik">
      </div>
      <button class="btn btn-primary btn-full" onclick="submitCreateOperator()" id="createOpBtn"><i class="bi bi-check-lg"></i> Buat Akun</button>
    `);
  }
  
  function submitCreateOperator() {
    const namaLengkap = document.getElementById('opNamaLengkap').value.trim();
    const username = document.getElementById('opUsernameNew').value.trim();
    if (!namaLengkap || !username) { showToast('Belum lengkap', 'Nama dan username wajib diisi.', 'warning'); return; }
    const btn = document.getElementById('createOpBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Membuat...';
  
    GAS()
      .withSuccessHandler(res => {
        btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Buat Akun';
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }

        // Optimasi: tambahkan ke memori lokal seketika tanpa request ganda ke server
        const newOp = {
          NamaLengkap: namaLengkap,
          Username: username,
          AssignedEventId: '',
          Status: 'Active'
        };
        if (!Array.isArray(AppState.operatorsList)) AppState.operatorsList = [];
        const exists = AppState.operatorsList.some(o => o.Username.toLowerCase() === username.toLowerCase());
        if (!exists) {
          AppState.operatorsList.unshift(newOp);
        }
        if (typeof DataCache !== 'undefined') {
          DataCache.set('getOperators', [], { success: true, data: AppState.operatorsList });
        }

        showCredentialResult(res.data.username, res.data.password);
        renderOperatorsTable(); // Langsung perbarui tabel dalam 0 ms
        showToast('Berhasil', `Akun operator @${username} berhasil dibuat.`, 'success');
      })
      .withFailureHandler(err => { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Buat Akun'; showToast('Error', err.message, 'danger'); })
      .createOperatorAccount({ namaLengkap, username });
  }
  
  function showCredentialResult(username, password) {
    openModal(`
      <div class="modal-header"><h3>Kredensial Operator</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>
      <div class="callout callout-warning mb-16"><i class="bi bi-exclamation-triangle" style="margin-top:1px;"></i><div>Password ini hanya ditampilkan sekali dan tidak dapat dilihat ulang. Salin sekarang.</div></div>
      <div class="form-group"><label class="form-label">Username</label>
        <div class="flex gap-8"><input class="form-control mono" value="${escapeHtml(username)}" readonly><button class="btn btn-secondary btn-icon" onclick="copyToClipboard('${escapeJs(username)}','Username')"><i class="bi bi-clipboard"></i></button></div>
      </div>
      <div class="form-group"><label class="form-label">Password</label>
        <div class="flex gap-8"><input class="form-control mono" value="${escapeHtml(password)}" readonly><button class="btn btn-secondary btn-icon" onclick="copyToClipboard('${escapeJs(password)}','Password')"><i class="bi bi-clipboard"></i></button></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="closeModal()">Selesai</button>
    `);
  }
  function escapeJs(str) { return String(str).replace(/'/g, "\\'"); }
  
  function toggleOperator(username) {
    const op = AppState.operatorsList && AppState.operatorsList.find(o => o.Username === username);
    if (!op) return;
    const oldStatus = op.Status;
    const newStatus = oldStatus === 'Active' ? 'Inactive' : 'Active';
    op.Status = newStatus;
    renderOperatorsTable(); // Update tampilan seketika (0 ms)

    GAS()
      .withSuccessHandler(res => {
        if (!res.success) {
          op.Status = oldStatus;
          renderOperatorsTable();
          showToast('Gagal', res.message, 'danger');
          return;
        }
        if (typeof DataCache !== 'undefined') {
          DataCache.set('getOperators', [], { success: true, data: AppState.operatorsList });
        }
        showToast('Berhasil', `Status operator @${username} diperbarui menjadi ${newStatus === 'Active' ? 'Aktif' : 'Nonaktif'}.`, 'success');
      })
      .withFailureHandler(err => {
        op.Status = oldStatus;
        renderOperatorsTable();
        showToast('Error', err.message, 'danger');
      })
      .toggleOperatorStatus(username);
  }
  
  function regenPassword(username, btnEl) {
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = '<span class="spinner spinner-sm"></span> Reset...';
    }
    GAS()
      .withSuccessHandler(res => {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.innerHTML = 'Reset Password';
        }
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        showCredentialResult(username, res.data.password);
      })
      .withFailureHandler(err => {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.innerHTML = 'Reset Password';
        }
        showToast('Error', err.message, 'danger');
      })
      .regenerateOperatorPassword(username);
  }
  
  /**
   * ============================================================
   * ADMIN — RIWAYAT GENERATE (AUDIT)
   * ============================================================
   */
  function renderAdminHistory(forceRefresh) {
    const c = document.getElementById('app-container');
    const cached = !forceRefresh && (typeof DataCache !== 'undefined') && DataCache.get('getGenerationHistory', [null]);

    c.innerHTML = `
      <div class="flex-between mb-16">
        <div>
          <h1 class="page-title">Riwayat Generate</h1>
          <p class="page-subtitle" style="margin:0;">Jejak audit seluruh sertifikat yang telah diterbitkan.</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btnRefreshHistory" onclick="refreshAdminHistory()">
          <i class="bi bi-arrow-clockwise" id="iconRefreshHistory"></i> Segarkan
        </button>
      </div>
      <div class="card mb-16">
        <input type="text" class="form-control" id="historySearch" placeholder="Cari nama atau email peserta..." oninput="filterHistory()">
      </div>
      <div class="table-wrap" id="historyTableWrap">${cached ? '' : skeletonBlock(280)}</div>`;
  
    loadHistory(forceRefresh);
  }

  function refreshAdminHistory() {
    const icon = document.getElementById('iconRefreshHistory');
    if (icon) icon.classList.add('spin-icon');
    renderAdminHistory(true);
  }
  
  function loadHistory(forceRefresh) {
    const gasCaller = forceRefresh ? GAS().fresh() : GAS();
    gasCaller
      .withSuccessHandler(res => {
        const icon = document.getElementById('iconRefreshHistory');
        if (icon) icon.classList.remove('spin-icon');
        if (!isCurrentPage('history')) return;
        if (!res.success) { renderFetchError('historyTableWrap', res.message, 'renderAdminHistory'); return; }
        AppState.historyRows = res.data;
        renderHistoryTable(res.data);
      })
      .withFailureHandler(err => {
        const icon = document.getElementById('iconRefreshHistory');
        if (icon) icon.classList.remove('spin-icon');
        if (!isCurrentPage('history')) return;
        renderFetchError('historyTableWrap', err.message, 'renderAdminHistory');
      })
      .getGenerationHistory(null);
  }
  
  function filterHistory() {
    const kw = document.getElementById('historySearch').value.toLowerCase();
    const filtered = (AppState.historyRows || []).filter(r => r.nama.toLowerCase().includes(kw) || r.email.toLowerCase().includes(kw));
    renderHistoryTable(filtered);
  }
  
  function renderHistoryTable(rows) {
    const wrap = document.getElementById('historyTableWrap');
    if (!wrap) return;
    if (rows.length === 0) {
      wrap.innerHTML = `<div class="card table-empty">Belum ada sertifikat yang diterbitkan.</div>`;
      return;
    }
    wrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Peserta</th><th>Acara</th><th>No. Sertifikat</th><th>Waktu Generate</th><th>Format</th><th>Email</th><th></th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td><strong>${escapeHtml(r.nama)}</strong><br><span class="text-muted" style="font-size:12px;">${escapeHtml(r.email)}</span></td>
              <td>${escapeHtml(r.eventName)}</td>
              <td class="mono" style="font-size:12px;">${escapeHtml(r.certNumber)}</td>
              <td>${formatDateTime(r.generatedAt)}</td>
              <td><span class="badge badge-neutral">${escapeHtml(r.format)}</span></td>
              <td>${statusBadge(r.emailStatus)}</td>
              <td class="text-right">
                <a href="${r.fileUrl}" target="_blank" class="btn-ghost">Lihat File</a>
                ${r.emailStatus !== 'Terkirim' ? `<button class="btn-ghost" onclick="resendEmail('${r.id}', this)">Kirim Ulang</button>` : ''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }
  
  function resendEmail(participantId, btnEl) {
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = '<span class="spinner spinner-sm"></span> Mengirim...';
    }
    GAS()
      .withSuccessHandler(res => {
        if (!res.success) {
          if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Kirim Ulang'; }
          showToast('Gagal', res.message, 'danger');
          return;
        }
        showToast('Berhasil', res.message, 'success');
        const row = AppState.historyRows && AppState.historyRows.find(r => r.id === participantId);
        if (row) {
          row.emailStatus = 'Terkirim';
          renderHistoryTable(AppState.historyRows);
        } else {
          loadHistory(true);
        }
      })
      .withFailureHandler(err => {
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Kirim Ulang'; }
        showToast('Error', err.message, 'danger');
      })
      .resendCertificateEmail(participantId);
  }
  
  /**
   * ============================================================
   * OPERATOR — RINGKASAN ACARA
   * ============================================================
   */
  function renderOperatorOverview(forceRefresh) {
    const c = document.getElementById('app-container');
    const evId = AppState.operator ? AppState.operator.assignedEventId : null;
    const cached = !forceRefresh && (typeof DataCache !== 'undefined') && DataCache.get('getOperatorDashboardStats', [evId]);

    c.innerHTML = `
      <div class="flex-between mb-16">
        <div>
          <h1 class="page-title">Ringkasan Acara</h1>
          <p class="page-subtitle" style="margin:0;">Kelola persiapan sertifikat untuk acara yang ditugaskan kepada Anda.</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btnRefreshOpOverview" onclick="refreshOperatorOverview()">
          <i class="bi bi-arrow-clockwise" id="iconRefreshOpOverview"></i> Segarkan
        </button>
      </div>
      <div id="opOverviewBody">${cached ? '' : skeletonBlock(220)}</div>`;
  
    const gasCaller = forceRefresh ? GAS().fresh() : GAS();
    gasCaller
      .withSuccessHandler(res => {
        const icon = document.getElementById('iconRefreshOpOverview');
        if (icon) icon.classList.remove('spin-icon');
        if (!isCurrentPage('op-overview')) return;
        if (!res.success) { renderFetchError('opOverviewBody', res.message, 'renderOperatorOverview'); return; }
        renderOperatorOverviewBody(res.data);
      })
      .withFailureHandler(err => {
        const icon = document.getElementById('iconRefreshOpOverview');
        if (icon) icon.classList.remove('spin-icon');
        if (!isCurrentPage('op-overview')) return;
        renderFetchError('opOverviewBody', err.message, 'renderOperatorOverview');
      })
      .getOperatorDashboardStats(evId);
  }

  function refreshOperatorOverview() {
    const icon = document.getElementById('iconRefreshOpOverview');
    if (icon) icon.classList.add('spin-icon');
    renderOperatorOverview(true);
  }
  
  function renderOperatorOverviewBody(data) {
    const body = document.getElementById('opOverviewBody');
    if (!body) return;
    if (!data.hasEvent) {
      body.innerHTML = `<div class="card table-empty">Anda belum ditugaskan ke acara manapun. Hubungi admin untuk penugasan.</div>`;
      return;
    }
    const ev = data.event;
    window._opEditingEvent = ev;
    const step = ev.TemplateId ? (ev.Status === 'Active' ? 4 : 3) : 2;
    body.innerHTML = `
      ${renderStepper(step)}
      <div class="card mb-16">
        <div class="flex-between">
          <div>
            <span class="eyebrow">Acara Ditugaskan</span>
            <h2 class="section-title" style="margin-top:4px;">${escapeHtml(ev.Nama)}</h2>
          </div>
          ${statusBadge(ev.Status)}
        </div>
        <div class="grid grid-3 mt-16">
          <div><span class="form-label">Tanggal</span><div>${formatDate(ev.Tanggal)}</div></div>
          <div><span class="form-label">Penyelenggara</span><div>${escapeHtml(ev.Penyelenggara)}</div></div>
          <div><span class="form-label">Template</span><div>${ev.TemplateId ? 'Sudah dipilih' : '<span class="text-muted">Belum dipilih</span>'}</div></div>
        </div>
      </div>
      <div class="grid grid-2">
        ${statCard('bi-people-fill', data.totalRegistered, 'Peserta Terdaftar')}
        ${statCard('bi-patch-check-fill', data.totalGenerated, 'Sertifikat Terbit')}
      </div>
      <div class="callout callout-info mt-16">
        <i class="bi bi-arrow-right-circle" style="margin-top:1px;"></i>
        <div>${ev.Status === 'Active'
          ? 'Acara sudah dipublikasikan. Buka menu "Publikasikan Tautan" untuk membagikan formulir pendaftaran.'
          : 'Lanjutkan ke menu "Isi Konten & Template" untuk melengkapi persiapan sertifikat.'}</div>
      </div>`;
  }
  
  function renderStepper(activeStep) {
    const steps = ['Acara Ditugaskan', 'Isi Konten & Template', 'Pratinjau & Verifikasi', 'Publikasikan Tautan'];
    return `<div class="stepper">
      ${steps.map((label, i) => {
        const n = i + 1;
        const cls = n < activeStep ? 'done' : n === activeStep ? 'current' : '';
        return `<div class="step-item ${cls}">
          <div class="step-circle">${n < activeStep ? '<i class="bi bi-check-lg"></i>' : n}</div>
          <div class="step-label">${label}</div>
        </div>${i < steps.length - 1 ? '<div class="step-line"></div>' : ''}`;
      }).join('')}
    </div>`;
  }

  /**
   * ============================================================
   * OPERATOR — ISI KONTEN & PILIH TEMPLATE
   * ============================================================
   */
  async function renderOperatorContent() {
    const c = document.getElementById('app-container');
    const evId = AppState.operator ? AppState.operator.assignedEventId : null;

    // Cek apakah data event dan templates sudah ada di memori / cache
    const cachedEv = window._opEditingEvent || (typeof DataCache !== 'undefined' && DataCache.get('getEventById', [evId])?.data?.data);
    const cachedTpls = (typeof DataCache !== 'undefined' && DataCache.get('getTemplates', [])?.data?.data) || (AppState.templates.length ? AppState.templates : null);

    if (cachedEv && cachedTpls) {
      window._opEditingEvent = cachedEv;
      window._opTemplatesList = cachedTpls;
      const initialTemplateId = cachedEv.TemplateId || (cachedTpls.find(t => t.Status === 'Active') || {}).ID || '';
      window._opSelectedTemplate = initialTemplateId;

      const cachedFields = initialTemplateId ? (typeof DataCache !== 'undefined' && DataCache.get('getCertificateFields', [initialTemplateId])?.data?.data) : [];
      if (cachedFields) {
        c.innerHTML = `
          <h1 class="page-title">Isi Konten & Template</h1>
          <p class="page-subtitle">Pilih desain sertifikat dan lengkapi variabel acara.</p>
          <div id="opContentBody"></div>`;
        renderOperatorContentBody(cachedEv, cachedTpls, cachedFields);
        return;
      }
    }

    c.innerHTML = `
      <h1 class="page-title">Isi Konten & Template</h1>
      <p class="page-subtitle">Pilih desain sertifikat dan lengkapi variabel acara.</p>
      <div id="opContentBody">${skeletonBlock(320)}</div>`;

    try {
      // Ambil data event dan daftar template secara PARALEL (jauh lebih cepat daripada berantai)
      const [eventRes, tplRes] = await Promise.all([
        GASPromise('getEventById', evId),
        GASPromise('getTemplates')
      ]);

      if (!isCurrentPage('op-content')) return;
      if (!eventRes.success) { renderFetchError('opContentBody', eventRes.message, 'renderOperatorContent'); return; }

      const templates = tplRes.success ? tplRes.data : [];
      window._opTemplatesList = templates;
      const initialTemplateId = eventRes.data.TemplateId || (templates.find(t => t.Status === 'Active') || {}).ID || '';
      window._opSelectedTemplate = initialTemplateId;

      if (!initialTemplateId) {
        renderOperatorContentBody(eventRes.data, templates, []);
        return;
      }

      const fieldsRes = await GASPromise('getCertificateFields', initialTemplateId);
      if (!isCurrentPage('op-content')) return;
      renderOperatorContentBody(eventRes.data, templates, fieldsRes.success ? fieldsRes.data : []);
    } catch (err) {
      if (!isCurrentPage('op-content')) return;
      renderFetchError('opContentBody', err.message, 'renderOperatorContent');
    }
  }
  
  function renderOperatorContentBody(ev, templates, fields) {
    const body = document.getElementById('opContentBody');
    if (!body) return;
    window._opEditingEvent = ev;
    // window._opSelectedTemplate SUDAH ditentukan oleh pemanggil (renderOperatorContent
    // atau selectOpTemplate) — tidak dihitung ulang di sini, supaya pilihan operator
    // yang sedang aktif tidak tertimpa saat berpindah template.
    const activeTemplates = templates.filter(t => t.Status === 'Active');
    const customFields = fields.filter(f => !(f.IsLocked === true || f.IsLocked === 'true'));
  
    body.innerHTML = `
      <h2 class="section-title">1. Pilih Template Desain</h2>
      <div class="grid grid-3 mb-16" id="opTemplateGrid">
        ${activeTemplates.length === 0 ? '<div class="card table-empty" style="grid-column:1/-1;">Belum ada template aktif. Hubungi admin.</div>' :
          activeTemplates.map(t => `
          <div class="template-card ${window._opSelectedTemplate === t.ID ? 'selected' : ''}" data-tpl="${t.ID}" onclick="selectOpTemplate('${t.ID}')">
            ${window._opSelectedTemplate === t.ID ? '<div class="check-badge"><i class="bi bi-check-lg"></i></div>' : ''}
            <div style="margin-bottom:12px;">${templateThumbHtml(t.SlideId)}</div>
            <strong style="font-size:13px;">${escapeHtml(t.Nama)}</strong>
          </div>`).join('')}
      </div>
  
      <h2 class="section-title">2. Lengkapi Variabel Konten</h2>
      <div class="callout callout-info mb-16"><i class="bi bi-info-circle" style="margin-top:1px;"></i><div>Field <strong>Nama Peserta</strong> dan <strong>Peran</strong> otomatis terisi dari formulir pendaftaran peserta — tidak perlu diisi manual di sini. Struktur field kustom di bawah mengikuti template yang dipilih di atas.</div></div>
      ${!window._opSelectedTemplate ? '<div class="card table-empty">Pilih salah satu template di atas untuk melihat variabel kontennya.</div>' : `
      <div class="card">
        ${customFields.map(f => {
          if (f.VariableTag === 'nomor_sertifikat') {
            return `<div class="form-group">
              <label class="form-label">${escapeHtml(f.FieldLabel)}</label>
              <input type="text" class="form-control mono op-field" data-tag="nomor_sertifikat" value="${escapeHtml((ev.ContentValues || {}).nomor_sertifikat || '{SEQ:006}/FAKTA/SE/X/{YYYY}')}">
              <div class="form-hint">Gunakan <span class="tag-chip">{YYYY}</span> untuk tahun, dan <span class="tag-chip">{SEQ:000}</span> untuk nomor urut mulai dari 1 (atau <span class="tag-chip">{SEQ:030}</span> untuk mulai dari nomor 030 dan seterusnya).</div>
            </div>`;
          }
          return `<div class="form-group">
            <label class="form-label">${escapeHtml(f.FieldLabel)}</label>
            ${f.InputType === 'textarea'
              ? `<textarea class="form-control op-field" data-tag="${f.VariableTag}">${escapeHtml((ev.ContentValues || {})[f.VariableTag] || '')}</textarea>`
              : `<input type="${f.InputType === 'date' ? 'date' : 'text'}" class="form-control op-field" data-tag="${f.VariableTag}" value="${escapeHtml((ev.ContentValues || {})[f.VariableTag] || '')}">`}
          </div>`;
        }).join('')}
      </div>`}
      <div class="flex-between mt-24">
        <span class="text-muted" style="font-size:12px;" id="draftSavedNote"></span>
        <button class="btn btn-primary" onclick="saveOperatorContent()" id="saveContentBtn" ${!window._opSelectedTemplate ? 'disabled' : ''}><i class="bi bi-arrow-right"></i> Simpan & Lanjut ke Pratinjau</button>
      </div>`;
  
    // Optimistic autosave draft ke localStorage (prinsip gas-instant-ux)
    document.querySelectorAll('.op-field').forEach(el => {
      el.addEventListener('input', () => {
        const draft = {};
        document.querySelectorAll('.op-field').forEach(f => draft[f.dataset.tag] = f.value);
        localStorage.setItem('certgen_draft_' + ev.ID, JSON.stringify(draft));
        document.getElementById('draftSavedNote').textContent = 'Draft tersimpan otomatis di perangkat ini.';
      });
    });
  }
  
  function selectOpTemplate(id) {
    if (id === window._opSelectedTemplate) return;

    // Simpan dulu nilai yang sudah sempat diketik
    const currentValues = {};
    document.querySelectorAll('.op-field').forEach(el => currentValues[el.dataset.tag] = el.value);
    window._opEditingEvent.ContentValues = Object.assign({}, window._opEditingEvent.ContentValues, currentValues);

    window._opSelectedTemplate = id;
    const ev = window._opEditingEvent;
    const templates = window._opTemplatesList || [];

    // Jika fields template ini sudah ada di cache, render seketika tanpa skeleton!
    const cachedFields = (typeof DataCache !== 'undefined') && DataCache.get('getCertificateFields', [id]);
    if (cachedFields && cachedFields.data && cachedFields.data.success) {
      renderOperatorContentBody(ev, templates, cachedFields.data.data);
      return;
    }

    document.getElementById('opContentBody').innerHTML = skeletonBlock(320);

    GAS()
      .withSuccessHandler(res => {
        if (!isCurrentPage('op-content')) return;
        if (!res.success) { renderFetchError('opContentBody', res.message, 'renderOperatorContent'); return; }
        renderOperatorContentBody(ev, templates, res.data);
      })
      .withFailureHandler(err => {
        if (!isCurrentPage('op-content')) return;
        renderFetchError('opContentBody', err.message, 'renderOperatorContent');
      })
      .getCertificateFields(id);
  }
  
  function saveOperatorContent() {
    if (!window._opSelectedTemplate) { showToast('Belum lengkap', 'Pilih template terlebih dahulu.', 'warning'); return; }
    const contentValues = {};
    document.querySelectorAll('.op-field').forEach(el => contentValues[el.dataset.tag] = el.value);
  
    const btn = document.getElementById('saveContentBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
  
    GAS()
      .withSuccessHandler(res => {
        btn.disabled = false; btn.innerHTML = '<i class="bi bi-arrow-right"></i> Simpan & Lanjut ke Pratinjau';
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        localStorage.removeItem('certgen_draft_' + window._opEditingEvent.ID);
        showToast('Berhasil', res.message, 'success');

        // Optimasi: update state lokal & cache seketika
        window._opEditingEvent.TemplateId = window._opSelectedTemplate;
        window._opEditingEvent.ContentValues = contentValues;
        if (typeof DataCache !== 'undefined') {
          DataCache.set('getEventById', [window._opEditingEvent.ID], { success: true, data: window._opEditingEvent });
        }
        navigateTo('op-preview');
      })
      .withFailureHandler(err => { btn.disabled = false; btn.innerHTML = '<i class="bi bi-arrow-right"></i> Simpan & Lanjut ke Pratinjau'; showToast('Error', err.message, 'danger'); })
      .updateEventContent(window._opEditingEvent.ID, window._opSelectedTemplate, contentValues);
  }
  
  /**
   * ============================================================
   * OPERATOR — PRATINJAU SERTIFIKAT
   * ============================================================
   */
  function renderOperatorPreview() {
    const c = document.getElementById('app-container');
    c.innerHTML = `
      <h1 class="page-title">Pratinjau Sertifikat</h1>
      <p class="page-subtitle">Verifikasi tampilan sertifikat dengan data contoh sebelum dipublikasikan.</p>
      <div id="opPreviewBody">${skeletonBlock(320)}</div>`;

    // Jika window._opEditingEvent sudah ada di memori dan template sudah dipilih, render instan!
    if (window._opEditingEvent && window._opEditingEvent.TemplateId) {
      renderOperatorPreviewBody(window._opEditingEvent);
      return;
    }
  
    GAS()
      .withSuccessHandler(res => {
        if (!isCurrentPage('op-preview')) return;
        if (!res.success) { renderFetchError('opPreviewBody', res.message, 'renderOperatorPreview'); return; }
        window._opEditingEvent = res.data;
        renderOperatorPreviewBody(res.data);
      })
      .withFailureHandler(err => {
        if (!isCurrentPage('op-preview')) return;
        renderFetchError('opPreviewBody', err.message, 'renderOperatorPreview');
      })
      .getEventById(AppState.operator.assignedEventId);
  }
  
  function renderOperatorPreviewBody(ev) {
    const body = document.getElementById('opPreviewBody');
    if (!body) return;
    if (!ev.TemplateId) {
      body.innerHTML = `<div class="card table-empty">Lengkapi menu "Isi Konten & Template" terlebih dahulu sebelum melihat pratinjau.</div>`;
      return;
    }
    body.innerHTML = `
      <div class="card text-center mb-16">
        <div id="previewImgWrap" style="aspect-ratio:16/9;background:#F1F5F9;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
          Klik "Buat Pratinjau" untuk merender sertifikat contoh.
        </div>
        <button class="btn btn-primary mt-16" onclick="generatePreview()" id="genPreviewBtn"><i class="bi bi-eye"></i> Buat Pratinjau</button>
      </div>
      <div class="flex-between">
        <button class="btn btn-secondary" onclick="navigateTo('op-content')"><i class="bi bi-arrow-left"></i> Edit Konten / Template</button>
        <button class="btn btn-primary" onclick="navigateTo('op-publish')">Konfirmasi & Lanjut Publikasi <i class="bi bi-arrow-right"></i></button>
      </div>`;
  }
  
  function generatePreview() {
    const ev = window._opEditingEvent;
    const btn = document.getElementById('genPreviewBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Merender...';
  
    GAS()
      .withSuccessHandler(res => {
        btn.disabled = false; btn.innerHTML = '<i class="bi bi-eye"></i> Buat Pratinjau Lagi';
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        document.getElementById('previewImgWrap').innerHTML = `<img src="${res.data.imageUrl}" style="max-width:100%;border-radius:10px;">`;
      })
      .withFailureHandler(err => { btn.disabled = false; showToast('Error', err.message, 'danger'); })
      .previewCertificate(ev.TemplateId, ev.ContentValues, 'John Doe', 'Peserta');
  }
  
  /**
   * ============================================================
   * OPERATOR — PUBLIKASIKAN TAUTAN & QR
   * ============================================================
   */
  function renderOperatorPublish() {
    const c = document.getElementById('app-container');
    c.innerHTML = `
      <h1 class="page-title">Publikasikan Tautan & QR</h1>
      <p class="page-subtitle">Sebarkan tautan pendaftaran ke calon peserta.</p>
      <div id="opPublishBody">${skeletonBlock(280)}</div>`;

    // Jika window._opEditingEvent sudah ada di memori dan template sudah dipilih, render instan!
    if (window._opEditingEvent && window._opEditingEvent.TemplateId) {
      renderOperatorPublishBody(window._opEditingEvent);
      return;
    }
  
    GAS()
      .withSuccessHandler(res => {
        if (!isCurrentPage('op-publish')) return;
        if (!res.success) { renderFetchError('opPublishBody', res.message, 'renderOperatorPublish'); return; }
        window._opEditingEvent = res.data;
        renderOperatorPublishBody(res.data);
      })
      .withFailureHandler(err => {
        if (!isCurrentPage('op-publish')) return;
        renderFetchError('opPublishBody', err.message, 'renderOperatorPublish');
      })
      .getEventById(AppState.operator.assignedEventId);
  }
  
  /**
   * Membangun URL form pendaftaran publik relatif terhadap lokasi index.html
   * saat ini (yang di-hosting di GitHub Pages bersama public.html). Cara ini
   * menggantikan getWebAppUrl() versi lama yang mengembalikan URL /exec GAS
   * (sekarang cuma endpoint JSON, bukan halaman untuk peserta).
   */
  function buildPublicRegistrationUrl(eventId) {
    return new URL('public.html?event=' + encodeURIComponent(eventId), location.href).toString();
  }

  function renderOperatorPublishBody(ev) {
    const body = document.getElementById('opPublishBody');
    if (!body) return;
    if (!ev.TemplateId) {
      body.innerHTML = `<div class="card table-empty">Lengkapi "Isi Konten & Template" terlebih dahulu.</div>`;
      return;
    }
    if (ev.Status === 'Active') {
      // Tautan pendaftaran publik sekarang dibangun langsung di sisi klien
      // (public.html ada di frontend yang sama, di-host di GitHub Pages) —
      // tidak lagi lewat ScriptApp.getService().getUrl() di backend, karena
      // URL exec GAS sekarang cuma endpoint JSON, bukan halaman untuk peserta.
      const url = buildPublicRegistrationUrl(ev.ID);
      renderPublishedLinkCard(body, ev, url);
      return;
    }
    body.innerHTML = `
      <div class="card text-center">
        <i class="bi bi-rocket-takeoff" style="font-size:32px;color:var(--primary);"></i>
        <h2 class="section-title mt-16">Siap Dipublikasikan</h2>
        <p class="text-muted">Setelah dipublikasikan, tautan pendaftaran akan aktif dan dapat dibagikan ke peserta.</p>
        <button class="btn btn-primary" onclick="publishEventAction('${ev.ID}')" id="publishBtn"><i class="bi bi-check-lg"></i> Publikasikan Sekarang</button>
      </div>`;
  }
  
  function publishEventAction(eventId) {
    const btn = document.getElementById('publishBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Mempublikasikan...';
  
    GAS()
      .withSuccessHandler(res => {
        btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Publikasikan Sekarang';
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        showToast('Berhasil', 'Acara berhasil dipublikasikan.', 'success');
        if (window._opEditingEvent) {
          window._opEditingEvent.Status = 'Active';
          if (typeof DataCache !== 'undefined') {
            DataCache.set('getEventById', [eventId], { success: true, data: window._opEditingEvent });
          }
        }
        renderOperatorPublish();
      })
      .withFailureHandler(err => { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Publikasikan Sekarang'; showToast('Error', err.message, 'danger'); })
      .publishEvent(eventId);
  }
  
  function renderPublishedLinkCard(body, ev, url) {
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(url);
    body.innerHTML = `
      <div class="callout callout-info mb-16"><i class="bi bi-broadcast" style="margin-top:1px;"></i><div><strong>Status: Aktif & Menerima Pendaftaran</strong></div></div>
      <div class="grid grid-2">
        <div class="card text-center">
          <img src="${qrUrl}" alt="QR Code" style="border-radius:10px;margin-bottom:12px;">
          <div class="text-muted" style="font-size:12px;">Pindai untuk mendaftar</div>
        </div>
        <div class="card">
          <label class="form-label">URL Pendaftaran Publik</label>
          <div class="flex gap-8 mb-16">
            <input class="form-control mono" value="${url}" readonly id="regUrlInput" style="font-size:12px;">
            <button class="btn btn-secondary btn-icon" onclick="copyToClipboard('${escapeJs(url)}','Tautan')"><i class="bi bi-clipboard"></i></button>
          </div>
          <a href="${url}" target="_blank" class="btn btn-secondary btn-full mb-16"><i class="bi bi-box-arrow-up-right"></i> Buka Tautan</a>
          <div class="callout callout-warning"><i class="bi bi-shield-check" style="margin-top:1px;"></i><div>Setiap peserta hanya dapat mendaftar satu kali untuk acara ini.</div></div>
        </div>
      </div>
      <div class="card mt-16">
        <button class="btn btn-danger" onclick="deactivateEventAction('${ev.ID}'); "><i class="bi bi-pause-circle"></i> Nonaktifkan Tautan Pendaftaran</button>
      </div>`;
  }

