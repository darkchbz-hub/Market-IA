HTML UPLOAD

Esta carpeta esta pensada para subirla directo a un hosting simple.

Archivos principales:
- index.html
- catalogo.html
- carrito.html
- cuenta.html
- contacto.html
- styles.css
- script.js

Como usarla:
1. Sube todo el contenido de esta carpeta a tu hosting.
2. Para pruebas locales abre la version servida por backend: http://localhost:4000/
3. Si la subes a otro dominio, cambia la URL de tu backend en config.js si no compartira el mismo dominio.
4. Agrega el dominio de tu web en CLIENT_URLS del backend para permitir CORS cuando uses dominios distintos.
5. Cambia textos, correos, WhatsApp e imagenes en los HTML si lo necesitas.

Importante:
- Esta version HTML ya usa la API real para registro, login, perfil, carrito, checkout y validacion de pago.
- El sistema real con usuarios, backend, PostgreSQL, pagos y panel admin vive en las carpetas backend y frontend.
