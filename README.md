# MarketZone

Proyecto rehecho desde cero como marketplace web estilo tienda grande, inspirado en patrones de Amazon y Mercado Libre, pero enfocado en vender suscripciones IA, apps, servicios web y paquetes digitales.

## Stack

- Web publica: HTML, CSS y JavaScript en `html-upload/`
- Backend cloud: Cloudflare Pages Functions en `functions/`
- Base de datos cloud: Cloudflare D1
- Backend legado/local: Node.js + Express + PostgreSQL en `backend/`
- Frontend legado/local: React + Vite en `frontend/`
- Seguridad cloud: token firmado + hash PBKDF2
- Pagos cloud: PayPal Orders API + Mercado Pago Checkout Preferences

## Estructura

- `html-upload/`: sitio estatico que ya publicaste en Cloudflare Pages
- `functions/`: backend nativo para Cloudflare Pages Functions
- `backend/`: API anterior en Node/Express para entorno local o migraciones
- `frontend/`: app React anterior
- `render.yaml`: opcion previa para Render si alguna vez quieres volver a Node + Postgres

## Fases cubiertas

1. Base de datos
2. Backend API
3. Usuarios
4. Productos
5. Carrito
6. Checkout
7. Pagos
8. Panel admin
9. Chat
10. Tracking

## Requisitos locales

- Ninguno para la version Cloudflare ya publicada
- Node.js 20+ y PostgreSQL 15+ solo si quieres seguir usando la version local

## Despliegue en Cloudflare

Tu sitio publico actual es:

- [https://market-ia-8wq.pages.dev](https://market-ia-8wq.pages.dev)

Para que el backend nuevo funcione en ese mismo proyecto:

1. En Cloudflare Pages deja:
   - `Framework preset`: `None`
   - `Build command`: `exit 0`
   - `Build output directory`: `html-upload`
2. En tu proyecto de Pages agrega una base D1.
3. En `Settings > Functions > D1 bindings` crea el binding:
   - `Variable name`: `DB`
4. En `Settings > Environment variables` agrega:
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `PAYPAL_ENV` = `sandbox` o `live`
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `MERCADOPAGO_ACCESS_TOKEN`
5. Vuelve a desplegar desde GitHub.

Con eso:

- `/api/*` saldra desde `functions/api/[[path]].js`
- la web publica seguira saliendo desde `html-upload/`
- el catalogo, login, carrito, perfil y checkout usaran Cloudflare, no localhost

## Instalacion local legacy

### 1. Base de datos

1. Crea una base llamada `marketzone`
2. Ejecuta:
   - `backend/src/db/schema.sql`
   - `backend/src/db/seed.sql`

### 2. Variables de entorno

1. Ya se dejaron `backend/.env` y `frontend/.env` listos para entorno local
2. Si cambias puertos, dominio o credenciales, actualizalos segun tu entorno
3. Completa credenciales de Stripe, PayPal y Mercado Pago

### 3. Dependencias

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 4. Ejecutar

```bash
cd backend
npm run dev

abre http://localhost:4000/
```

## Credenciales seed

- Admin:
  - email: `admin@marketzone.mx`
  - contrasena: `Admin123!`

## Notas

- En esta maquina ya se instalaron Node.js y PostgreSQL 16 para levantar el proyecto localmente.
- El backend responde en `http://localhost:4000/api/health`.
- La version HTML completa se sirve desde `http://localhost:4000/`.
- La salida compilada del frontend React sigue estando en `frontend/dist/`, pero ya no es necesaria para la version HTML desplegable.
- La API crea primero la orden local y luego inicia el flujo del proveedor de pago.
- La version Cloudflare vive en `functions/` y usa D1 en lugar de PostgreSQL.
- Stripe queda pendiente en la version Cloudflare; por ahora el checkout HTML usa PayPal y Mercado Pago.
- PayPal queda pensado para Orders v2 con captura.
- Mercado Pago queda pensado para Checkout Pro via preferencias.
- La carpeta `html-upload/` ya puede apuntar a la API del mismo dominio en Cloudflare Pages.

## Despliegue alterno en Render

1. Sube este proyecto a GitHub.
2. En Render crea el servicio desde `render.yaml`.
3. Agrega tus credenciales reales de Stripe, PayPal y Mercado Pago en Render.
4. Abre la URL publica del servicio y la web HTML quedara servida desde la raiz.

## Referencias oficiales consultadas

- Cloudflare Pages deploy anything: [developers.cloudflare.com/pages/framework-guides/deploy-anything/](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)
- Cloudflare Pages Functions get started: [developers.cloudflare.com/pages/functions/get-started/](https://developers.cloudflare.com/pages/functions/get-started/)
- Cloudflare Pages bindings: [developers.cloudflare.com/pages/functions/bindings/](https://developers.cloudflare.com/pages/functions/bindings/)
- Cloudflare D1: [developers.cloudflare.com/d1/](https://developers.cloudflare.com/d1/)
- Stripe PaymentIntents API: [docs.stripe.com/api/payment_intents/create?lang=node](https://docs.stripe.com/api/payment_intents/create?lang=node)
- Stripe Payment Intents guide: [docs.stripe.com/payments/payment-intents](https://docs.stripe.com/payments/payment-intents)
- PayPal Orders v2: [developer.paypal.com/docs/api/orders/v2/](https://developer.paypal.com/docs/api/orders/v2/)
- PayPal Orders integration guide: [developer.paypal.com/api/rest/integration/orders-api/](https://developer.paypal.com/api/rest/integration/orders-api/)
- Mercado Pago crear preferencia: [mercadopago.com.mx/developers/es/reference/preferences/_checkout_preferences/post](https://www.mercadopago.com.mx/developers/es/reference/preferences/_checkout_preferences/post)
- Mercado Pago Checkout Pro: [mercadopago.com.mx/developers/en/docs/checkout-pro/create-payment-preference](https://www.mercadopago.com.mx/developers/en/docs/checkout-pro/create-payment-preference)
