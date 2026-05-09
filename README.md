# Gray C Shop Marketplace

Marketplace profesional, formal y moderno para vender productos de muchas categorias con:

- frontend React + Vite
- backend Node.js + Express
- PostgreSQL
- usuarios y administrador
- catalogo, producto individual, carrito y checkout
- reseñas verificadas
- panel administrador
- banners, videos y musica administrables

## Arquitectura

### Frontend

- `frontend/src/components`: shell principal, tarjetas y componentes reutilizables
- `frontend/src/pages`: home, catalogo, producto, carrito, checkout, perfil, login, registro, admin y soporte
- `frontend/src/context`: autenticacion y carrito
- `frontend/src/lib`: cliente API y utilidades

### Backend

- `backend/src/modules/auth`: registro, login y recuperacion
- `backend/src/modules/users`: perfil, favoritos y cancelacion de pedidos
- `backend/src/modules/products`: home publica, catalogo, producto, categorias, reseñas y preguntas
- `backend/src/modules/cart`: carrito persistente
- `backend/src/modules/checkout`: pedidos y resumen
- `backend/src/modules/payments`: Stripe, PayPal y Mercado Pago listos para integrar
- `backend/src/modules/admin`: dashboard, usuarios, pedidos, reseñas, categorias y contenido del sitio

### Base de datos

La base ya queda preparada con tablas para:

- `users`
- `categories`
- `products`
- `cart_items`
- `coupons`
- `orders`
- `order_items`
- `payments`
- `messages`
- `search_history`
- `product_views`
- `wishlist_items`
- `product_reviews`
- `product_questions`
- `site_banners`
- `promo_videos`
- `music_tracks`
- `site_settings`
- `admin_activity_logs`
- `password_resets`

## Funcionalidad implementada

### Publico

- portada premium con hero
- banners y videos
- musica ambiental manual
- categorias destacadas
- recomendados, ofertas y mas vendidos
- catalogo con filtros por categoria, marca, precio, rating y disponibilidad
- producto individual con galeria, reseñas, preguntas y relacionados

### Usuario

- crear cuenta
- iniciar sesion
- recuperar contraseña por token
- editar perfil
- guardar direccion, telefono, nickname y avatar
- favoritos
- carrito persistente
- historial de pedidos
- cancelacion si el estado lo permite

### Administrador

- dashboard con metricas
- crear productos
- activar o desactivar productos
- ver usuarios
- abrir detalle de usuario
- ver carrito y pedidos del usuario
- cambiar estados de pedido
- moderar reseñas
- ver categorias
- editar textos principales
- administrar banners, videos y musica

## Instalacion

### 1. Requisitos

- Node.js 20+
- PostgreSQL 15+

### 2. Variables de entorno backend

Crea `backend/.env` con algo similar:

```env
PORT=4000
DATABASE_URL=postgres://usuario:password@localhost:5432/gray_c_shop
JWT_SECRET=tu_clave_segura
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:4000
ADMIN_EMAIL=admin@marketzone.mx
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=sandbox
MERCADOPAGO_ACCESS_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### 3. Variables de entorno frontend

Crea `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_STRIPE_PUBLISHABLE_KEY=
```

### 4. Instalar dependencias

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 5. Crear estructura inicial de base de datos

```bash
cd backend
npm run db:setup
```

Ese comando ejecuta:

- `backend/src/db/schema.sql`
- `backend/src/db/seed.sql`

### 6. Ejecutar

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Primer administrador

El seed crea esta cuenta:

- email: `admin@marketzone.mx`
- contraseña: `Admin123!`

Si quieres otro correo para admin, cambia `ADMIN_EMAIL` antes de correr `npm run db:setup`.

## Subida de imagenes y videos

Actualmente el panel admin acepta:

- URL directa
- data URL base64

Eso permite subir archivos desde el navegador sin depender de otro servicio durante el arranque del proyecto.

Para produccion real se recomienda mover medios a:

- Cloudflare R2
- Cloudinary
- S3 compatible

## Seguridad aplicada

- contraseñas hasheadas
- JWT para sesiones
- roles `customer` y `admin`
- rutas admin protegidas
- validaciones basicas de formularios
- consultas parametrizadas
- proteccion CORS
- helmet en backend

## Estado del proyecto

Esta version ya es una base funcional amplia y mucho mas cercana a un marketplace profesional que la version anterior.

Siguientes mejoras naturales:

- integrar almacenamiento externo real para medios
- mejorar gestion de variantes por combinacion
- cupones completos desde admin
- respuestas de preguntas desde admin
- paqueterias reales
- pagos productivos finales
