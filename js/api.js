/**
 * ============================================================
 * LAPISAN API — Certiflow Frontend (gas-pro-api)
 * ============================================================
 * Backend GAS sekarang murni REST (JSON via doGet/doPost), tanpa
 * HtmlService dan tanpa google.script.run (itu hanya bekerja dari
 * dalam ekosistem Google, tidak dari frontend eksternal seperti ini).
 *
 * GAS() di bawah ini adalah SATU-SATUNYA hal yang menggantikan pola
 * lama "google.script.run.withSuccessHandler(x).withFailureHandler(y).namaFungsi(args)"
 * di js/console.js dan js/public.js — dengan sengaja meniru API yang
 * sama persis (lewat JS Proxy) supaya seluruh logika tampilan yang
 * sudah final TIDAK PERLU ditulis ulang, hanya "google.script.run"
 * diganti jadi "GAS()". Di baliknya, semuanya adalah fetch() biasa:
 * WAJIB header 'text/plain;charset=utf-8' untuk POST (menghindari
 * CORS preflight yang diblok Apps Script), dan action dikirim lewat
 * query string untuk GET.
 */

// Action yang MENULIS data → wajib dikirim via POST.
// (harus sinkron dengan POST_ACTIONS di Kode.gs)
const WRITE_ACTIONS = new Set([
  'adminLogin', 'operatorLogin', 'registerAndGenerate',
  'addTemplate', 'toggleTemplateStatus', 'saveCertificateFields',
  'createEvent', 'deactivateEvent', 'updateEventContent', 'publishEvent',
  'createOperatorAccount', 'toggleOperatorStatus', 'regenerateOperatorPassword',
  'previewCertificate', 'resendCertificateEmail'
]);

/** Token sesi yang sedang aktif (Admin atau Operator), dikirim otomatis ke backend. */
function currentSessionToken_() {
  if (typeof AppState === 'undefined') return null;
  if (AppState.role === 'admin' && AppState.admin) return AppState.admin.token || null;
  if (AppState.role === 'operator' && AppState.operator) return AppState.operator.token || null;
  return null;
}

/**
 * GAS() meniru chain google.script.run.withSuccessHandler(fn).withFailureHandler(fn2).namaAksi(args)
 * lewat Proxy: properti apa pun yang diakses selain withSuccessHandler/withFailureHandler
 * dianggap sebagai nama action, dan pemanggilannya diteruskan ke fetch() sungguhan.
 */
function GAS(successHandler, failureHandler) {
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === 'withSuccessHandler') return (fn) => GAS(fn, failureHandler);
      if (prop === 'withFailureHandler') return (fn) => GAS(successHandler, fn);
      const action = prop;
      return function (...args) {
        callBackend_(action, args, successHandler, failureHandler);
      };
    }
  });
}

async function callBackend_(action, args, onSuccess, onFailure) {
  try {
    const token = currentSessionToken_();
    let response;

    if (WRITE_ACTIONS.has(action)) {
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

    if (!response.ok) throw new Error('Server merespons dengan status ' + response.status + '.');
    const json = await response.json();
    if (onSuccess) onSuccess(json);
  } catch (err) {
    if (onFailure) onFailure(err instanceof Error ? err : new Error(String(err)));
  }
}
