/* Página de productos: cabecera, buscador y filtro del catálogo, WhatsApp, ventana de Escribinos y cookies (se copia a assets/js/productos.js) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Cabecera: sólida al bajar ---------- */
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Catálogo: buscador, familias y orden (sin JS se ve todo y las familias llevan a cada sección) ---------- */
  (function () {
    const q = $("#cat-q"); if (!q) return;
    const links = $$(".cat-fams [data-f]"), sel = $("#cat-sel"), orden = $("#cat-orden");
    const fams = $$(".cat-fam"), cards = $$(".cat-fam .dc"), status = $("#cat-status"), empty = $("#cat-empty");
    const total = cards.length;
    cards.forEach((c, i) => { c._i = i; c._t = c.querySelector(".dc-title").textContent.trim(); });
    const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    let fam = "";

    function aplicar() {
      const palabras = norm(q.value).split(/\s+/).filter(Boolean);
      let n = 0;
      fams.forEach((s) => {
        const enFam = !fam || s.dataset.fam === fam;
        let k = 0;
        $$(".dc", s).forEach((c) => {
          const ok = enFam && palabras.every((p) => c.dataset.s.includes(p));
          c.hidden = !ok; if (ok) k++;
        });
        s.hidden = k === 0; n += k;
      });
      links.forEach((l) => l.setAttribute("aria-current", String(l.dataset.f === fam)));
      sel.value = fam;
      status.textContent = `Mostrando ${n} de ${total} productos`;
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

  /* ---------- Escribinos: ventana para escribir sin salir de la página, como un mail a medio escribir en Gmail ----------
     Se abre desde Escribinos, Cotizar y Contacto. Se puede minimizar (queda una barrita abajo) y lo escrito se guarda
     mientras la persona pasa de un producto a otro. En celular se minimiza sola al tocar o deslizar la página. */
  (function () {
    const panel = $("#ct-panel"); if (!panel) return;
    // Se toma de index.html al generar las páginas (build_paginas_productos.py). Vacío = formulario sin conectar.
    const FORM_ENDPOINT = "";
    const FALLBACK = 'Probá de nuevo o escribinos por <a href="https://wa.me/5491176771408" target="_blank" rel="noopener">WhatsApp</a>.';
    const KEY = "debra-borrador-v1";
    const form = $("#ct-form"), msg = $("#ct-msg"), prodBox = $("#ct-prod"), status = $("#ct-status");
    const bar = $(".ct-bar", panel), minBtn = $(".ct-min", panel), sub = $("#ct-sub");
    const SUB = sub.textContent;
    const CAMPOS = ["ct-name", "ct-email", "ct-company", "ct-msg"];
    const tapa = window.matchMedia("(max-width: 900px)");   // en pantallas chicas la ventana tapa la página
    let estado = "cerrado", productos = [], auto = false, opener = null;

    /* Borrador: queda en esta pestaña (sessionStorage) hasta que se envía o se cierra la ventana */
    function guardar() {
      const d = { estado, productos, auto, campos: CAMPOS.map((id) => $("#" + id).value) };
      try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch {}
    }
    function borrar() { try { sessionStorage.removeItem(KEY); } catch {} }
    const hayTexto = () => CAMPOS.some((id) => $("#" + id).value.trim()) || productos.length;

    function pintarProductos() {
      $("#ct-producto").value = productos.join(", ");
      $("ul", prodBox).innerHTML = "";
      productos.forEach((p) => {
        const li = document.createElement("li"); li.textContent = p;
        const x = document.createElement("button"); x.type = "button"; x.setAttribute("aria-label", "Quitar " + p); x.textContent = "×";
        x.addEventListener("click", () => { productos = productos.filter((q) => q !== p); pintarProductos(); autoMensaje(); guardar(); });
        li.appendChild(x); $("ul", prodBox).appendChild(li);
      });
      prodBox.hidden = !productos.length;
    }
    function autoMensaje() {
      // el mensaje se arma solo mientras la persona no lo haya cambiado
      if (!auto && msg.value.trim()) return;
      msg.value = productos.length ? "Hola, quiero cotizar: " + productos.join(", ") + ". " : "";
      auto = !!productos.length;
    }
    function ponerEstado(e) {
      estado = e;
      panel.hidden = e === "cerrado";
      panel.classList.toggle("is-min", e === "min");
      document.body.classList.toggle("ct-open", e === "abierto");
      document.body.classList.toggle("ct-mini", e === "min");
      bar.setAttribute("aria-expanded", String(e === "abierto"));
      minBtn.setAttribute("aria-label", e === "min" ? "Abrir" : "Minimizar");
      const n = productos.length;
      sub.textContent = e === "min"
        ? (hayTexto() ? "Mensaje sin enviar" + (n ? " · " + productos.join(", ") : "") : "Tocá para escribir")
        : SUB;
      guardar();
    }
    function abrir(producto, desde) {
      opener = desde || null;
      if (producto && !productos.includes(producto)) { productos.push(producto); pintarProductos(); autoMensaje(); }
      if (!$("#ct-t0").value) $("#ct-t0").value = Date.now();
      ponerEstado("abierto");
      const vacio = CAMPOS.find((id) => id !== "ct-company" && !$("#" + id).value.trim());
      if (!tapa.matches || !producto) $("#" + (vacio || "ct-msg")).focus({ preventScroll: true });
    }
    function minimizar() { if (estado === "abierto") { ponerEstado("min"); if (document.activeElement && panel.contains(document.activeElement)) bar.focus(); } }
    function cerrar() {
      ponerEstado("cerrado");
      if (opener && document.contains(opener)) opener.focus();
    }

    bar.addEventListener("click", () => estado === "min" ? abrir() : minimizar());
    minBtn.addEventListener("click", () => estado === "min" ? abrir() : minimizar());
    $(".ct-x", panel).addEventListener("click", cerrar);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && estado === "abierto") minimizar(); });
    CAMPOS.forEach((id) => $("#" + id).addEventListener("input", guardar));
    msg.addEventListener("input", () => { auto = false; guardar(); });

    // En pantallas chicas: si con la ventana abierta tocan o deslizan la página, se minimiza para que puedan mirar
    const fuera = (e) => estado === "abierto" && tapa.matches && !panel.contains(e.target);
    document.addEventListener("pointerdown", (e) => { if (fuera(e) && !e.target.closest('a[href*="#contacto"]')) minimizar(); });
    document.addEventListener("touchmove", (e) => { if (fuera(e)) minimizar(); }, { passive: true });

    // Escribinos, Cotizar y Contacto abren la ventana (sin JS llevan al formulario de la portada)
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href*="#contacto"]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      abrir(new URL(a.href, location.href).searchParams.get("cotizar") || "", a);
    });

    // Si venía escribiendo en otra página, el borrador vuelve minimizado
    (function () {
      let d = null; try { d = JSON.parse(sessionStorage.getItem(KEY)); } catch {}
      if (!d || d.estado === "cerrado") return;
      CAMPOS.forEach((id, i) => { $("#" + id).value = (d.campos || [])[i] || ""; });
      productos = Array.isArray(d.productos) ? d.productos : []; auto = !!d.auto;
      pintarProductos(); $("#ct-t0").value = Date.now();
      ponerEstado("min");
    })();

    /* Validación y envío (igual que el formulario de la portada) */
    const rules = {
      "ct-name": (v) => v.trim().length < 2 ? "Escribí tu nombre." : "",
      "ct-email": (v) => !v.trim() ? "Escribí tu e-mail." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "Revisá el e-mail: tiene que ser como nombre@empresa.com." : "",
      "ct-company": () => "",
      "ct-msg": (v) => v.trim().length < 10 ? "Contanos un poco más (mínimo 10 caracteres)." : "",
    };
    function check(id) {
      const el = $("#" + id), err = rules[id](el.value);
      el.setAttribute("aria-invalid", err ? "true" : "false");
      $("#" + el.getAttribute("aria-describedby")).textContent = err;
      return !err;
    }
    Object.keys(rules).forEach((id) => {
      const el = $("#" + id);
      el.addEventListener("blur", () => { if (el.value) check(id); });
      el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") check(id); });
    });
    const say = (text, isError, html) => { status.hidden = false; status[html ? "innerHTML" : "textContent"] = text; status.classList.toggle("error", !!isError); };
    const done = () => {
      form.reset(); $("#ct-t0").value = Date.now(); productos = []; auto = false; pintarProductos(); borrar();
      Object.keys(rules).forEach((id) => $("#" + id).removeAttribute("aria-invalid"));
      say("¡Gracias! Recibimos tu consulta y te vamos a contactar a la brevedad.");
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const bad = Object.keys(rules).filter((id) => !check(id));
      if (bad.length) { $("#" + bad[0]).focus(); say("Revisá los campos marcados.", true); return; }
      // Anti-spam: si el campo trampa tiene contenido o se envió en menos de 3 s, se descarta en silencio
      if ($("#ct-web").value || Date.now() - +$("#ct-t0").value < 3000) { done(); return; }
      if (!FORM_ENDPOINT) { say("El formulario todavía no está conectado. " + FALLBACK, true, true); return; }
      const btn = $(".ct-send", form);
      btn.disabled = true; say("Enviando…");
      try {
        const data = new URLSearchParams(new FormData(form));
        data.set("pagina", location.href.split("#")[0]);
        const r = await fetch(FORM_ENDPOINT, { method: "POST", body: data });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || "error");
        done();
      } catch {
        say("No pudimos enviar el mensaje. " + FALLBACK, true, true);
      } finally { btn.disabled = false; }
    });
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
