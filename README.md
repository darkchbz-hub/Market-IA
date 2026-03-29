# MarketZone

Proyecto rehecho desde cero como marketplace web estilo tienda grande, inspirado en patrones de Amazon y Mercado Libre, pero enfocado en vender suscripciones IA, apps, servicios web y paquetes digitales.

## Stack

- Backend: Node.js + Express + PostgreSQL + Socket.io
- Frontend: React + Vite + React Router
- Seguridad: bcrypt + JWT
- Pagos: Stripe + PayPal Orders API + Mercado Pago Preferences API

## Estructura

- `backend/`: API, autenticacion, carrito, checkout, pagos, admin, chat y tracking
- `frontend/`: interfaz del marketplace, login, perfil, carrito, checkout, admin y chat
- `html-upload/`: version estatica en HTML/CSS/JS lista para subir a hosting simple
- `render.yaml`: despliegue recomendado en Render con web service + Postgres

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

- Node.js 20+
- PostgreSQL 15+

## Instalacion

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
- Stripe queda pensado para Payment Intents.
- PayPal queda pensado para Orders v2 con captura.
- Mercado Pago queda pensado para Checkout Pro via preferencias.
- La carpeta `html-upload/` sirve como version HTML conectable al backend real mediante `config.js`.

## Despliegue recomendado

1. Sube este proyecto a GitHub.
2. En Render crea el servicio desde `render.yaml`.
3. Agrega tus credenciales reales de Stripe, PayPal y Mercado Pago en Render.
4. Abre la URL publica del servicio y la web HTML quedara servida desde la raiz.

## Referencias oficiales consultadas

- Stripe PaymentIntents API: [docs.stripe.com/api/payment_intents/create?lang=node](https://docs.stripe.com/api/payment_intents/create?lang=node)
- Stripe Payment Intents guide: [docs.stripe.com/payments/payment-intents](https://docs.stripe.com/payments/payment-intents)
- PayPal Orders v2: [developer.paypal.com/docs/api/orders/v2/](https://developer.paypal.com/docs/api/orders/v2/)
- PayPal Orders integration guide: [developer.paypal.com/api/rest/integration/orders-api/](https://developer.paypal.com/api/rest/integration/orders-api/)
- Mercado Pago crear preferencia: [mercadopago.com.mx/developers/es/reference/preferences/_checkout_preferences/post](https://www.mercadopago.com.mx/developers/es/reference/preferences/_checkout_preferences/post)
- Mercado Pago Checkout Pro: [mercadopago.com.mx/developers/en/docs/checkout-pro/create-payment-preference](https://www.mercadopago.com.mx/developers/en/docs/checkout-pro/create-payment-preference)
