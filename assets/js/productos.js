/* Página de productos: cabecera, filtro por familia, WhatsApp y cookies (se copia a assets/js/productos.js) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Cabecera: sólida al bajar ---------- */
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Catálogo: filtro por familia (sin JS, los botones llevan a cada sección) ---------- */
  (function () {
    const chips = $$(".cat-filter [data-f]"); if (!chips.length) return;
    const fams = $$(".cat-fam"), status = $("#cat-status");
    function filtrar(f, scroll) {
      if (f && !fams.some((s) => s.dataset.fam === f)) f = "";
      fams.forEach((s) => { s.hidden = !!f && s.dataset.fam !== f; });
      chips.forEach((c) => c.setAttribute("aria-current", String(c.dataset.f === f)));
      const n = $$(".cat-fam:not([hidden]) .pc").length;
      status.textContent = n + (n === 1 ? " producto" : " productos");
      const activo = chips.find((c) => c.dataset.f === f);
      if (activo) activo.scrollIntoView({ block: "nearest", inline: "nearest" });
      // si ya se había bajado, vuelve al principio de la lista (debajo de la barra de familias)
      if (scroll) window.scrollTo(0, $(".cat-head").getBoundingClientRect().bottom + window.scrollY - header.offsetHeight);
    }
    chips.forEach((c) => c.addEventListener("click", (e) => {
      e.preventDefault();
      const f = c.dataset.f;
      history.replaceState(null, "", f ? "#" + f : location.pathname + location.search);
      filtrar(f, $(".cat-head").getBoundingClientRect().bottom < header.offsetHeight);
    }));
    filtrar(location.hash.slice(1), false);
    window.addEventListener("hashchange", () => filtrar(location.hash.slice(1), false));
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
  function openConfig() { banner.hidden = false; options.hidden = false; cfgBtn.textContent = "Guardar selección"; cfgBtn.setAttribute("aria-expanded", "true"); box.checked = !!(read() || {}).analytics; box.focus(); }
  banner.addEventListener("click", (e) => {
    const b = e.target.closest("[data-consent]"); if (!b) return;
    if (b.dataset.consent === "all") decide(true);
    else if (b.dataset.consent === "none") decide(false);
    else if (options.hidden) openConfig(); else decide(box.checked);
  });
  $("#open-cookies").addEventListener("click", openConfig);
  const stored = read(); if (stored) applyConsent(stored); else banner.hidden = false;
})();
