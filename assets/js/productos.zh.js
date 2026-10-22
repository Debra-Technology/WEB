/* Página de productos: cabecera, buscador y filtro del catálogo, WhatsApp y cookies (se copia a assets/js/productos.js; la ventana Escribinos está en escribinos.js) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Cabecera: sólida al bajar ---------- */
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Selector de idioma: se cierra al tocar afuera o con Esc ---------- */
  $$("details.lang").forEach((d) => {
    document.addEventListener("click", (e) => { if (d.open && !d.contains(e.target)) d.open = false; });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && d.open) { d.open = false; d.querySelector("summary").focus(); } });
  });

  /* ---------- Catálogo: buscador, material, familias y orden (sin JS se ve todo y las familias llevan a cada sección) ---------- */
  (function () {
    const q = $("#cat-q"); if (!q) return;
    const links = $$(".cat-fams [data-f]"), mats = $$(".cat-mats [data-m]"), sel = $("#cat-sel"), orden = $("#cat-orden");
    const fams = $$(".cat-fam"), cards = $$(".cat-fam .dc"), status = $("#cat-status"), empty = $("#cat-empty");
    const total = cards.length;
    const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    // «duchass», «duchas» y «ducha» son lo mismo: se sacan las s del final
    const raiz = (p) => p.length > 3 ? p.replace(/(es|s)+$/, (m, x, i) => i >= 3 ? "" : m) : p;

    // Palabras que la gente usa y no figuran tal cual en los productos
    const SINONIMOS = {
      inox: ["inoxidable"], acero: ["acero"], aisi: ["inoxidable"], "304": ["inoxidable"],
      pintad: ["epoxi"], pintura: ["epoxi"], amarill: ["epoxi"], galvanizad: ["epoxi"], epoxy: ["epoxi"],
      calefaccion: ["calefaccionada"], calefaccionad: ["calefaccionada"], calefactor: ["calefaccionada"], calentador: ["calefaccionada"],
      calefact: ["calefaccionada"], heat: ["calefaccionada"], frio: ["calefaccionada", "frio"], nieve: ["calefaccionada"],
      congela: ["anticongelante"], helad: ["anticongelante"], termic: ["calefaccionada", "termica"], montana: ["calefaccionada"],
      tanke: ["tanque"], tank: ["tanque"], autonom: ["tanque"], portatil: ["tanque", "ruedas"], movil: ["ruedas"], rueda: ["ruedas"],
      ojo: ["lavaojos"], lavaojo: ["lavaojos"], lavaoj: ["lavaojos"], ocular: ["lavaojos"], eyewash: ["lavaojos"],
      regadera: ["ducha"], shower: ["ducha"], emergencia: ["ducha", "lavaojos"],
      extintor: ["extintor"], matafuego: ["extintor"], extinguidor: ["extintor"], incendi: ["incendio", "antiincendio", "fuego"],
      fuego: ["fuego", "incendio"], bombero: ["bomberos", "incendio"], humo: ["humo"], capucha: ["mascara"], mascarilla: ["mascara"],
      frazada: ["manta"], hidrante: ["manguera"],
      tacho: ["contenedor", "papelero"], basura: ["residuos", "papelero"], residuo: ["residuos"], cesto: ["papelero"],
      papelera: ["papelero"], reciclaj: ["reciclado"], recicla: ["reciclado"],
      derrame: ["derrame"], antiderrame: ["antiderrame"], aceite: ["aceites"], quimic: ["quimicos"], absorbente: ["absorbente"],
      alarma: ["sirena", "baliza", "alarma"], luz: ["baliza"], sonora: ["sirena"],
      repuesto: ["repuestos"], aspersor: ["aspersores"], valvula: ["valvula"], grifo: ["canilla"], pileta: ["canilla"],
      pared: ["pared"], amurad: ["pared"], amurar: ["pared"], tapa: ["tapa"],
    };
    function opciones(p) {
      const r = raiz(p), o = new Set([p, r]);
      Object.keys(SINONIMOS).forEach((k) => { if (r.startsWith(k) && r.length - k.length <= 2 || k.startsWith(r) && r.length >= 5 && k.length - r.length <= 3) SINONIMOS[k].forEach((s) => o.add(s)); });
      return [...o];
    }
    // Errores de tipeo: «dicha», «lavajos», «calefacionada»
    function cerca(a, b, max) {
      if (Math.abs(a.length - b.length) > max) return false;
      let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
      for (let i = 1; i <= a.length; i++) {
        const cur = [i]; let min = i;
        for (let j = 1; j <= b.length; j++) {
          cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
          min = Math.min(min, cur[j]);
        }
        if (min > max) return false; prev = cur;
      }
      return prev[b.length] <= max;
    }

    cards.forEach((c, i) => { c._i = i; c._t = c.querySelector(".dc-title").textContent.trim(); c._m = (c.dataset.m || "").split(" "); });
    // se busca en el texto en español (data-s) y en lo que se ve en la tarjeta (sirve para las páginas traducidas)
    cards.forEach((c) => {
      c._s = norm(c.dataset.s + " " + c.querySelector(".dc-info").textContent);
      c._p = [...new Set(c._s.split(/[^a-z0-9]+/).filter(Boolean))];
      c._w = [...new Set(c._p.filter((w) => w.length >= 4).map(raiz))];
    });
    // Una palabra coincide si es una palabra de la tarjeta o su comienzo (cortito solo si le faltan pocas letras),
    // un sinónimo, o la misma palabra con un error de tipeo. Así «perro» o «auto» no traen productos que no tienen nada que ver.
    function coincide(c, p) {
      if (/\d/.test(p)) return c._s.includes(p);          // códigos y medidas: tal cual
      const empieza = (x) => c._p.some((w) => w.startsWith(x) && (x.length >= 5 || w.length - x.length <= 2));
      if (opciones(p).some(empieza)) return true;
      const r = raiz(p); if (r.length < 5) return false;
      const max = r.length <= 7 ? 1 : 2;
      return c._w.some((w) => w[0] === r[0] && cerca(r, w, max));
    }

    let fam = "", mat = "";
    function aplicar() {
      // palabras sueltas como «de», «para» o «con» no filtran
      const palabras = norm(q.value).split(/\s+/).filter((p) => p && !["de", "del", "la", "el", "los", "las", "para", "con", "y", "a", "un", "una", "en", "alta"].includes(p));
      let n = 0;
      fams.forEach((s) => {
        const enFam = !fam || s.dataset.fam === fam;
        let k = 0;
        $$(".dc", s).forEach((c) => {
          const ok = enFam && (!mat || c._m.includes(mat)) && palabras.every((p) => coincide(c, p));
          c.hidden = !ok; if (ok) k++;
        });
        s.hidden = k === 0; n += k;
      });
      links.forEach((l) => l.setAttribute("aria-current", String(l.dataset.f === fam)));
      mats.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === mat)));
      sel.value = fam;
      status.textContent = `显示 ${n} / ${total} 件产品`;
      empty.hidden = n > 0;
      $(".cat-main").classList.toggle("sin-resultados", !n);   // con el cartel no hace falta «¿No encontrás lo que buscás?»
      if (!n) {
        const txt = q.value.trim();
        $("#ce-q").textContent = txt ? "«" + txt + "»" : "该产品";
      }
    }
    function irArriba() {
      // si ya se había bajado, vuelve al principio del listado
      const top = $(".cat-wrap").getBoundingClientRect().top;
      if (top < 0) window.scrollTo(0, top + window.scrollY - (window.innerWidth > 900 ? header.offsetHeight : 0));
    }
    function elegir(f, scroll) {
      fam = fams.some((s) => s.dataset.fam === f) ? f : "";
      history.replaceState(null, "", fam ? "#" + fam : location.pathname + location.search);
      aplicar(); if (scroll) irArriba();
    }
    links.forEach((l) => l.addEventListener("click", (e) => { e.preventDefault(); elegir(l.dataset.f, true); }));
    mats.forEach((b) => b.addEventListener("click", () => { mat = b.dataset.m; aplicar(); irArriba(); }));
    sel.addEventListener("change", () => elegir(sel.value, true));
    // al buscar se busca en todas las familias
    q.addEventListener("input", () => { if (fam && q.value) { fam = ""; history.replaceState(null, "", location.pathname + location.search); } aplicar(); });
    q.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); q.blur(); irArriba(); } });
    orden.addEventListener("change", () => {
      const az = orden.value === "az";
      $$(".dc-grid", $(".cat-main")).forEach((g) => {
        [...g.children].sort((a, b) => az ? a._t.localeCompare(b._t, "es") : a._i - b._i).forEach((c) => g.appendChild(c));
      });
    });
    elegir(location.hash.slice(1), false);
    window.addEventListener("hashchange", () => elegir(location.hash.slice(1), false));

    /* «Contactanos» abre la ventana Escribinos con lo que buscaba (si no está, va al formulario de la portada) */
    $("#ce-contacto").addEventListener("click", (e) => {
      const esc = window.debraEscribinos, msg = $("#ct-msg"); if (!esc || !msg) return;
      e.preventDefault();
      const txt = q.value.trim();
      if (txt && !msg.value.trim()) { msg.value = "您好，我在寻找：" + txt + ". "; msg.dispatchEvent(new Event("input", { bubbles: true })); }
      esc.abrir("", e.currentTarget);
    });
  })();

  /* ---------- Botón de WhatsApp: se corre hacia arriba mientras se ve el aviso de cookies ---------- */
  (function () {
    const wa = $(".wa-float"), banner = $("#cookie-banner"); if (!wa || !banner) return;
    const place = () => { wa.style.bottom = banner.hidden ? "" : (banner.getBoundingClientRect().height + 36) + "px"; };
    new MutationObserver(place).observe(banner, { attributes: true, attributeFilter: ["hidden"] });
    new ResizeObserver(place).observe(banner);
    window.addEventListener("resize", place); place();
  })();

  /* ---------- Cookies (misma clave que la portada: se acepta una sola vez) ---------- */
  const KEY = "debra-consent-v1";
  const banner = $("#cookie-banner"), options = $("#cookie-options"), box = $("#consent-analytics"), cfgBtn = $('[data-consent="config"]', banner);
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
  function applyConsent(c) {
    if (!c || !c.analytics) return;
    gtag("consent", "update", { analytics_storage: "granted" });
    if (location.hostname.endsWith("debratechnology.com") && !window.__gtmLoaded) {
      window.__gtmLoaded = true;
      dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      const s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtm.js?id=GTM-5M27W7D6"; document.head.appendChild(s);
    }
  }
  function decide(analytics) { const c = { analytics, date: new Date().toISOString() }; save(c); applyConsent(c); banner.hidden = true; }
  function openConfig() { banner.hidden = false; options.hidden = false; cfgBtn.textContent = "保存选择"; cfgBtn.setAttribute("aria-expanded", "true"); box.checked = !!(read() || {}).analytics; box.focus(); }
  banner.addEventListener("click", (e) => {
    const b = e.target.closest("[data-consent]"); if (!b) return;
    if (b.dataset.consent === "all") decide(true);
    else if (b.dataset.consent === "none") decide(false);
    else if (options.hidden) openConfig(); else decide(box.checked);
  });
  $("#open-cookies").addEventListener("click", openConfig);
  $$("[data-cookies]").forEach((b) => b.addEventListener("click", openConfig));
  const stored = read(); if (stored) applyConsent(stored); else banner.hidden = false;
})();
