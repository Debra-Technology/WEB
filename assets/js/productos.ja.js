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

  /* ---------- Catálogo: buscador, familias y orden (sin JS se ve todo y las familias llevan a cada sección) ---------- */
  (function () {
    const q = $("#cat-q"); if (!q) return;
    const links = $$(".cat-fams [data-f]"), sel = $("#cat-sel"), orden = $("#cat-orden");
    const fams = $$(".cat-fam"), cards = $$(".cat-fam .dc"), status = $("#cat-status"), empty = $("#cat-empty");
    const total = cards.length;
    const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    cards.forEach((c, i) => { c._i = i; c._t = c.querySelector(".dc-title").textContent.trim(); });
    // se busca en el texto en español (data-s) y en lo que se ve en la tarjeta (sirve para las páginas traducidas)
    cards.forEach((c) => { c._s = c.dataset.s + " " + norm(c.querySelector(".dc-info").textContent); });
    let fam = "";

    function aplicar() {
      const palabras = norm(q.value).split(/\s+/).filter(Boolean);
      let n = 0;
      fams.forEach((s) => {
        const enFam = !fam || s.dataset.fam === fam;
        let k = 0;
        $$(".dc", s).forEach((c) => {
          const ok = enFam && palabras.every((p) => c._s.includes(p));
          c.hidden = !ok; if (ok) k++;
        });
        s.hidden = k === 0; n += k;
      });
      links.forEach((l) => l.setAttribute("aria-current", String(l.dataset.f === fam)));
      sel.value = fam;
      status.textContent = `${total}件中${n}件の製品を表示`;
      empty.hidden = n > 0;
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
    sel.addEventListener("change", () => elegir(sel.value, true));
    // al buscar se busca en todas las familias
    q.addEventListener("input", () => { if (fam && q.value) { fam = ""; history.replaceState(null, "", location.pathname + location.search); } aplicar(); });
    q.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); q.blur(); irArriba(); } });
    $("#cat-clear").addEventListener("click", () => { q.value = ""; elegir("", true); q.focus(); });
    orden.addEventListener("change", () => {
      const az = orden.value === "az";
      $$(".dc-grid", $(".cat-main")).forEach((g) => {
        [...g.children].sort((a, b) => az ? a._t.localeCompare(b._t, "es") : a._i - b._i).forEach((c) => g.appendChild(c));
      });
    });
    elegir(location.hash.slice(1), false);
    window.addEventListener("hashchange", () => elegir(location.hash.slice(1), false));
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
  function openConfig() { banner.hidden = false; options.hidden = false; cfgBtn.textContent = "選択内容を保存"; cfgBtn.setAttribute("aria-expanded", "true"); box.checked = !!(read() || {}).analytics; box.focus(); }
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
