# Debra Technology · Sitio web

Landing page de **Debra Technology**: duchas y lavaojos de emergencia (norma ANSI Z358.1).

## Versiones

| Archivo | Versión | Estado |
|---|---|---|
| `index.html` | Fondo blanco | Versión principal (se indexa en Google) |
| `index-oscuro.html` | Fondo gris oscuro | Alternativa para elegir (`noindex`, bloqueada en `robots.txt`) |

Cuando se elija una, la elegida debe quedar como `index.html`. Si se elige la oscura, reemplazar
`index.html` por su contenido y cambiar su meta `robots` a `index, follow, max-image-preview:large`.

## Estructura

```
index.html            Versión blanca (HTML + CSS + JS en un solo archivo)
index-oscuro.html     Versión gris oscuro
assets/img/           Fotos de portada, productos, franja de datos y logos (WebP / PNG)
robots.txt            Reglas para buscadores
sitemap.xml           Mapa del sitio
```

No requiere compilación ni dependencias: son archivos estáticos. Para verlos en local alcanza con abrir
`index.html` en el navegador, o servir la carpeta (por ejemplo `npx serve .`).

Fuentes: Barlow y Barlow Condensed desde Google Fonts.

## Qué incluye

- Portada con 5 sectores (pase automático, flechas, fichas por equipo), franja de datos, servicios,
  best-sellers con ficha técnica y "Cotizar", línea del tiempo animada, contacto y pie.
- Botón flotante de WhatsApp: +54 9 11 7677-1408 con el mensaje "¡Hola! Me comunico desde la web...".
- Accesibilidad (WCAG): textos alternativos, contraste AA, navegación con teclado, respeta
  "reducir movimiento", enlace para saltar al contenido.
- SEO: meta descripción, Open Graph / Twitter, datos estructurados (Organization), `canonical`,
  `robots.txt` y `sitemap.xml`.
- Aviso de cookies con consentimiento (Consent Mode v2). Google Tag Manager (`GTM-5M27W7D6`)
  solo se carga si se aceptan las cookies de analítica y en el dominio `debratechnology.com`.
- Formulario con validación, contador de 5.000 caracteres y anti-spam (campo trampa + tiempo mínimo).

## Pendientes

- [ ] **Envío del formulario**: conectar `action="/api/contacto"` a un endpoint real (servidor propio,
      Formspree, Resend, etc.). Validar también del lado del servidor y sumar Turnstile o reCAPTCHA.
- [ ] **Texto de ejemplo del mensaje**: reemplazar `Por ejemplo: [ ], [ ], [ ].` en el `placeholder` de `#f-msg`.
- [ ] **Imagen para compartir** (vista previa de links): subir `assets/og-debra-1200x630.jpg` (1200 × 630 px)
      y actualizar la ruta de `og:image`.
- [ ] **Logo en SVG** o PNG de alta resolución (el actual es de 218 × 104 px).
- [ ] **Páginas legales**: `/politica-de-privacidad/` y `/terminos-y-condiciones/`.
- [ ] **Página 404** personalizada.
- [ ] **Servidor**: forzar HTTPS (redirección 301 de http a https) y cabeceras de seguridad.
- [ ] **Links de productos**: hoy apuntan al catálogo actual (`/productos/`); actualizar cuando existan
      las páginas de cada modelo.
