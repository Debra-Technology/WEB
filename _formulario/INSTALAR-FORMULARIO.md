# Formulario de la web: cómo conectarlo

**Para qué sirve:** cada consulta que alguien deja en la web llega por mail y queda guardada en una planilla de Google, con una columna de estado (Nueva / Respondida / Cotizada / Descartada). Así no se pierde ninguna consulta y se puede ver cuántas llegan por mes.

**Qué hace falta:** la cuenta de Google de Debra comercial. Se hace una sola vez y lleva unos 10 minutos.

## Paso 1 · Crear la planilla
1. Entrar a la cuenta Debra comercial y abrir sheets.google.com.
2. Crear una planilla en blanco y ponerle de nombre **Consultas web · Debra**.

## Paso 2 · Pegar el script
1. En la planilla: menú **Extensiones > Apps Script**.
2. Borrar todo lo que aparece en el editor y pegar el contenido del archivo `consultas-web.gs` (está en esta misma carpeta).
3. Si ya está definido el mail que tiene que recibir las consultas, escribirlo en la línea `const MAIL_DESTINO = '';`, entre las comillas. Si no está definido, dejarlo vacío: las consultas llegan al mail de la cuenta Debra comercial.
4. Guardar (ícono del disquete).

## Paso 3 · Dar permisos y probar
1. Arriba, en la lista de funciones, elegir **instalar** y tocar **Ejecutar**.
2. Google va a pedir permiso para usar la planilla y mandar mails. Elegir la cuenta Debra comercial y tocar **Permitir**. Si aparece "Google no verificó esta app", tocar **Configuración avanzada** y después **Ir a … (no seguro)**: el script es nuestro y no hay riesgo.
3. Elegir la función **probar** y tocar **Ejecutar**. Tiene que aparecer una fila en la hoja **Consultas web** y llegar un mail de prueba.

## Paso 4 · Publicarlo para la web
1. Arriba a la derecha: **Implementar > Nueva implementación**.
2. En el engranaje, elegir **Aplicación web**.
3. Completar:
   - Descripción: `Formulario web`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**. Es necesario para que la web pueda mandar las consultas; nadie puede ver la planilla por esto.
4. Tocar **Implementar** y copiar la **URL de la aplicación web**, la que termina en `/exec`.
5. **Pasarme esa URL.** La cargo en la web (en las dos versiones) y probamos un envío real.

## Si más adelante hay que cambiar algo
- **Cambiar el mail que recibe:** editar `MAIL_DESTINO`, guardar y después **Implementar > Gestionar implementaciones > editar (lápiz) > Versión: nueva versión > Implementar**. La URL no cambia.
- **Ver las consultas:** abrir la planilla **Consultas web · Debra**.
