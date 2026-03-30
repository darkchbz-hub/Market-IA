HTML UPLOAD

Esta carpeta es la salida estatica para Cloudflare Pages.

Archivos principales:
- index.html
- catalogo.html
- carrito.html
- cuenta.html
- contacto.html
- styles.css
- script.js

Como usarla:
1. En Cloudflare Pages usa:
   - Framework preset: None
   - Build command: exit 0
   - Build output directory: html-upload
2. La carpeta functions/ debe permanecer en la raiz del repo para que Cloudflare publique la API.
3. Agrega una base D1 al proyecto de Pages con el binding DB.
4. Agrega variables JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV y MERCADOPAGO_ACCESS_TOKEN.
5. Cambia textos, correos, WhatsApp e imagenes en los HTML si lo necesitas.

Importante:
- Esta version HTML ya usa la API real para registro, login, perfil, carrito, checkout y validacion de pago.
- Cuando se publica en Cloudflare, la API sale del mismo dominio por /api.
- El archivo _routes.json hace que solo /api/* pase por Functions y el resto quede estatico.
- Las carpetas backend/ y frontend/ quedan como referencia legacy/local.
