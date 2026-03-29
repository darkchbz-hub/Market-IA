INSERT INTO users (role, nombre, email, password_hash, direccion)
VALUES (
  'admin',
  'Administrador MarketZone',
  'admin@marketzone.mx',
  crypt('Admin123!', gen_salt('bf')),
  '{"calle":"Av. Reforma 100","ciudad":"Ciudad de Mexico","estado":"CDMX","cp":"06600","pais":"MX"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (slug, nombre, descripcion, precio_cents, stock, categoria, tags, imagenes)
VALUES
(
  'chatgpt-plus-anual',
  'ChatGPT Plus anual',
  'Suscripcion premium para productividad, redaccion, analisis y automatizacion diaria.',
  349900,
  100,
  'apps',
  ARRAY['ia', 'chat', 'productividad'],
  '["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"]'::jsonb
),
(
  'notion-ai-business',
  'Notion AI Business',
  'Espacio de trabajo con inteligencia artificial para documentacion, planeacion y equipos.',
  289900,
  80,
  'apps',
  ARRAY['notion', 'workspace', 'ia'],
  '["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80"]'::jsonb
),
(
  'pack-creador-pro',
  'Pack Creador Pro',
  'Bundle de herramientas premium para edicion, copies, thumbnails y estrategia de contenido.',
  799900,
  40,
  'packs',
  ARRAY['pack', 'creadores', 'contenido'],
  '["https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=900&q=80"]'::jsonb
),
(
  'pack-agencia-ventas',
  'Pack Agencia Ventas',
  'Suite de herramientas para prospeccion, automatizacion comercial y seguimiento de clientes.',
  999900,
  35,
  'packs',
  ARRAY['ventas', 'crm', 'automatizacion'],
  '["https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80"]'::jsonb
),
(
  'landing-premium-ia',
  'Landing premium con IA',
  'Servicio web para lanzar una pagina de ventas optimizada con copy, estructura y secciones listas.',
  2490000,
  20,
  'webs',
  ARRAY['landing', 'web', 'ventas'],
  '["https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80"]'::jsonb
),
(
  'tienda-web-completa',
  'Tienda web completa',
  'Implementacion de tienda online con catalogo, carrito, checkout y administracion basica.',
  5990000,
  10,
  'webs',
  ARRAY['ecommerce', 'tienda', 'desarrollo'],
  '["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
