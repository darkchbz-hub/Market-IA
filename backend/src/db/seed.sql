INSERT INTO users (role, nombre, email, password_hash, telefono, nickname, direccion)
VALUES (
  'admin',
  'Administrador Gray C Shop',
  'admin@marketzone.mx',
  crypt('Admin123!', gen_salt('bf')),
  '+52 5512345678',
  'graycadmin',
  '{"calle":"Av. Reforma 100","ciudad":"Ciudad de Mexico","estado":"CDMX","cp":"06600","pais":"Mexico"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (nombre, slug, descripcion, icono, color, featured, sort_order)
VALUES
('Tecnologia', 'tecnologia', 'Laptops, celulares, accesorios y equipos premium.', 'laptop', '#2563eb', TRUE, 1),
('Hogar', 'hogar', 'Articulos para cocina, muebles, decoracion y organizacion.', 'home', '#0f766e', TRUE, 2),
('Jardin', 'jardin', 'Herramientas, macetas, iluminacion y cuidado exterior.', 'leaf', '#16a34a', TRUE, 3),
('Automovil', 'automovil', 'Accesorios para auto, mantenimiento y viaje.', 'car', '#f97316', TRUE, 4),
('Empresas', 'empresas', 'Equipamiento y soluciones para oficina y negocio.', 'briefcase', '#8b5cf6', TRUE, 5),
('Mayoreo', 'mayoreo', 'Lotes, compras por volumen y soluciones comerciales.', 'boxes', '#f59e0b', TRUE, 6),
('Importados', 'importados', 'Productos globales y tendencias internacionales.', 'globe', '#ec4899', TRUE, 7),
('Mascotas', 'mascotas', 'Comida, accesorios, higiene y descanso para mascotas.', 'paw', '#22c55e', TRUE, 8),
('Ropa', 'ropa', 'Moda casual, premium y accesorios personales.', 'shirt', '#ef4444', TRUE, 9),
('Juguetes', 'juguetes', 'Entretenimiento, aprendizaje y regalos.', 'gift', '#06b6d4', TRUE, 10)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO site_settings (scope, content)
VALUES
(
  'homepage',
  '{
    "announcement":"Compra con seguridad, garantia y envio confiable.",
    "heroEyebrow":"Marketplace premium",
    "heroTitle":"Todo lo que necesitas para tecnologia, hogar, negocio y estilo de vida en un solo lugar.",
    "heroDescription":"Una plataforma profesional para comprar productos de muchas categorias con experiencia elegante, segura y preparada para crecer.",
    "heroPrimary":"Explorar catalogo",
    "heroSecondary":"Ver ofertas",
    "featuredTitle":"Recomendados para ti",
    "offersTitle":"Ofertas especiales",
    "bestsellersTitle":"Mas vendidos",
    "videoTitle":"Comerciales y novedades",
    "musicTitle":"Ambiente de compra"
  }'::jsonb
),
(
  'general',
  '{
    "siteName":"Gray C Shop",
    "tagline":"Marketplace elegante para categorias premium y compras confiables.",
    "supportEmail":"ventas@graycshop.com",
    "supportPhone":"+52 5512345678"
  }'::jsonb
)
ON CONFLICT (scope) DO NOTHING;

INSERT INTO site_banners (titulo, subtitulo, media_url, link_url, orden, is_active)
VALUES
(
  'Tecnologia y hogar con presencia premium',
  'Descubre lanzamientos, lotes comerciales y productos destacados.',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80',
  '/catalogo',
  1,
  TRUE
),
(
  'Promociones por temporada',
  'Encuentra oportunidades reales para renovar tu negocio y tu espacio.',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&q=80',
  '/catalogo?sort=discount',
  2,
  TRUE
)
ON CONFLICT DO NOTHING;

INSERT INTO promo_videos (titulo, descripcion, video_url, poster_url, orden, is_active)
VALUES
(
  'Coleccion premium de tecnologia',
  'Video destacado para portada o comerciales de temporada.',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&q=80',
  1,
  TRUE
),
(
  'Vida moderna para hogar y oficina',
  'Presentacion audiovisual para mostrar categorias variadas.',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1400&q=80',
  2,
  TRUE
)
ON CONFLICT DO NOTHING;

INSERT INTO music_tracks (titulo, artista, audio_url, portada_url, orden, is_active)
VALUES
(
  'Ambient Motion',
  'Royalty Free',
  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_4df87f35f8.mp3?filename=future-bass-logo-126181.mp3',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
  1,
  TRUE
)
ON CONFLICT DO NOTHING;

INSERT INTO products (
  slug,
  nombre,
  descripcion,
  descripcion_corta,
  marca,
  precio_cents,
  precio_anterior_cents,
  descuento_porcentaje,
  moneda,
  imagenes,
  stock,
  categoria,
  tags,
  variantes,
  atributos,
  metodos_pago,
  garantia,
  devolucion,
  info_envio,
  fecha_estimada,
  disponibilidad,
  destacado,
  oferta,
  mas_vendido,
  recomendado
)
VALUES
(
  'laptop-pro-14',
  'Laptop Pro 14',
  'Laptop premium para trabajo, estudio, diseno y movilidad diaria con pantalla de alta definicion y bateria extendida.',
  'Potencia y elegancia para productividad profesional.',
  'GrayTech',
  1899900,
  2149900,
  12,
  'MXN',
  '["https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  25,
  'tecnologia',
  ARRAY['laptop','premium','trabajo'],
  '[{"tipo":"Color","opciones":["Gris espacial","Plata"]},{"tipo":"RAM","opciones":["16 GB","32 GB"]}]'::jsonb,
  '[{"nombre":"Pantalla","valor":"14 pulgadas"},{"nombre":"Procesador","valor":"Octa Core"},{"nombre":"Almacenamiento","valor":"1 TB SSD"}]'::jsonb,
  '["Tarjeta","PayPal","Mercado Pago"]'::jsonb,
  'Garantia de 12 meses.',
  'Devolucion durante los primeros 7 dias por defecto de fabrica.',
  'Envio nacional con rastreo y seguro.',
  'Llega entre 2 y 5 dias habiles.',
  'Disponible',
  TRUE, TRUE, TRUE, TRUE
),
(
  'smartphone-elite-5g',
  'Smartphone Elite 5G',
  'Telefono inteligente de alto rendimiento con pantalla inmersiva, camara avanzada y conectividad 5G.',
  'Rendimiento premium para uso diario y creacion de contenido.',
  'Nova Mobile',
  1249900,
  1399900,
  10,
  'MXN',
  '["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  40,
  'tecnologia',
  ARRAY['celular','5g','camara'],
  '[{"tipo":"Capacidad","opciones":["256 GB","512 GB"]},{"tipo":"Color","opciones":["Azul","Negro"]}]'::jsonb,
  '[{"nombre":"Camara","valor":"50 MP"},{"nombre":"Bateria","valor":"5000 mAh"},{"nombre":"Pantalla","valor":"6.7 pulgadas OLED"}]'::jsonb,
  '["Tarjeta","PayPal","Mercado Pago"]'::jsonb,
  'Garantia de 12 meses.',
  'Devolucion durante 7 dias por defecto valido.',
  'Envio express a ciudades principales.',
  'Entrega estimada de 1 a 3 dias habiles.',
  'Disponible',
  TRUE, TRUE, FALSE, TRUE
),
(
  'set-hogar-premium',
  'Set Hogar Premium',
  'Coleccion de organizacion y decoracion para transformar espacios con estilo sobrio y funcional.',
  'Orden y presencia premium para tu casa.',
  'Nord House',
  459900,
  589900,
  22,
  'MXN',
  '["https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  70,
  'hogar',
  ARRAY['hogar','decoracion','organizacion'],
  '[]'::jsonb,
  '[{"nombre":"Material","valor":"Madera y metal"},{"nombre":"Contenido","valor":"6 piezas"}]'::jsonb,
  '["Tarjeta","Mercado Pago"]'::jsonb,
  'Garantia de 6 meses.',
  'Devolucion por dano o pieza incompleta.',
  'Envio economico o express.',
  'Entrega estimada de 3 a 6 dias habiles.',
  'Disponible',
  FALSE, TRUE, TRUE, TRUE
),
(
  'kit-jardin-urbano',
  'Kit Jardin Urbano',
  'Set completo para iniciar un pequeno espacio verde con herramientas, macetas y sistema de riego simple.',
  'Ideal para balcones, patios y terrazas.',
  'Green Habit',
  329900,
  0,
  0,
  'MXN',
  '["https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  55,
  'jardin',
  ARRAY['jardin','plantas','macetas'],
  '[]'::jsonb,
  '[{"nombre":"Incluye","valor":"Macetas, tierra, semillas y herramientas"},{"nombre":"Uso","valor":"Interior y exterior"}]'::jsonb,
  '["Tarjeta","PayPal"]'::jsonb,
  'Garantia de satisfaccion de 30 dias.',
  'Cambios por defecto de fabrica.',
  'Envio con proteccion de piezas delicadas.',
  'Entrega estimada de 2 a 4 dias habiles.',
  'Disponible',
  FALSE, FALSE, FALSE, TRUE
),
(
  'camara-auto-dash',
  'Camara Dash Auto',
  'Camara compacta para tablero con grabacion HD, vision nocturna y deteccion de movimiento.',
  'Seguridad y respaldo para cada trayecto.',
  'RoadVision',
  199900,
  249900,
  20,
  'MXN',
  '["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  90,
  'automovil',
  ARRAY['auto','camara','seguridad'],
  '[]'::jsonb,
  '[{"nombre":"Resolucion","valor":"Full HD"},{"nombre":"Vision","valor":"Nocturna"},{"nombre":"Memoria","valor":"Hasta 128 GB"}]'::jsonb,
  '["Tarjeta","Mercado Pago"]'::jsonb,
  'Garantia de 12 meses.',
  'Devolucion por falla reportada.',
  'Envio a todo Mexico.',
  'Entrega estimada de 2 a 5 dias habiles.',
  'Disponible',
  FALSE, TRUE, FALSE, TRUE
),
(
  'lote-importado-mayoreo',
  'Lote Importado para Mayoreo',
  'Paquete comercial con articulos variados para revender con excelente margen y presentacion profesional.',
  'Pensado para negocio, tienda o distribucion local.',
  'Global Supply',
  5599900,
  0,
  0,
  'MXN',
  '["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  12,
  'mayoreo',
  ARRAY['lote','mayoreo','importado'],
  '[]'::jsonb,
  '[{"nombre":"Unidades","valor":"120 piezas mixtas"},{"nombre":"Origen","valor":"Importado"}]'::jsonb,
  '["Transferencia","Tarjeta"]'::jsonb,
  'Garantia de recepcion completa.',
  'Revision al recibir dentro de 48 horas.',
  'Envio consolidado con seguimiento.',
  'Entrega estimada de 5 a 10 dias habiles.',
  'Disponible',
  TRUE, FALSE, TRUE, TRUE
),
(
  'cama-premium-mascotas',
  'Cama Premium para Mascotas',
  'Descanso ergonomico y facil de limpiar para perros y gatos pequenos o medianos.',
  'Comodidad real para tu mascota.',
  'Pet Nest',
  149900,
  189900,
  21,
  'MXN',
  '["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  120,
  'mascotas',
  ARRAY['mascotas','cama','perros'],
  '[{"tipo":"Talla","opciones":["S","M","L"]}]'::jsonb,
  '[{"nombre":"Material","valor":"Tela lavable"},{"nombre":"Relleno","valor":"Espuma suave"}]'::jsonb,
  '["Tarjeta","PayPal","Mercado Pago"]'::jsonb,
  'Garantia de 30 dias.',
  'Devolucion por dano de fabrica.',
  'Envio rapido con proteccion.',
  'Entrega estimada de 2 a 4 dias habiles.',
  'Disponible',
  FALSE, TRUE, TRUE, TRUE
)
ON CONFLICT (slug) DO NOTHING;
