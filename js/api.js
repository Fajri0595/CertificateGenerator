/**
 * ============================================================
 * LAPISAN API — Certiflow Frontend (gas-pro-api)
 * ============================================================
 * Backend GAS sekarang murni REST (JSON via doGet/doPost), tanpa
 * HtmlService dan tanpa google.script.run (itu hanya bekerja dari
 * dalam ekosistem Google, tidak dari frontend eksternal seperti ini).
 *
 * Diperkaya dengan lapisan In-Memory Caching & SWR (Stale-While-Revalidate)
 * serta Request Deduplication untuk membuat perpindahan menu instan (0 ms)
 * tanpa delay berulang ke Apps Script.
 */

// Action yang MENULIS data → wajib dikirim via POST.
// (harus sinkron dengan POST_ACTIONS di Kode.gs)
const WRITE_ACTIONS = new Set([
  'adminLogin', 'operatorLogin', 'registerAndGenerate',
  'addTemplate', 'toggleTemplateStatus', 'saveCertificateFields',
  'createEvent', 'deactivateEvent', 'updateEventContent', 'publishEvent',
  'createOperatorAccount', 'toggleOperatorStatus', 'regenerateOperatorPassword',
  'adminChangePassword',
  'previewCertificate', 'resendCertificateEmail'
]);

// Pemetaan invalidasi cache otomatis saat aksi tulis (mutasi) berhasil
const MUTATION_INVALIDATIONS = {
  addTemplate: ['getTemplates', 'getAdminDashboardStats'],
  toggleTemplateStatus: ['getTemplates', 'getAdminDashboardStats'],
  saveCertificateFields: ['getCertificateFields'],
  createEvent: ['getEvents', 'getAdminDashboardStats', 'getOperators'],
  deactivateEvent: ['getEvents', 'getAdminDashboardStats', 'getEventById', 'getOperatorDashboardStats'],
  createOperatorAccount: ['getOperators', 'getAdminDashboardStats'],
  toggleOperatorStatus: ['getOperators', 'getAdminDashboardStats'],
  regenerateOperatorPassword: ['getOperators'],
  adminChangePassword: [],
  updateEventContent: ['getEventById', 'getOperatorDashboardStats', 'getAdminDashboardStats', 'getEvents'],
  publishEvent: ['getEventById', 'getOperatorDashboardStats', 'getAdminDashboardStats', 'getEvents'],
  resendCertificateEmail: ['getGenerationHistory', 'getAdminDashboardStats'],
  registerAndGenerate: ['getGenerationHistory', 'getAdminDashboardStats', 'getOperatorDashboardStats', 'getPublicEvent']
};

/**
 * In-Memory Data Cache & SWR Manager
 */
const DataCache = {
  _store: new Map(),
  TTL: 4 * 60 * 1000,       // 4 menit: masa kedaluwarsa maksimal di memori
  FRESH_TTL: 45 * 1000,     // 45 detik: dianggap sangat baru, tanpa revalidasi background

  _key(action, args) {
    const token = typeof currentSessionToken_ === 'function' ? currentSessionToken_() : '';
    return `${token || 'anon'}:${action}:${JSON.stringify(args || [])}`;
  },

  get(action, args) {
    const key = this._key(action, args);
    const entry = this._store.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this._store.delete(key);
      return null;
    }
    return entry;
  },

  set(action, args, data) {
    const key = this._key(action, args);
    this._store.set(key, { data, timestamp: Date.now() });
  },

  invalidate(actionPattern) {
    if (!actionPattern) {
      this._store.clear();
      return;
    }
    for (const key of this._store.keys()) {
      if (key.includes(':' + actionPattern + ':') || key.endsWith(':' + actionPattern)) {
        this._store.delete(key);
      }
    }
  },

  clear() {
    this._store.clear();
  }
};

// Request deduplication: mencegah request ganda ke backend jika dipanggil bersamaan
const _pendingRequests = new Map();

/** Token sesi yang sedang aktif (Admin atau Operator), dikirim otomatis ke backend. */
function currentSessionToken_() {
  if (typeof AppState === 'undefined') return null;
  if (AppState.role === 'admin' && AppState.admin) return AppState.admin.token || null;
  if (AppState.role === 'operator' && AppState.operator) return AppState.operator.token || null;
  return null;
}

/**
 * GAS() meniru chain google.script.run.withSuccessHandler(fn).withFailureHandler(fn2).namaAksi(args)
 * lewat Proxy, dilengkapi opsi .fresh() untuk bypass cache saat user klik tombol Segarkan.
 */
function GAS(successHandler, failureHandler, options) {
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === 'withSuccessHandler') return (fn) => GAS(fn, failureHandler, options);
      if (prop === 'withFailureHandler') return (fn) => GAS(successHandler, fn, options);
      if (prop === 'fresh') return () => GAS(successHandler, failureHandler, Object.assign({}, options, { forceRefresh: true }));
      const action = prop;
      return function (...args) {
        callBackend_(action, args, successHandler, failureHandler, options);
      };
    }
  });
}

/**
 * Helper pemanggilan berbasis Promise agar mudah dijalankan paralel via Promise.all
 */
function GASPromise(action, ...args) {
  return new Promise((resolve, reject) => {
    GAS(resolve, reject)[action](...args);
  });
}

// Pastikan tersedia di scope global (window / globalThis)
const _rootScope = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
_rootScope.DataCache = DataCache;
_rootScope.GAS = GAS;
_rootScope.GASPromise = GASPromise;

async function callBackend_(action, args, onSuccess, onFailure, options) {
  options = options || {};
  const isWrite = WRITE_ACTIONS.has(action);

  // Jika aksi baca dan TIDAK dipaksa refresh: cek cache memori terlebih dahulu
  if (!isWrite && !options.forceRefresh) {
    const cached = DataCache.get(action, args);
    if (cached) {
      // 1. Sajikan data cache seketika (0 ms)
      if (onSuccess) {
        try { onSuccess(cached.data); } catch (e) { console.error('[Cache Handler Error]', e); }
      }

      // 2. Evaluasi apakah perlu revalidasi latar belakang (SWR)
      const isFresh = (Date.now() - cached.timestamp) < DataCache.FRESH_TTL;
      if (isFresh) return; // Masih sangat segar, tidak perlu network fetch

      // Revalidasi senyap di background
      fetchFromNetwork_(action, args, (freshData) => {
        // Jika data dari server ada pembaruan dibanding cache, infokan UI
        if (JSON.stringify(freshData) !== JSON.stringify(cached.data)) {
          if (onSuccess) {
            try { onSuccess(freshData); } catch (e) { console.error('[SWR Update Error]', e); }
          }
        }
      }, null);
      return;
    }
  }

  return fetchFromNetwork_(action, args, onSuccess, onFailure);
}

async function fetchFromNetwork_(action, args, onSuccess, onFailure) {
  const isWrite = WRITE_ACTIONS.has(action);
  const cacheKey = DataCache._key(action, args);

  // Deduplikasi: gabungkan jika ada request identik yang sedang berjalan
  if (!isWrite && _pendingRequests.has(cacheKey)) {
    try {
      const json = await _pendingRequests.get(cacheKey);
      if (onSuccess) onSuccess(json);
      return;
    } catch (err) {
      if (onFailure) onFailure(err);
      return;
    }
  }

  const promise = (async () => {
    const token = currentSessionToken_();
    let response;

    if (isWrite) {
      response = await fetch(GAS_URL, {
        method: 'POST',
        // WAJIB text/plain — JSON men-trigger CORS preflight yang diblok GAS.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, args, token })
      });
    } else {
      const qs = new URLSearchParams({ action, args: JSON.stringify(args) });
      if (token) qs.set('token', token);
      response = await fetch(GAS_URL + '?' + qs.toString());
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('URL Web App tidak ditemukan (404). Pastikan GAS_URL di js/config.js sudah benar dan deployment aktif.');
      }
      throw new Error('Server merespons dengan status ' + response.status + '.');
    }
    return await response.json();
  })();

  if (!isWrite) {
    _pendingRequests.set(cacheKey, promise);
  }

  try {
    const json = await promise;
    if (!isWrite) {
      _pendingRequests.delete(cacheKey);
      if (json && json.success) {
        DataCache.set(action, args, json);
      }
    } else {
      // Jika aksi tulis sukses, bersihkan cache terkait
      if (json && json.success) {
        const toInvalidate = MUTATION_INVALIDATIONS[action];
        if (toInvalidate && toInvalidate.length) {
          toInvalidate.forEach(act => DataCache.invalidate(act));
        } else {
          DataCache.clear();
        }
      }
    }

    // Deteksi jika server menolak karena sesi login kedaluwarsa
    if (json && !json.success && json.message && (json.message.includes('Sesi') || json.message.includes('kedaluwarsa') || json.message.includes('login kembali'))) {
      if (typeof showToast === 'function') {
        showToast('Sesi Kedaluwarsa', json.message, 'warning');
      }
    }

    if (onSuccess) onSuccess(json);
  } catch (err) {
    if (!isWrite) _pendingRequests.delete(cacheKey);
    const errorObj = err instanceof Error ? err : new Error(String(err));
    if (onFailure) onFailure(errorObj);
  }
}
