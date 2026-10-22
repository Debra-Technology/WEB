/* Ventana «Escribinos»: va en todas las páginas, también en la portada, para que el mensaje a medio escribir
   acompañe a la persona mientras recorre la web o cambia de idioma (se copia a assets/js/escribinos.js) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- Escribinos: ventana para escribir sin salir de la página, como un mail a medio escribir en Gmail ----------
     Se abre desde Escribinos, Cotizar y Contacto. Se puede minimizar (queda una barrita abajo) y lo escrito se guarda
     mientras la persona pasa de un producto a otro. En celular se minimiza sola al tocar o deslizar la página. */
  (function () {
    const panel = $("#ct-panel"); if (!panel) return;
    // Se toma de index.html al generar las páginas (build_paginas_productos.py). Vacío = formulario sin conectar.
    const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbyH_Ds6_7WyeImyydY69AL7UI3udwwtfwVX97PmX-ryd_ZWw5pGJMipYSEUYUAZzMn-ug/exec";
    const FALLBACK = 'Please try again or contact us on <a href="https://wa.me/5491176771408" target="_blank" rel="noopener">WhatsApp</a>.';
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
        const x = document.createElement("button"); x.type = "button"; x.setAttribute("aria-label", "Remove " + p); x.textContent = "×";
        x.addEventListener("click", () => { productos = productos.filter((q) => q !== p); pintarProductos(); autoMensaje(); guardar(); });
        li.appendChild(x); $("ul", prodBox).appendChild(li);
      });
      prodBox.hidden = !productos.length;
    }
    function autoMensaje() {
      // el mensaje se arma solo mientras la persona no lo haya cambiado
      if (!auto && msg.value.trim()) return;
      msg.value = productos.length ? "Hello, I would like a quote for: " + productos.join(", ") + ". " : "";
      auto = !!productos.length;
    }
    function ponerEstado(e) {
      estado = e;
      panel.hidden = e === "cerrado";
      panel.classList.toggle("is-min", e === "min");
      document.body.classList.toggle("ct-open", e === "abierto");
      document.body.classList.toggle("ct-mini", e === "min");
      bar.setAttribute("aria-expanded", String(e === "abierto"));
      minBtn.setAttribute("aria-label", e === "min" ? "Open" : "Minimize");
      const n = productos.length;
      sub.textContent = e === "min"
        ? (hayTexto() ? "Unsent message" + (n ? " · " + productos.join(", ") : "") : "Tap to write")
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

    // Escribinos, Cotizar y Contacto abren la ventana (sin JS llevan al formulario de la portada).
    // En la portada, si no hay un mensaje empezado, siguen bajando al formulario grande de la página.
    const portada = !!$("#contact-form");
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href*="#contacto"]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (portada && estado === "cerrado") return;
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

    // Para la portada: sus botones «Cotizar» suman el producto a la ventana si ya hay un mensaje empezado
    window.debraEscribinos = { activo: () => estado !== "cerrado", abrir };

    /* Validación y envío (igual que el formulario de la portada) */
    const rules = {
      "ct-name": (v) => v.trim().length < 2 ? "Enter your name." : "",
      "ct-email": (v) => !v.trim() ? "Enter your email." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "Check your email: it should look like name@company.com." : "",
      "ct-company": () => "",
      "ct-msg": (v) => v.trim().length < 10 ? "Tell us a bit more (at least 10 characters)." : "",
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
      say("Thank you! We received your inquiry and will contact you shortly.");
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const bad = Object.keys(rules).filter((id) => !check(id));
      if (bad.length) { $("#" + bad[0]).focus(); say("Please check the highlighted fields.", true); return; }
      // Anti-spam: si el campo trampa tiene contenido o se envió en menos de 3 s, se descarta en silencio
      if ($("#ct-web").value || Date.now() - +$("#ct-t0").value < 3000) { done(); return; }
      if (!FORM_ENDPOINT) { say("The form is not connected yet. " + FALLBACK, true, true); return; }
      const btn = $(".ct-send", form);
      btn.disabled = true; say("Sending…");
      try {
        const data = new URLSearchParams(new FormData(form));
        data.set("pagina", location.href.split("#")[0]);
        const r = await fetch(FORM_ENDPOINT, { method: "POST", body: data });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || "error");
        done();
      } catch {
        say("We couldn't send your message. " + FALLBACK, true, true);
      } finally { btn.disabled = false; }
    });
  })();
})();
