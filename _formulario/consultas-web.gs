/**
 * Debra Technology · Formulario de contacto de la web
 *
 * Recibe cada consulta de debratechnology.com, la guarda en la hoja "Consultas web"
 * de esta planilla y avisa por mail.
 *
 * Instalación (una sola vez): ver INSTALAR-FORMULARIO.md
 *   1. Ejecutar  instalar  (crea la hoja y pide permisos).
 *   2. Implementar > Nueva implementación > Aplicación web
 *      Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario.
 *   3. Pasar la URL de la aplicación web para cargarla en la web.
 */

// Mail que recibe las consultas. Si queda vacío, llegan al mail de la cuenta donde está instalado el script.
const MAIL_DESTINO = 'comercial.debratech@gmail.com';

const HOJA = 'Consultas web';
const COLUMNAS = ['Fecha', 'Nombre', 'E-mail', 'Empresa', 'Producto', 'Mensaje', 'Página', 'Estado', 'Notas'];
const LIMITES = { nombre: 80, email: 120, empresa: 120, producto: 300, mensaje: 5000, pagina: 300 };
const MIN_SEGUNDOS = 3;            // menos que esto entre que abre la página y envía = robot
const MAX_POR_MAIL_POR_HORA = 5;   // freno a envíos repetidos


function doPost(e) {
  try {
    const p = (e && e.parameter) || {};

    // Anti-spam: campo trampa y tiempo mínimo. Se responde "ok" para no darle pistas al robot.
    if (p.sitio_web) return respuesta_(true);
    const t0 = Number(p.t0);
    if (t0 && Date.now() - t0 < MIN_SEGUNDOS * 1000) return respuesta_(true);

    const d = {};
    Object.keys(LIMITES).forEach(function (k) { d[k] = String(p[k] || '').trim().slice(0, LIMITES[k]); });

    if (d.nombre.length < 2) return respuesta_(false, 'Falta el nombre.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return respuesta_(false, 'El e-mail no es válido.');
    if (d.mensaje.length < 10) return respuesta_(false, 'El mensaje es muy corto.');

    const cache = CacheService.getScriptCache();
    const clave = 'n_' + Utilities.base64EncodeWebSafe(d.email.toLowerCase()).slice(0, 200);
    const n = Number(cache.get(clave) || 0);
    if (n >= MAX_POR_MAIL_POR_HORA) return respuesta_(false, 'Recibimos varias consultas seguidas. Probá más tarde.');
    cache.put(clave, String(n + 1), 3600);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      hoja_().appendRow([new Date(), sinFormula_(d.nombre), sinFormula_(d.email), sinFormula_(d.empresa),
                         sinFormula_(d.producto), sinFormula_(d.mensaje), sinFormula_(d.pagina), 'Nueva', '']);
    } finally {
      lock.releaseLock();
    }

    avisar_(d);
    return respuesta_(true);
  } catch (err) {
    console.error(err);
    return respuesta_(false, 'Error interno.');
  }
}

// Si alguien abre la URL en el navegador, que vea algo claro.
function doGet() {
  return ContentService.createTextOutput('Formulario de Debra Technology: funcionando.');
}


function avisar_(d) {
  const destino = MAIL_DESTINO || Session.getEffectiveUser().getEmail();
  const asunto = 'Consulta web' + (d.producto ? ' · ' + d.producto : '') + ' · ' + d.nombre + (d.empresa ? ' (' + d.empresa + ')' : '');
  const filas = [['Nombre', d.nombre], ['E-mail', d.email], ['Empresa', d.empresa || '—'],
                 ['Producto', d.producto || '—'], ['Página', d.pagina || '—']];
  const html =
    '<p style="font:15px Arial,sans-serif">Llegó una consulta desde la web. Para contestar, respondé este mail: le llega directo a la persona.</p>' +
    '<table style="font:14px Arial,sans-serif;border-collapse:collapse">' +
    filas.map(function (f) {
      return '<tr><td style="padding:4px 12px 4px 0;color:#6A6258">' + f[0] + '</td><td style="padding:4px 0"><b>' + esc_(f[1]) + '</b></td></tr>';
    }).join('') + '</table>' +
    '<p style="font:15px Arial,sans-serif;white-space:pre-wrap;border-left:3px solid #F2A12B;padding-left:12px">' + esc_(d.mensaje) + '</p>' +
    '<p style="font:12px Arial,sans-serif;color:#6A6258">Quedó guardada en la planilla, hoja "' + HOJA + '".</p>';
  MailApp.sendEmail({ to: destino, replyTo: d.email, name: 'Web Debra Technology', subject: asunto,
                      htmlBody: html, body: d.mensaje });
}


function hoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HOJA);
  if (!sh) {
    sh = ss.insertSheet(HOJA, 0);
    sh.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold').setBackground('#FDF1DC');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, COLUMNAS.length, 160);
    sh.setColumnWidth(6, 420);
    sh.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
    sh.getRange('F:F').setWrap(true);
    const estados = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Nueva', 'Respondida', 'Cotizada', 'Descartada'], true).build();
    sh.getRange(2, 8, 1000, 1).setDataValidation(estados);
  }
  return sh;
}

// Evita que un texto que empieza con =, +, - o @ se tome como fórmula en la planilla.
function sinFormula_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function esc_(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function respuesta_(ok, error) {
  return ContentService.createTextOutput(JSON.stringify(ok ? { ok: true } : { ok: false, error: error }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ---------- Para ejecutar a mano desde el editor ----------

/** Crea la hoja "Consultas web" y pide los permisos de planilla y mail. */
function instalar() {
  hoja_();
  console.log('Listo. Los avisos van a llegar a: ' + (MAIL_DESTINO || Session.getEffectiveUser().getEmail()));
}

/** Simula una consulta: tiene que aparecer una fila nueva y llegar un mail. */
function probar() {
  const r = doPost({ parameter: { nombre: 'Prueba', email: Session.getEffectiveUser().getEmail(), empresa: 'Debra (prueba)',
                                  producto: 'DL11E', mensaje: 'Mensaje de prueba del formulario de la web.',
                                  pagina: 'prueba desde el editor', t0: String(Date.now() - 60000) } });
  console.log(r.getContent());
}
