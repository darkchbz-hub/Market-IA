import { hashPassword } from "./security.js";

const seedProducts = [
  {
    nombre: "Apple iPhone 16 128GB Azul",
    slug: "apple-iphone-16-128gb-azul",
    descripcion:
      "Smartphone premium pensado para quienes buscan fluidez diaria, buena autonomia y una experiencia equilibrada entre fotografia, rendimiento y ecosistema Apple.",
    descripcionCorta: "iPhone 16 de 128GB con pantalla de 6.1 pulgadas y acabado azul.",
    marca: "Apple",
    precio: 18759,
    stock: 394,
    vendidos: 18,
    categoria: "tecnologia",
    tags: ["iphone 16", "apple", "128gb", "smartphone", "celular premium", "ios"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.1 pulgadas",
      "Almacenamiento interno de 128GB",
      "Color azul",
      "Experiencia fluida para apps, fotos y multimedia",
      "Equipo orientado a uso premium diario"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio nacional con seguimiento y embalaje protegido.",
    fechaEstimada: "Entrega estimada de 3 a 6 dias habiles.",
    garantia: "Garantia directa por defectos de fabrica.",
    devolucion: "Devolucion sujeta a politicas de la tienda.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Motorola Edge 60 5G 256GB 8GB RAM Verde",
    slug: "motorola-edge-60-5g-256gb-8gb-verde",
    descripcion:
      "Celular 5G con enfoque en velocidad, buena pantalla y almacenamiento generoso para productividad, redes sociales, juegos y contenido multimedia.",
    descripcionCorta: "Motorola Edge 60 5G con 256GB, 8GB RAM y pantalla de 6.67 pulgadas.",
    marca: "Motorola",
    precio: 5069,
    stock: 6,
    vendidos: 4,
    categoria: "tecnologia",
    tags: ["motorola", "edge 60", "5g", "256gb", "8gb ram", "p-oled"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.67 pulgadas",
      "Tecnologia de visualizacion P-OLED",
      "Almacenamiento interno de 256GB",
      "Memoria RAM de 8GB",
      "Bateria de 5200mAh",
      "Conectividad 5G",
      "Dual SIM"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio con rastreo y preparacion prioritaria.",
    fechaEstimada: "Entrega estimada de 3 a 5 dias habiles.",
    garantia: "Garantia por defectos de fabrica.",
    devolucion: "Aplica devolucion de acuerdo con condiciones vigentes.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Apple iPhone 15 128GB Verde",
    slug: "apple-iphone-15-128gb-verde",
    descripcion:
      "Equipo orientado a quienes quieren un smartphone Apple moderno, comodo para uso diario, fotografia y rendimiento estable para trabajo y entretenimiento.",
    descripcionCorta: "iPhone 15 de 128GB en color verde con pantalla de 6.1 pulgadas.",
    marca: "Apple",
    precio: 15009,
    stock: 1,
    vendidos: 7,
    categoria: "tecnologia",
    tags: ["iphone 15", "apple", "128gb", "verde", "smartphone", "ios"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.1 pulgadas",
      "Tecnologia Super Retina XDR",
      "Almacenamiento interno de 128GB",
      "Color verde",
      "Diseno premium para uso diario"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio asegurado con monitoreo del pedido.",
    fechaEstimada: "Entrega estimada de 3 a 6 dias habiles.",
    garantia: "Garantia por fallas de fabrica.",
    devolucion: "Sujeta a revision y politicas de devolucion.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Apple iPhone 17 Pro Max 256GB Azul",
    slug: "apple-iphone-17-pro-max-256gb-azul",
    descripcion:
      "Celular de gama alta pensado para usuarios que buscan un dispositivo amplio, con gran capacidad interna y experiencia premium para productividad y contenido.",
    descripcionCorta: "iPhone 17 Pro Max con 256GB y color azul.",
    marca: "Apple",
    precio: 29479,
    stock: 4,
    vendidos: 2,
    categoria: "tecnologia",
    tags: ["iphone 17 pro max", "apple", "256gb", "azul", "smartphone premium"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.9 pulgadas",
      "Tecnologia Super Retina XDR",
      "Almacenamiento interno de 256GB",
      "Color azul",
      "Formato ideal para consumo multimedia y trabajo movil"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio con rastreo nacional y empaquetado seguro.",
    fechaEstimada: "Entrega estimada de 3 a 6 dias habiles.",
    garantia: "Garantia limitada por defectos de fabrica.",
    devolucion: "Revision previa conforme a politicas de devolucion.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Infinix Hot 70 256GB 8GB RAM Azul",
    slug: "infinix-hot-70-256gb-8gb-azul",
    descripcion:
      "Telefono orientado a quienes buscan espacio interno, autonomia amplia y buen formato de pantalla para apps, video y navegacion diaria.",
    descripcionCorta: "Infinix Hot 70 con 256GB, 8GB RAM y pantalla de 6.78 pulgadas.",
    marca: "Infinix",
    precio: 4749,
    stock: 72,
    vendidos: 5,
    categoria: "tecnologia",
    tags: ["infinix", "hot 70", "256gb", "8gb ram", "4g", "smartphone"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.78 pulgadas",
      "Panel LCD",
      "Almacenamiento interno de 256GB",
      "Memoria RAM de 8GB",
      "Bateria de 5600mAh",
      "Conectividad 4G",
      "Dual SIM"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio con seguimiento para todo Mexico.",
    fechaEstimada: "Entrega estimada de 3 a 5 dias habiles.",
    garantia: "Cobertura por defectos de fabrica.",
    devolucion: "Aplican terminos de devolucion de la tienda.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Motorola Edge 60 Neo 5G 256GB 12GB RAM Gris",
    slug: "motorola-edge-60-neo-5g-256gb-12gb-gris",
    descripcion:
      "Smartphone 5G de perfil moderno con RAM amplia, buena capacidad interna y formato equilibrado para trabajo, entretenimiento y multitarea intensa.",
    descripcionCorta: "Motorola Edge 60 Neo 5G con 256GB, 12GB RAM y acabado gris.",
    marca: "Motorola",
    precio: 6299,
    stock: 300,
    vendidos: 9,
    categoria: "tecnologia",
    tags: ["motorola", "edge 60 neo", "5g", "256gb", "12gb ram", "p-oled"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.3 pulgadas",
      "Tecnologia P-OLED",
      "Almacenamiento interno de 256GB",
      "Memoria RAM de 12GB",
      "Bateria de 5000mAh",
      "Conectividad 5G",
      "SIM dual"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio protegido con rastreo actualizado.",
    fechaEstimada: "Entrega estimada de 3 a 5 dias habiles.",
    garantia: "Garantia por defectos de fabrica.",
    devolucion: "Devolucion segun condiciones vigentes.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Samsung Galaxy A17 5G 128GB 4GB RAM Gris",
    slug: "samsung-galaxy-a17-5g-128gb-4gb-gris",
    descripcion:
      "Celular Samsung de entrada a gama media con conectividad 5G, buena bateria y formato practico para mensajeria, contenido y uso diario.",
    descripcionCorta: "Galaxy A17 5G con 128GB, 4GB RAM y pantalla de 6.7 pulgadas.",
    marca: "Samsung",
    precio: 3949,
    stock: 20,
    vendidos: 6,
    categoria: "tecnologia",
    tags: ["samsung", "galaxy a17", "5g", "128gb", "4gb ram", "super amoled"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.7 pulgadas",
      "Tecnologia Super AMOLED",
      "Almacenamiento interno de 128GB",
      "Memoria RAM de 4GB",
      "Bateria de 5000mAh",
      "Conectividad 5G",
      "Single SIM"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio monitoreado y embalaje seguro.",
    fechaEstimada: "Entrega estimada de 3 a 5 dias habiles.",
    garantia: "Garantia por defectos de fabrica.",
    devolucion: "Aplica conforme a politicas vigentes.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Apple iPhone 16 128GB Negro",
    slug: "apple-iphone-16-128gb-negro",
    descripcion:
      "Smartphone Apple para quienes buscan una experiencia premium, manejo fluido de apps y un formato comodo para productividad, fotografia y uso diario.",
    descripcionCorta: "iPhone 16 de 128GB en color negro con pantalla de 6.1 pulgadas.",
    marca: "Apple",
    precio: 17729,
    stock: 26,
    vendidos: 11,
    categoria: "tecnologia",
    tags: ["iphone 16", "apple", "128gb", "negro", "ios", "super retina xdr"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.1 pulgadas",
      "Tecnologia Super Retina XDR",
      "Almacenamiento interno de 128GB",
      "Color negro",
      "Bluetooth y GPS integrados"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio nacional con rastreo y proteccion en empaque.",
    fechaEstimada: "Entrega estimada de 3 a 6 dias habiles.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Aplica devolucion conforme a las politicas vigentes.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Apple iPhone 16 128GB Blanco",
    slug: "apple-iphone-16-128gb-blanco",
    descripcion:
      "Celular Apple enfocado en usuarios que valoran diseno limpio, fluidez diaria y un equipo confiable para apps, fotos, video y trabajo movil.",
    descripcionCorta: "iPhone 16 blanco con 128GB y panel Super Retina XDR de 6.1 pulgadas.",
    marca: "Apple",
    precio: 17809,
    stock: 27,
    vendidos: 8,
    categoria: "tecnologia",
    tags: ["iphone 16", "apple", "128gb", "blanco", "ios", "smartphone premium"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.1 pulgadas",
      "Tecnologia Super Retina XDR",
      "Capacidad interna de 128GB",
      "Color blanco",
      "Equipo comodo para productividad y multimedia"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio monitoreado con preparacion segura del pedido.",
    fechaEstimada: "Entrega estimada de 3 a 6 dias habiles.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Sujeto a revision y politicas de devolucion.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Apple iPhone 16 128GB Verde",
    slug: "apple-iphone-16-128gb-verde",
    descripcion:
      "iPhone orientado a quienes desean una combinacion de autonomia, buen rendimiento y diseno actual para estudiar, trabajar o disfrutar contenido.",
    descripcionCorta: "iPhone 16 verde de 128GB con pantalla de 6.1 pulgadas.",
    marca: "Apple",
    precio: 19119,
    stock: 2,
    vendidos: 5,
    categoria: "tecnologia",
    tags: ["iphone 16", "apple", "128gb", "verde", "ios", "smartphone"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.1 pulgadas",
      "Almacenamiento interno de 128GB",
      "Color verde",
      "Bluetooth integrado",
      "Formato premium para uso diario"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio protegido con seguimiento y entrega nacional.",
    fechaEstimada: "Entrega estimada de 3 a 6 dias habiles.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Aplica segun terminos y condiciones de la tienda.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Apple iPhone 16 128GB Rosa",
    slug: "apple-iphone-16-128gb-rosa",
    descripcion:
      "Telefono Apple con enfoque en experiencia premium, almacenamiento equilibrado y un formato practico para fotos, redes y productividad diaria.",
    descripcionCorta: "iPhone 16 rosa con 128GB y pantalla Super Retina XDR de 6.1 pulgadas.",
    marca: "Apple",
    precio: 16429,
    stock: 2,
    vendidos: 4,
    categoria: "tecnologia",
    tags: ["iphone 16", "apple", "128gb", "rosa", "ios", "retina xdr"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.1 pulgadas",
      "Tecnologia Super Retina XDR",
      "Capacidad de 128GB",
      "Color rosa",
      "Dispositivo ideal para foto, video y apps"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio monitoreado con embalaje seguro.",
    fechaEstimada: "Entrega estimada de 3 a 6 dias habiles.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Disponible conforme a politicas vigentes.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Apple iPhone 17 Pro Max 256GB Plata",
    slug: "apple-iphone-17-pro-max-256gb-plata",
    descripcion:
      "Equipo de gama alta pensado para quienes quieren pantalla amplia, gran capacidad interna y una experiencia premium para trabajo, creacion de contenido y entretenimiento.",
    descripcionCorta: "iPhone 17 Pro Max plata con 256GB y pantalla Super Retina XDR.",
    marca: "Apple",
    precio: 36259,
    stock: 2,
    vendidos: 1,
    categoria: "tecnologia",
    tags: ["iphone 17 pro max", "apple", "256gb", "plata", "premium", "smartphone"],
    imagenes: [],
    caracteristicas: [
      "Pantalla Super Retina XDR",
      "Capacidad interna de 256GB",
      "Color plata",
      "Formato premium de gran tamano",
      "Ideal para productividad y contenido multimedia"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio protegido con rastreo y seguimiento nacional.",
    fechaEstimada: "Entrega estimada de 3 a 6 dias habiles.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Sujeta a revision de acuerdo con politicas vigentes.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Samsung Galaxy A56 5G 256GB 8GB RAM Verde",
    slug: "samsung-galaxy-a56-5g-256gb-8gb-verde",
    descripcion:
      "Celular Samsung con conectividad 5G, pantalla AMOLED amplia y espacio suficiente para apps, fotos, videos y trabajo diario.",
    descripcionCorta: "Galaxy A56 5G verde con 256GB, 8GB RAM y pantalla de 6.7 pulgadas.",
    marca: "Samsung",
    precio: 8789,
    stock: 0,
    vendidos: 14,
    categoria: "tecnologia",
    tags: ["samsung", "galaxy a56", "5g", "256gb", "8gb ram", "amoled"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.7 pulgadas",
      "Tecnologia AMOLED",
      "Almacenamiento de 256GB",
      "Memoria RAM de 8GB",
      "Bateria de 5000mAh",
      "Conectividad 5G",
      "Single SIM"
    ],
    disponibilidad: "Agotado",
    infoEnvio: "Producto sujeto a reabastecimiento y confirmacion de disponibilidad.",
    fechaEstimada: "Entrega estimada al reingresar inventario.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Aplica conforme a politicas de devolucion vigentes.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Samsung Galaxy A56 5G 256GB 12GB RAM Gris",
    slug: "samsung-galaxy-a56-5g-256gb-12gb-gris",
    descripcion:
      "Smartphone Samsung para quienes necesitan mas memoria RAM, conectividad 5G y una pantalla amplia para multitarea, productividad y entretenimiento.",
    descripcionCorta: "Galaxy A56 5G gris con 256GB, 12GB RAM y panel Super AMOLED.",
    marca: "Samsung",
    precio: 9309,
    stock: 10,
    vendidos: 6,
    categoria: "tecnologia",
    tags: ["samsung", "galaxy a56", "5g", "256gb", "12gb ram", "super amoled"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.7 pulgadas",
      "Tecnologia Super AMOLED",
      "Almacenamiento interno de 256GB",
      "Memoria RAM de 12GB",
      "Bateria de 5000mAh",
      "Conectividad 5G",
      "SIM dual"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio seguro con seguimiento y preparacion prioritaria.",
    fechaEstimada: "Entrega estimada de 3 a 5 dias habiles.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Sujeta a validacion conforme a politicas vigentes.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Xiaomi Redmi Note 14 128GB 6GB RAM Negro",
    slug: "xiaomi-redmi-note-14-128gb-6gb-negro",
    descripcion:
      "Celular Xiaomi enfocado en rendimiento solido, almacenamiento equilibrado y buena bateria para mensajeria, video, redes y apps cotidianas.",
    descripcionCorta: "Redmi Note 14 negro con 128GB, 6GB RAM y pantalla AMOLED de 6.67 pulgadas.",
    marca: "Xiaomi",
    precio: 3789,
    stock: 10,
    vendidos: 13,
    categoria: "tecnologia",
    tags: ["xiaomi", "redmi note 14", "128gb", "6gb ram", "amoled", "dual sim"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.67 pulgadas",
      "Tecnologia AMOLED",
      "Almacenamiento interno de 128GB",
      "Memoria RAM de 6GB",
      "Bateria de 5110mAh",
      "Conectividad 4G",
      "Dual SIM"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio monitoreado con entrega estimada nacional.",
    fechaEstimada: "Entrega estimada de 3 a 5 dias habiles.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Aplica bajo condiciones vigentes de devolucion.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Xiaomi Redmi Note 14 128GB 6GB RAM Azul",
    slug: "xiaomi-redmi-note-14-128gb-6gb-azul",
    descripcion:
      "Telefono Xiaomi de uso diario con pantalla amplia, buena autonomia y espacio suficiente para aplicaciones, fotos y consumo multimedia.",
    descripcionCorta: "Redmi Note 14 azul con 128GB, 6GB RAM y pantalla de 6.67 pulgadas.",
    marca: "Xiaomi",
    precio: 2979,
    stock: 8,
    vendidos: 9,
    categoria: "tecnologia",
    tags: ["xiaomi", "redmi note 14", "128gb", "6gb ram", "azul", "dual sim"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.67 pulgadas",
      "Panel AMOLED",
      "Almacenamiento interno de 128GB",
      "Memoria RAM de 6GB",
      "Bateria de 5160mAh",
      "Conectividad 4G",
      "Dual SIM"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio con rastreo y empaque protegido.",
    fechaEstimada: "Entrega estimada de 3 a 5 dias habiles.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Devolucion sujeta a politicas de la tienda.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Motorola Moto G85 5G 256GB 8GB RAM Verde",
    slug: "motorola-moto-g85-5g-256gb-8gb-verde",
    descripcion:
      "Equipo Motorola con conectividad 5G, panel P-OLED y equilibrio entre capacidad, autonomia y rendimiento para trabajo y entretenimiento.",
    descripcionCorta: "Moto G85 5G verde con 256GB, 8GB RAM y pantalla P-OLED de 6.67 pulgadas.",
    marca: "Motorola",
    precio: 4459,
    stock: 1,
    vendidos: 10,
    categoria: "tecnologia",
    tags: ["motorola", "moto g85", "5g", "256gb", "8gb ram", "p-oled"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.67 pulgadas",
      "Tecnologia P-OLED",
      "Almacenamiento interno de 256GB",
      "Memoria RAM de 8GB",
      "Bateria de 5000mAh",
      "Conectividad 5G",
      "Dual SIM"
    ],
    disponibilidad: "Disponible",
    infoEnvio: "Envio seguro con seguimiento actualizado.",
    fechaEstimada: "Entrega estimada de 3 a 5 dias habiles.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Aplica conforme a politicas vigentes.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  },
  {
    nombre: "Infinix Note 50 Pro 256GB 8GB RAM Gris",
    slug: "infinix-note-50-pro-256gb-8gb-gris",
    descripcion:
      "Celular Infinix con pantalla AMOLED, almacenamiento amplio y autonomia generosa para estudio, trabajo, streaming y apps cotidianas.",
    descripcionCorta: "Infinix Note 50 Pro gris con 256GB, 8GB RAM y pantalla AMOLED de 6.7 pulgadas.",
    marca: "Infinix",
    precio: 4609,
    stock: 0,
    vendidos: 7,
    categoria: "tecnologia",
    tags: ["infinix", "note 50 pro", "256gb", "8gb ram", "amoled", "dual sim"],
    imagenes: [],
    caracteristicas: [
      "Pantalla de 6.7 pulgadas",
      "Tecnologia AMOLED",
      "Almacenamiento interno de 256GB",
      "Memoria RAM de 8GB",
      "Bateria de 5200mAh",
      "Conectividad 4G",
      "Dual SIM"
    ],
    disponibilidad: "Agotado",
    infoEnvio: "Disponible para reabastecimiento y alerta de inventario.",
    fechaEstimada: "Entrega estimada al reingresar existencias.",
    garantia: "Garantia de 1 ano por defectos de fabrica.",
    devolucion: "Aplica conforme a politicas vigentes.",
    envioGratis: false,
    mostrarEnvioGratis: false,
    precioDescuento: 0
  }
];
export const marketplaceCategories = [
  { slug: "tecnologia", nombre: "Tecnologia", descripcion: "Laptops, celulares, accesorios y equipos premium.", icono: "⌘", color: "#2563eb" },
  { slug: "hogar", nombre: "Hogar", descripcion: "Cocina, decoracion, orden y estilo para tus espacios.", icono: "⌂", color: "#0f766e" },
  { slug: "jardin", nombre: "Jardin", descripcion: "Herramientas, macetas y articulos para exterior.", icono: "❋", color: "#16a34a" },
  { slug: "automovil", nombre: "Automovil", descripcion: "Accesorios y soluciones para cada trayecto.", icono: "◈", color: "#f97316" },
  { slug: "empresas", nombre: "Empresas", descripcion: "Recursos y equipo para oficina y negocio.", icono: "▣", color: "#8b5cf6" },
  { slug: "mayoreo", nombre: "Mayoreo", descripcion: "Compras por volumen para venta y distribucion.", icono: "◫", color: "#f59e0b" },
  { slug: "importados", nombre: "Importados", descripcion: "Productos globales y tendencias internacionales.", icono: "◎", color: "#ec4899" },
  { slug: "mascotas", nombre: "Mascotas", descripcion: "Todo para compania, descanso e higiene.", icono: "✦", color: "#22c55e" },
  { slug: "ropa", nombre: "Ropa", descripcion: "Moda, accesorios y colecciones actuales.", icono: "◍", color: "#ef4444" },
  { slug: "juguetes", nombre: "Juguetes", descripcion: "Diversion y regalos para todas las edades.", icono: "★", color: "#06b6d4" },
  { slug: "productos", nombre: "Productos", descripcion: "Categorias generales y destacados del marketplace.", icono: "•", color: "#38bdf8" },
  { slug: "electronica", nombre: "Electronica", descripcion: "Equipos, dispositivos y accesorios.", icono: "▰", color: "#2563eb" },
  { slug: "casa", nombre: "Casa", descripcion: "Soluciones utiles para tu hogar.", icono: "⌂", color: "#14b8a6" },
  { slug: "apps", nombre: "Suscripciones IA", descripcion: "Software, accesos premium, automatizacion y productividad.", icono: "✧", color: "#7c3aed" },
  { slug: "packs", nombre: "Packs", descripcion: "Combos digitales y herramientas completas.", icono: "◇", color: "#f97316" },
  { slug: "webs", nombre: "Servicios web", descripcion: "Landing pages, tiendas y desarrollo.", icono: "◎", color: "#38bdf8" },
  { slug: "mas", nombre: "Mas", descripcion: "Otras oportunidades y categorias especiales.", icono: "…", color: "#94a3b8" }
];
const allowedCategories = marketplaceCategories.map((item) => item.slug);
const defaultSiteContent = {
  home: {
    announcement: "Compra con seguridad, garantia y envio confiable.",
    heroEyebrow: "Marketplace premium",
    heroTitle: "Todo lo que necesitas para tecnologia, hogar, negocio y estilo de vida en un solo lugar.",
    heroDescription:
      "Una plataforma profesional para comprar productos de muchas categorias con experiencia elegante, segura y preparada para crecer.",
    heroPrimary: "Explorar catalogo",
    heroSecondary: "Ver ofertas",
    featuredTitle: "Recomendados para ti",
    offersTitle: "Ofertas especiales",
    bestsellersTitle: "Mas vendidos",
    videoTitle: "Comerciales y novedades",
    musicTitle: "Ambiente de compra"
  },
  general: {
    siteName: "Gray C Shop",
    tagline: "Marketplace elegante para categorias premium y compras confiables.",
    supportEmail: "ventas@graycshop.com",
    supportPhone: "+52 5512345678",
    signupInviteCode: "123456",
    allowedEmailDomains: ["gmail.com", "outlook.com", "hotmail.com", "live.com", "icloud.com", "yahoo.com"],
    partnerTitle: "Empresas asociadas",
    partnerLogos: []
  },
  banners: [],
  videos: [],
  music: []
};

const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL DEFAULT 'customer',
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      telefono TEXT NOT NULL DEFAULT '',
      nickname TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      geo_meta TEXT NOT NULL DEFAULT '{}',
      direccion TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      vendidos INTEGER NOT NULL DEFAULT 0,
      categoria TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      imagenes TEXT NOT NULL DEFAULT '[]',
      vendedor_oficial TEXT NOT NULL DEFAULT '',
      mostrar_sello_oficial INTEGER NOT NULL DEFAULT 0,
      envio_gratis INTEGER NOT NULL DEFAULT 0,
      mostrar_envio_gratis INTEGER NOT NULL DEFAULT 0,
      precio_descuento REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      estado TEXT NOT NULL,
      proveedor_pago TEXT NOT NULL,
      direccion TEXT NOT NULL DEFAULT '{}',
      tracking TEXT NOT NULL DEFAULT '[]',
      payment_reference TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      cantidad INTEGER NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      external_id TEXT,
      approval_url TEXT,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      busqueda TEXT NOT NULL,
      fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS product_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sender_role TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      leido INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS registration_codes (
      email TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS site_content (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS product_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reviewer_name TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL,
      comentario TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
];

let bootstrapPromise;

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

function pickFrom(list, seed) {
  if (!Array.isArray(list) || list.length === 0) {
    return "";
  }
  const index = Math.abs(seed) % list.length;
  return list[index];
}

function deterministic(seed, salt = 0) {
  const base = Math.abs(Number(seed) || 0) + Math.abs(Number(salt) || 0) * 101;
  return (base * 9301 + 49297) % 233280;
}

function buildGeneratedProduct(index, options = {}) {
  const categoriesPool = ["tecnologia", "electronica", "hogar", "casa", "automovil", "importados", "mascotas", "ropa", "juguetes", "productos"];
  const brandCatalog = [
    { marca: "Apple", modelos: ["iPhone 16", "iPhone 15", "iPhone 14", "iPhone 13"] },
    { marca: "Samsung", modelos: ["Galaxy S25", "Galaxy S24", "Galaxy A56", "Galaxy A36"] },
    { marca: "Xiaomi", modelos: ["Redmi Note 14", "Redmi Note 13", "Poco X7", "Poco M7"] },
    { marca: "Motorola", modelos: ["Moto G85", "Moto G75", "Edge 60", "Edge 50 Neo"] },
    { marca: "Infinix", modelos: ["Note 50 Pro", "Hot 70", "GT 20", "Smart 9"] },
    { marca: "Honor", modelos: ["Honor 200", "Honor X8b", "Honor Magic 7 Lite", "Honor 90"] },
    { marca: "Huawei", modelos: ["Nova 13", "Pura 70", "Mate 60", "Nova 12i"] },
    { marca: "Realme", modelos: ["Realme 12", "Realme C67", "Realme GT Neo", "Narzo 70"] },
    { marca: "Nokia", modelos: ["Nokia G42", "Nokia X30", "Nokia C32", "Nokia G22"] },
    { marca: "ZTE", modelos: ["Blade V60", "Nubia Neo", "Axon 50", "Blade A75"] }
  ];
  const storagePool = [64, 128, 256, 512];
  const ramPool = [4, 6, 8, 12, 16];
  const colorPool = ["Negro", "Azul", "Gris", "Verde", "Blanco", "Plata", "Rosa"];
  const screenPool = ["6.1", "6.5", "6.67", "6.7", "6.78"];
  const categoryOverride = String(options.category || "").trim().toLowerCase();
  const category = allowedCategories.includes(categoryOverride) ? categoryOverride : pickFrom(categoriesPool, index);

  const brandSeed = deterministic(index, 11);
  const brandEntry = pickFrom(brandCatalog, brandSeed);
  const model = pickFrom(brandEntry.modelos, deterministic(index, 17));
  const storage = Number(pickFrom(storagePool, deterministic(index, 23)));
  const ram = Number(pickFrom(ramPool, deterministic(index, 29)));
  const color = pickFrom(colorPool, deterministic(index, 31));
  const screen = pickFrom(screenPool, deterministic(index, 37));
  const skuCode = 100000 + index;

  const basePriceByBrand = {
    Apple: 14500,
    Samsung: 7800,
    Xiaomi: 4300,
    Motorola: 4700,
    Infinix: 3600,
    Honor: 6200,
    Huawei: 7400,
    Realme: 4100,
    Nokia: 3500,
    ZTE: 3300
  };
  const basePrice = basePriceByBrand[brandEntry.marca] || 4200;
  const ramFactor = ram * 180;
  const storageFactor = storage * 9;
  const dynamicFactor = deterministic(index, 41) % 1100;
  const price = Math.max(2299, Math.round(basePrice + ramFactor + storageFactor + dynamicFactor));
  const stock = clampInteger((deterministic(index, 43) % 120) + 1, 0, 9999, 30);
  const sold = clampInteger(deterministic(index, 47) % 300, 0, 999999, 0);
  const maybeDiscount = deterministic(index, 53) % 100;
  const discountPercent = maybeDiscount >= 62 ? 8 + (deterministic(index, 59) % 18) : 0;
  const discountedPrice = discountPercent > 0 ? Math.max(1, Math.round(price * (1 - discountPercent / 100))) : 0;
  const includeImages = options.includeImages !== false;
  const encodedLabel = encodeURIComponent(`${model} ${storage}GB ${color}`);
  const imageUrl = includeImages ? `https://placehold.co/1200x1200/0b1220/e2e8f0?text=${encodedLabel}` : "";
  const shippingWindow = 2 + (deterministic(index, 61) % 4);

  return {
    nombre: `${model} ${storage}GB ${ram}GB RAM ${color}`,
    slug: `${normalizeSlug(`${brandEntry.marca}-${model}-${storage}gb-${ram}gb-${color}`)}-${skuCode}`,
    descripcion: `${brandEntry.marca} ${model} con almacenamiento de ${storage}GB y memoria RAM de ${ram}GB. Equipo equilibrado para productividad, contenido multimedia, compras y uso diario con un rendimiento estable.`,
    descripcionCorta: `${model} con ${storage}GB, ${ram}GB RAM y pantalla de ${screen} pulgadas.`,
    marca: brandEntry.marca,
    precio: price,
    precioDescuento: discountedPrice,
    stock,
    vendidos: sold,
    categoria: category,
    tags: [brandEntry.marca.toLowerCase(), model.toLowerCase(), `${storage}gb`, `${ram}gb ram`, "smartphone", category],
    imagenes: imageUrl ? [imageUrl] : [],
    caracteristicas: [
      `Pantalla de ${screen} pulgadas`,
      `Almacenamiento interno de ${storage}GB`,
      `Memoria RAM de ${ram}GB`,
      "Bluetooth y GPS integrados",
      "Bateria de larga duracion",
      "Equipo compatible con uso diario y entretenimiento"
    ],
    disponibilidad: stock > 0 ? "Disponible" : "Agotado",
    infoEnvio: "Envio seguro con rastreo en cada etapa del pedido.",
    fechaEstimada: `Entrega estimada de ${shippingWindow} a ${shippingWindow + 2} dias habiles.`,
    garantia: "Garantia por defectos de fabrica.",
    devolucion: "Aplica conforme a politicas vigentes de la tienda.",
    envioGratis: false,
    mostrarEnvioGratis: false
  };
}

function generateOrderId() {
  const random = crypto.randomUUID().slice(0, 8);
  return `ord_${Date.now()}_${random}`;
}

function getAdminEmail(env) {
  return String(env.ADMIN_EMAIL || "admin@marketzone.mx").trim().toLowerCase();
}

function getAdminPassword(env) {
  return String(env.ADMIN_PASSWORD || "Admin123!").trim();
}

export function serializeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    role: row.role,
    nombre: row.nombre,
    email: row.email,
    isActive: Boolean(Number(row.is_active ?? 1)),
    telefono: row.telefono || "",
    nickname: row.nickname || "",
    avatarUrl: row.avatar_url || "",
    geoMeta: parseJson(row.geo_meta, {}),
    direccion: parseJson(row.direccion, {})
  };
}

export function serializeProduct(row) {
  const precioBase = Number(row.precio);
  const precioDescuento = Number(row.precio_descuento || 0);
  const descuentoActivo = Number.isFinite(precioDescuento) && precioDescuento > 0 && precioDescuento < precioBase;

  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    descripcion: row.descripcion,
    descripcionCorta: row.descripcion_corta || "",
    marca: row.marca || "",
    precio: descuentoActivo ? precioDescuento : precioBase,
    precioOriginal: descuentoActivo ? precioBase : 0,
    precioDescuento: descuentoActivo ? precioDescuento : 0,
    descuentoActivo,
    oferta: descuentoActivo,
    descuento: descuentoActivo && precioBase > 0 ? Math.round(((precioBase - precioDescuento) / precioBase) * 100) : 0,
    stock: Number(row.stock),
    vendidos: Number(row.vendidos || 0),
    categoria: row.categoria,
    tags: parseJson(row.tags, []),
    imagenes: parseJson(row.imagenes, []),
    caracteristicas: parseJson(row.caracteristicas, []),
    vendedorOficial: row.vendedor_oficial || "",
    mostrarSelloOficial: Boolean(Number(row.mostrar_sello_oficial || 0)),
    envioGratis: Boolean(Number(row.envio_gratis || 0)),
    mostrarEnvioGratis: Boolean(Number(row.mostrar_envio_gratis || 0)),
    disponibilidad: row.disponibilidad || (Number(row.stock || 0) > 0 ? "Disponible" : "Agotado"),
    infoEnvio: row.info_envio || "",
    fechaEstimada: row.fecha_estimada || "",
    garantia: row.garantia || "",
    devolucion: row.devolucion || "",
    ratingPromedio: Number(row.rating_promedio || 0),
    ratingTotal: Number(row.rating_total || 0)
  };
}

function serializeChatMessage(row) {
  return {
    id: Number(row.id),
    usuarioId: Number(row.user_id),
    rolRemitente: String(row.sender_role || "customer"),
    mensaje: String(row.mensaje || ""),
    leido: Boolean(Number(row.leido || 0)),
    fecha: row.created_at
  };
}

export async function createChatMessage(db, { userId, senderRole, mensaje }) {
  const payload = String(mensaje || "").trim();
  if (!payload) {
    throw new Error("El mensaje no puede ir vacio.");
  }

  await db
    .prepare(
      `
      INSERT INTO messages (user_id, sender_role, mensaje, leido, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `
    )
    .bind(
      Number(userId),
      String(senderRole || "customer"),
      payload,
      senderRole === "admin" || senderRole === "bot" ? 1 : 0
    )
    .run();

  const created = await db.prepare("SELECT * FROM messages WHERE id = last_insert_rowid()").first();
  return serializeChatMessage(created);
}

export async function listChatMessagesByUser(db, userId) {
  const result = await db
    .prepare(
      `
      SELECT *
      FROM messages
      WHERE user_id = ?
      ORDER BY datetime(created_at) ASC, id ASC
      LIMIT 400
    `
    )
    .bind(Number(userId))
    .all();

  return (result.results || []).map(serializeChatMessage);
}

export async function listChatThreads(db) {
  const result = await db
    .prepare(
      `
      SELECT
        u.id AS user_id,
        u.nombre,
        u.email,
        MAX(m.created_at) AS ultima_fecha,
        (
          SELECT m2.mensaje
          FROM messages m2
          WHERE m2.user_id = u.id
          ORDER BY datetime(m2.created_at) DESC, m2.id DESC
          LIMIT 1
        ) AS ultimo_mensaje,
        SUM(CASE WHEN m.sender_role = 'customer' AND m.leido = 0 THEN 1 ELSE 0 END) AS pendientes
      FROM messages m
      INNER JOIN users u ON u.id = m.user_id
      GROUP BY u.id, u.nombre, u.email
      ORDER BY datetime(ultima_fecha) DESC
    `
    )
    .all();

  return (result.results || []).map((row) => ({
    usuarioId: Number(row.user_id),
    nombre: row.nombre,
    email: row.email,
    ultimoMensaje: row.ultimo_mensaje || "",
    ultimaFecha: row.ultima_fecha || "",
    pendientes: Number(row.pendientes || 0)
  }));
}

async function ensureColumn(db, tableName, columnName, definition) {
  const columns = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = (columns.results || []).some((column) => column.name === columnName);

  if (!exists) {
    await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
}

async function seedDatabase(db, env) {
  const shouldSeedProducts = String(env?.SEED_PRODUCTS || "").toLowerCase() === "true";

  if (shouldSeedProducts && seedProducts.length) {
    for (const product of seedProducts) {
      const existing = await db.prepare("SELECT id FROM products WHERE slug = ?").bind(product.slug).first();

      if (existing) {
        continue;
      }

      await createProduct(db, product);
    }
  }

  const adminEmail = getAdminEmail(env);
  const existingAdmin = await db.prepare("SELECT id FROM users WHERE email = ?").bind(adminEmail).first();

  if (!existingAdmin) {
    const passwordHash = await hashPassword(getAdminPassword(env));
    await restoreAdminUser(db, {
      email: adminEmail,
      nombre: "Administrador Gray C Shop",
      passwordHash,
      resetPassword: true
    });
  }

  for (const [key, value] of Object.entries(defaultSiteContent)) {
    const existing = await db.prepare("SELECT clave FROM site_content WHERE clave = ?").bind(key).first();

    if (!existing) {
      await db
        .prepare(
          `
          INSERT INTO site_content (clave, valor)
          VALUES (?, ?)
        `
        )
        .bind(key, JSON.stringify(value))
        .run();
    }
  }
}

export async function ensureDatabase(env) {
  if (!env.DB) {
    throw new Error("Falta la vinculacion D1 'DB' en Cloudflare Pages.");
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      for (const statement of schemaStatements) {
        await env.DB.prepare(statement.trim()).run();
      }

      await ensureColumn(env.DB, "products", "caracteristicas", "TEXT NOT NULL DEFAULT '[]'");
      await ensureColumn(env.DB, "products", "descripcion_corta", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "marca", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "disponibilidad", "TEXT NOT NULL DEFAULT 'Disponible'");
      await ensureColumn(env.DB, "products", "info_envio", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "fecha_estimada", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "garantia", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "devolucion", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "vendedor_oficial", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "mostrar_sello_oficial", "INTEGER NOT NULL DEFAULT 0");
      await ensureColumn(env.DB, "products", "envio_gratis", "INTEGER NOT NULL DEFAULT 0");
      await ensureColumn(env.DB, "products", "mostrar_envio_gratis", "INTEGER NOT NULL DEFAULT 0");
      await ensureColumn(env.DB, "products", "precio_descuento", "REAL NOT NULL DEFAULT 0");
      await ensureColumn(env.DB, "products", "vendidos", "INTEGER NOT NULL DEFAULT 0");
      await ensureColumn(env.DB, "order_items", "estado", "TEXT NOT NULL DEFAULT 'pendiente'");
      await ensureColumn(env.DB, "order_items", "updated_at", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "orders", "tracking", "TEXT NOT NULL DEFAULT '[]'");
      await ensureColumn(env.DB, "users", "telefono", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "users", "is_active", "INTEGER NOT NULL DEFAULT 1");
      await ensureColumn(env.DB, "users", "nickname", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "users", "avatar_url", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "users", "geo_meta", "TEXT NOT NULL DEFAULT '{}'");
      await ensureColumn(env.DB, "product_comments", "reviewer_name", "TEXT NOT NULL DEFAULT ''");
      await seedDatabase(env.DB, env);
    })().catch((error) => {
      bootstrapPromise = undefined;
      throw error;
    });
  }

  await bootstrapPromise;
  return env.DB;
}

export async function getUserByEmail(db, email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").bind(String(email || "").trim().toLowerCase()).first();
}

export async function getUserById(db, userId) {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
}

export async function restoreAdminUser(db, { email, nombre = "Administrador Gray C Shop", passwordHash, resetPassword = true }) {
  const adminEmail = String(email || "").trim().toLowerCase();
  const adminName = String(nombre || "Administrador Gray C Shop").trim();
  const existing = await getUserByEmail(db, adminEmail);
  const address = JSON.stringify({
    calle: "Av. Reforma 100",
    ciudad: "Ciudad de Mexico",
    estado: "CDMX",
    cp: "06600",
    pais: "MX"
  });

  if (!adminEmail || !passwordHash) {
    throw new Error("Email y contrasena de administrador son obligatorios.");
  }

  if (existing) {
    const passwordAssignment = resetPassword ? ", password_hash = ?" : "";
    const statement = `
      UPDATE users
      SET role = 'admin', nombre = ?, is_active = 1${passwordAssignment}
      WHERE email = ?
    `;
    const binding = resetPassword ? [adminName, passwordHash, adminEmail] : [adminName, adminEmail];

    await db.prepare(statement).bind(...binding).run();
    return getUserByEmail(db, adminEmail);
  }

  const result = await db
    .prepare(
      `
      INSERT INTO users (role, nombre, email, password_hash, telefono, nickname, avatar_url, geo_meta, direccion, is_active)
      VALUES ('admin', ?, ?, ?, '', '', '', '{}', ?, 1)
    `
    )
    .bind(adminName, adminEmail, passwordHash, address)
    .run();

  return getUserById(db, result.meta.last_row_id);
}

export async function saveRegistrationCode(db, email, payload, code, expiresAtIso) {
  await db
    .prepare(
      `
      INSERT INTO registration_codes (email, payload, code, expires_at, attempts, created_at)
      VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        payload = excluded.payload,
        code = excluded.code,
        expires_at = excluded.expires_at,
        attempts = 0,
        created_at = CURRENT_TIMESTAMP
    `
    )
    .bind(String(email || "").trim().toLowerCase(), JSON.stringify(payload || {}), String(code || ""), String(expiresAtIso || ""))
    .run();
}

export async function getRegistrationCode(db, email) {
  return db
    .prepare("SELECT * FROM registration_codes WHERE email = ?")
    .bind(String(email || "").trim().toLowerCase())
    .first();
}

export async function bumpRegistrationCodeAttempt(db, email) {
  await db
    .prepare("UPDATE registration_codes SET attempts = attempts + 1 WHERE email = ?")
    .bind(String(email || "").trim().toLowerCase())
    .run();
}

export async function deleteRegistrationCode(db, email) {
  await db
    .prepare("DELETE FROM registration_codes WHERE email = ?")
    .bind(String(email || "").trim().toLowerCase())
    .run();
}

async function findUserByNickname(db, nickname) {
  const value = String(nickname || "").trim().toLowerCase();

  if (!value) {
    return null;
  }

  return db.prepare("SELECT id, nickname FROM users WHERE LOWER(nickname) = ?").bind(value).first();
}

export async function isNicknameAvailable(db, nickname, excludeUserId = 0) {
  const existing = await findUserByNickname(db, nickname);
  return !existing || Number(existing.id) === Number(excludeUserId || 0);
}

export async function createUser(db, { nombre, email, passwordHash, telefono = "", nickname = "", avatarUrl = "", direccion = {}, geoMeta = {} }) {
  const cleanNickname = String(nickname || "").trim();

  if (cleanNickname && !(await isNicknameAvailable(db, cleanNickname))) {
    throw new Error("Ese nickname ya esta utilizado.");
  }

  const response = await db
    .prepare(
      `
      INSERT INTO users (nombre, email, password_hash, telefono, nickname, avatar_url, geo_meta, direccion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      nombre,
      String(email).trim().toLowerCase(),
      passwordHash,
      String(telefono || "").trim(),
      cleanNickname,
      String(avatarUrl || "").trim(),
      JSON.stringify(geoMeta || {}),
      JSON.stringify(direccion || {})
    )
    .run();

  return getUserById(db, response.meta.last_row_id);
}

export async function updateUserAddress(db, userId, direccion, telefono, extras = {}) {
  const nickname = extras?.nickname !== undefined ? String(extras.nickname || "").trim() : null;
  const avatarUrl = extras?.avatarUrl !== undefined ? String(extras.avatarUrl || "").trim() : null;
  const geoMeta = extras?.geoMeta !== undefined ? JSON.stringify(extras.geoMeta || {}) : null;

  if (nickname && !(await isNicknameAvailable(db, nickname, userId))) {
    throw new Error("Ese nickname ya esta utilizado.");
  }

  await db
    .prepare(
      `
      UPDATE users
      SET
        direccion = ?,
        telefono = COALESCE(?, telefono),
        nickname = COALESCE(?, nickname),
        avatar_url = COALESCE(?, avatar_url),
        geo_meta = COALESCE(?, geo_meta)
      WHERE id = ?
    `
    )
    .bind(
      JSON.stringify(direccion || {}),
      telefono !== undefined ? String(telefono || "").trim() : null,
      nickname,
      avatarUrl,
      geoMeta,
      userId
    )
    .run();

  return getUserById(db, userId);
}

export async function recordSearch(db, userId, search) {
  const value = String(search || "").trim();

  if (!userId || !value) {
    return;
  }

  await db.prepare("INSERT INTO search_history (user_id, busqueda) VALUES (?, ?)").bind(userId, value).run();
}

export async function recordProductView(db, userId, productId) {
  if (!userId || !productId) {
    return;
  }

  await db.prepare("INSERT INTO product_views (user_id, product_id) VALUES (?, ?)").bind(userId, productId).run();
}

export async function listProducts(db, filters = {}) {
  const clauses = [];
  const bindings = [];
  const minPrice = Number(filters.minPrice);
  const maxPrice = Number(filters.maxPrice);

  if (filters.search) {
    const terms = String(filters.search)
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 8);

    for (const term of terms) {
      clauses.push(
        "(LOWER(nombre) LIKE ? OR LOWER(descripcion) LIKE ? OR LOWER(descripcion_corta) LIKE ? OR LOWER(marca) LIKE ? OR LOWER(categoria) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(vendedor_oficial) LIKE ?)"
      );
      bindings.push(...Array.from({ length: 7 }, () => `%${term}%`));
    }
  }

  if (filters.category) {
    clauses.push("categoria = ?");
    bindings.push(filters.category);
  }

  if (filters.minPrice !== undefined && filters.minPrice !== "" && Number.isFinite(minPrice)) {
    clauses.push("precio >= ?");
    bindings.push(minPrice);
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== "" && Number.isFinite(maxPrice)) {
    clauses.push("precio <= ?");
    bindings.push(maxPrice);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const aliasedWhereClause = whereClause
    ? whereClause
        .replace(/\bdescripcion_corta\b/g, "p.descripcion_corta")
        .replace(/\bvendedor_oficial\b/g, "p.vendedor_oficial")
        .replace(/\bdescripcion\b/g, "p.descripcion")
        .replace(/\bcategoria\b/g, "p.categoria")
        .replace(/\bnombre\b/g, "p.nombre")
        .replace(/\bmarca\b/g, "p.marca")
        .replace(/\btags\b/g, "p.tags")
        .replace(/\bprecio\b/g, "p.precio")
    : "";
  const limit = Number.isFinite(Number(filters.limit)) && Number(filters.limit) > 0 ? Number(filters.limit) : 24;
  const countSql = `SELECT COUNT(*) AS total FROM products ${whereClause}`;
  const itemsSql = `
    SELECT
      p.*,
      COALESCE(AVG(pc.rating), 0) AS rating_promedio,
      COUNT(pc.id) AS rating_total
    FROM products p
    LEFT JOIN product_comments pc ON pc.product_id = p.id
    ${aliasedWhereClause}
    GROUP BY p.id
    ORDER BY p.id DESC
    LIMIT ?
  `;

  const countRow = await db.prepare(countSql).bind(...bindings).first();
  const itemsResult = await db.prepare(itemsSql).bind(...bindings, limit).all();

  return {
    items: (itemsResult.results || []).map(serializeProduct),
    pagination: {
      total: Number(countRow?.total || 0),
      limit
    }
  };
}

export async function listAdminProducts(db) {
  const result = await db
    .prepare(
      `
      SELECT
        p.*,
        COALESCE(AVG(pc.rating), 0) AS rating_promedio,
        COUNT(pc.id) AS rating_total
      FROM products p
      LEFT JOIN product_comments pc ON pc.product_id = p.id
      GROUP BY p.id
      ORDER BY p.id DESC
    `
    )
    .all();
  return (result.results || []).map(serializeProduct);
}

export async function getProductById(db, productId) {
  const row = await db
    .prepare(
      `
      SELECT
        p.*,
        COALESCE(AVG(pc.rating), 0) AS rating_promedio,
        COUNT(pc.id) AS rating_total
      FROM products p
      LEFT JOIN product_comments pc ON pc.product_id = p.id
      WHERE p.id = ? OR p.slug = ?
      GROUP BY p.id
    `
    )
    .bind(productId, String(productId || "").trim())
    .first();
  return row ? serializeProduct(row) : null;
}

export async function createProduct(db, input) {
  const nombre = String(input.nombre || "").trim();
  const descripcion = String(input.descripcion || "").trim();
  const descripcionCorta = String(input.descripcionCorta || "").trim();
  const marca = String(input.marca || "").trim();
  const categoria = String(input.categoria || "").trim().toLowerCase();
  const precio = Number(input.precio);
  const stock = Number(input.stock);
  const vendidos = Number(input.vendidos || 0);
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : String(input.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
  const imagenes = Array.isArray(input.imagenes)
    ? input.imagenes.map((image) => String(image).trim()).filter(Boolean)
    : String(input.imagenes || "")
        .split(/\r?\n|,/)
        .map((image) => image.trim())
        .filter(Boolean);
  const caracteristicas = Array.isArray(input.caracteristicas)
    ? input.caracteristicas.map((item) => String(item).trim()).filter(Boolean)
    : String(input.caracteristicas || "")
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
  const envioGratis = input.envioGratis === true || input.envioGratis === "true" || input.envioGratis === "on" || Number(input.envioGratis) === 1;
  const mostrarEnvioGratis =
    input.mostrarEnvioGratis === true ||
    input.mostrarEnvioGratis === "true" ||
    input.mostrarEnvioGratis === "on" ||
    Number(input.mostrarEnvioGratis) === 1;
  const precioDescuento = Number(input.precioDescuento || 0);
  const disponibilidad = String(input.disponibilidad || (stock > 0 ? "Disponible" : "Agotado")).trim();
  const infoEnvio = String(input.infoEnvio || "").trim();
  const fechaEstimada = String(input.fechaEstimada || "").trim();
  const garantia = String(input.garantia || "").trim();
  const devolucion = String(input.devolucion || "").trim();
  const vendedorOficial = String(input.vendedorOficial || "").trim();
  const mostrarSelloOficial =
    input.mostrarSelloOficial === true ||
    input.mostrarSelloOficial === "true" ||
    input.mostrarSelloOficial === "on" ||
    Number(input.mostrarSelloOficial) === 1;

  if (!nombre || !descripcion || !allowedCategories.includes(categoria)) {
    throw new Error("Completa nombre, descripcion y una categoria valida.");
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error("Ingresa un precio valido.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Ingresa un stock valido.");
  }
  if (!Number.isFinite(vendidos) || vendidos < 0) {
    throw new Error("Ingresa una cantidad valida de vendidos.");
  }

  if (Number.isFinite(precioDescuento) && precioDescuento < 0) {
    throw new Error("Ingresa un descuento valido.");
  }

  const baseSlug = normalizeSlug(input.slug || nombre) || `producto-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await db.prepare("SELECT id FROM products WHERE slug = ?").bind(slug).first()) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const response = await db
    .prepare(
      `
      INSERT INTO products (
        slug, nombre, descripcion, descripcion_corta, marca, precio, stock, vendidos, categoria, tags, imagenes, caracteristicas,
        disponibilidad, info_envio, fecha_estimada, garantia, devolucion, vendedor_oficial, mostrar_sello_oficial, envio_gratis, mostrar_envio_gratis, precio_descuento
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      slug,
      nombre,
      descripcion,
      descripcionCorta,
      marca,
      precio,
      stock,
      vendidos,
      categoria,
      JSON.stringify(tags),
      JSON.stringify(imagenes),
      JSON.stringify(caracteristicas),
      disponibilidad,
      infoEnvio,
      fechaEstimada,
      garantia,
      devolucion,
      vendedorOficial,
      mostrarSelloOficial ? 1 : 0,
      envioGratis ? 1 : 0,
      mostrarEnvioGratis ? 1 : 0,
      Number.isFinite(precioDescuento) && precioDescuento > 0 && precioDescuento < precio ? precioDescuento : 0
    )
    .run();

  return getProductById(db, response.meta.last_row_id);
}

export async function bulkCreateProducts(db, items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      created: 0,
      failed: 0,
      errors: []
    };
  }

  let created = 0;
  const errors = [];

  for (let index = 0; index < items.length; index += 1) {
    try {
      await createProduct(db, items[index]);
      created += 1;
    } catch (err) {
      errors.push({
        index,
        message: err instanceof Error ? err.message : "No se pudo crear el producto."
      });
    }
  }

  return {
    created,
    failed: items.length - created,
    errors
  };
}

export async function generateCatalogProducts(db, options = {}) {
  const count = clampInteger(options.count, 1, 500, 100);
  const offset = clampInteger(options.offset, 0, 99999999, 0);
  const includeImages = options.includeImages !== false;
  const category = String(options.category || "").trim().toLowerCase();
  const rows = [];

  for (let step = 0; step < count; step += 1) {
    rows.push(
      buildGeneratedProduct(offset + step, {
        category,
        includeImages
      })
    );
  }

  const result = await bulkCreateProducts(db, rows);
  return {
    ...result,
    nextOffset: offset + count
  };
}

export async function updateProduct(db, productId, input) {
  const existing = await getProductById(db, productId);

  if (!existing) {
    throw new Error("El producto no existe.");
  }

  const nombre = String(input.nombre ?? existing.nombre).trim();
  const descripcion = String(input.descripcion ?? existing.descripcion).trim();
  const descripcionCorta = String(input.descripcionCorta ?? existing.descripcionCorta ?? "").trim();
  const marca = String(input.marca ?? existing.marca ?? "").trim();
  const categoria = String(input.categoria ?? existing.categoria).trim().toLowerCase();
  const precio = Number(input.precio ?? existing.precio);
  const stock = Number(input.stock ?? existing.stock);
  const vendidos = Number(input.vendidos ?? existing.vendidos ?? 0);
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : input.tags !== undefined
      ? String(input.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : existing.tags;
  const imagenes = Array.isArray(input.imagenes)
    ? input.imagenes.map((image) => String(image).trim()).filter(Boolean)
    : input.imagenes !== undefined
      ? String(input.imagenes || "")
          .split(/\r?\n|,/)
          .map((image) => image.trim())
          .filter(Boolean)
      : existing.imagenes;
  const caracteristicas = Array.isArray(input.caracteristicas)
    ? input.caracteristicas.map((item) => String(item).trim()).filter(Boolean)
    : input.caracteristicas !== undefined
      ? String(input.caracteristicas || "")
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean)
      : existing.caracteristicas;
  const envioGratis =
    input.envioGratis !== undefined
      ? input.envioGratis === true || input.envioGratis === "true" || input.envioGratis === "on" || Number(input.envioGratis) === 1
      : existing.envioGratis;
  const mostrarEnvioGratis =
    input.mostrarEnvioGratis !== undefined
      ? input.mostrarEnvioGratis === true ||
        input.mostrarEnvioGratis === "true" ||
        input.mostrarEnvioGratis === "on" ||
        Number(input.mostrarEnvioGratis) === 1
      : existing.mostrarEnvioGratis;
  const precioDescuento = input.precioDescuento !== undefined ? Number(input.precioDescuento || 0) : Number(existing.precioDescuento || 0);
  const disponibilidad = String(input.disponibilidad ?? existing.disponibilidad ?? (stock > 0 ? "Disponible" : "Agotado")).trim();
  const infoEnvio = String(input.infoEnvio ?? existing.infoEnvio ?? "").trim();
  const fechaEstimada = String(input.fechaEstimada ?? existing.fechaEstimada ?? "").trim();
  const garantia = String(input.garantia ?? existing.garantia ?? "").trim();
  const devolucion = String(input.devolucion ?? existing.devolucion ?? "").trim();
  const vendedorOficial = String(input.vendedorOficial ?? existing.vendedorOficial ?? "").trim();
  const mostrarSelloOficial =
    input.mostrarSelloOficial !== undefined
      ? input.mostrarSelloOficial === true ||
        input.mostrarSelloOficial === "true" ||
        input.mostrarSelloOficial === "on" ||
        Number(input.mostrarSelloOficial) === 1
      : existing.mostrarSelloOficial;

  if (!nombre || !descripcion || !allowedCategories.includes(categoria)) {
    throw new Error("Completa nombre, descripcion y una categoria valida.");
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error("Ingresa un precio valido.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Ingresa un stock valido.");
  }
  if (!Number.isFinite(vendidos) || vendidos < 0) {
    throw new Error("Ingresa una cantidad valida de vendidos.");
  }

  if (!Number.isFinite(precioDescuento) || precioDescuento < 0) {
    throw new Error("Ingresa un descuento valido.");
  }

  const incomingSlug = normalizeSlug(input.slug || nombre) || existing.slug;
  let slug = incomingSlug;
  let suffix = 1;

  while (true) {
    const duplicate = await db.prepare("SELECT id FROM products WHERE slug = ?").bind(slug).first();

    if (!duplicate || Number(duplicate.id) === Number(productId)) {
      break;
    }

    suffix += 1;
    slug = `${incomingSlug}-${suffix}`;
  }

  await db
    .prepare(
      `
      UPDATE products
      SET slug = ?, nombre = ?, descripcion = ?, descripcion_corta = ?, marca = ?, precio = ?, stock = ?, vendidos = ?, categoria = ?, tags = ?, imagenes = ?, caracteristicas = ?, disponibilidad = ?, info_envio = ?, fecha_estimada = ?, garantia = ?, devolucion = ?, vendedor_oficial = ?, mostrar_sello_oficial = ?, envio_gratis = ?, mostrar_envio_gratis = ?, precio_descuento = ?
      WHERE id = ?
    `
    )
    .bind(
      slug,
      nombre,
      descripcion,
      descripcionCorta,
      marca,
      precio,
      stock,
      vendidos,
      categoria,
      JSON.stringify(tags),
      JSON.stringify(imagenes),
      JSON.stringify(caracteristicas),
      disponibilidad,
      infoEnvio,
      fechaEstimada,
      garantia,
      devolucion,
      vendedorOficial,
      mostrarSelloOficial ? 1 : 0,
      envioGratis ? 1 : 0,
      mostrarEnvioGratis ? 1 : 0,
      precioDescuento > 0 && precioDescuento < precio ? precioDescuento : 0,
      productId
    )
    .run();

  return getProductById(db, productId);
}

export async function deleteProduct(db, productId) {
  await db.prepare("DELETE FROM cart_items WHERE product_id = ?").bind(productId).run();
  await db.prepare("DELETE FROM product_views WHERE product_id = ?").bind(productId).run();
  await db.prepare("DELETE FROM products WHERE id = ?").bind(productId).run();
}

export async function clearAllProducts(db) {
  await db.prepare("DELETE FROM cart_items").run();
  await db.prepare("DELETE FROM product_views").run();
  await db.prepare("DELETE FROM products").run();
}

export async function setCartItem(db, userId, productId, cantidad, options = {}) {
  const nextQuantity = Number(cantidad || 0);
  const increment = Boolean(options.increment);

  if (nextQuantity <= 0) {
    await db.prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?").bind(userId, productId).run();
    return;
  }

  const existing = await db.prepare("SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?").bind(userId, productId).first();

  if (existing) {
    if (increment) {
      await db
        .prepare("UPDATE cart_items SET cantidad = cantidad + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?")
        .bind(nextQuantity, userId, productId)
        .run();
      return;
    }

    await db
      .prepare("UPDATE cart_items SET cantidad = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?")
      .bind(nextQuantity, userId, productId)
      .run();
    return;
  }

  await db.prepare("INSERT INTO cart_items (user_id, product_id, cantidad) VALUES (?, ?, ?)").bind(userId, productId, nextQuantity).run();
}

export async function getCartState(db, userId) {
  const result = await db
    .prepare(
      `
      SELECT
        c.product_id AS productoId,
        c.cantidad,
        p.nombre,
        p.descripcion,
        p.categoria,
        p.precio,
        p.precio_descuento,
        p.stock,
        p.imagenes
      FROM cart_items c
      INNER JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC, c.id DESC
    `
    )
    .bind(userId)
    .all();

  const items = (result.results || []).map((row) => {
    const precioNormal = Number(row.precio);
    const precioConDescuento = Number(row.precio_descuento || 0);
    const precio =
      Number.isFinite(precioConDescuento) && precioConDescuento > 0 && precioConDescuento < precioNormal
        ? precioConDescuento
        : precioNormal;
    const cantidad = Number(row.cantidad);

    return {
      productoId: Number(row.productoId),
      cantidad,
      nombre: row.nombre,
      descripcion: row.descripcion,
      categoria: row.categoria,
      precio,
      precioOriginal: precio !== precioNormal ? precioNormal : 0,
      subtotal: precio * cantidad,
      stock: Number(row.stock),
      imagenes: parseJson(row.imagenes, [])
    };
  });

  return {
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0)
  };
}

export async function buildCheckoutSummary(db, userId) {
  const cart = await getCartState(db, userId);

  return {
    items: cart.items.map((item) => ({
      productoId: item.productoId,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.subtotal
    })),
    total: cart.total
  };
}

export async function createOrderFromCart(db, userId, { direccion, proveedorPago, telefono = "" }) {
  const summary = await buildCheckoutSummary(db, userId);

  if (!summary.items.length) {
    throw new Error("Tu carrito esta vacio.");
  }

  const orderId = generateOrderId();

  const initialTracking = [
    {
      title: "Pedido recibido",
      location: direccion?.ciudad || direccion?.pais || "Centro de pedidos",
      note: "Tu compra fue registrada correctamente.",
      date: new Date().toISOString(),
      completed: true
    }
  ];

  await db
    .prepare(
      `
      INSERT INTO orders (id, user_id, total, estado, proveedor_pago, direccion, tracking)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      orderId,
      userId,
      summary.total,
      "pending_payment",
      proveedorPago,
      JSON.stringify(direccion || {}),
      JSON.stringify(initialTracking)
    )
    .run();

  for (const item of summary.items) {
    await db
      .prepare(
        `
        INSERT INTO order_items (order_id, product_id, nombre, precio, cantidad, estado, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
      .bind(orderId, item.productoId, item.nombre, item.precio, item.cantidad, "pendiente")
      .run();
  }

  await updateUserAddress(db, userId, direccion, telefono);
  await clearCart(db, userId);

  return {
    order: {
      id: orderId,
      total: summary.total,
        estado: "pending_payment",
        proveedorPago,
        tracking: initialTracking,
        items: summary.items
      }
  };
}

export async function getOrderById(db, orderId) {
  return db.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
}

export async function getOrderWithItems(db, orderId) {
  const order = await getOrderById(db, orderId);

  if (!order) {
    return null;
  }

  const items = await db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC").bind(orderId).all();

  return {
    ...order,
    total: Number(order.total),
    direccion: parseJson(order.direccion, {}),
    tracking: parseJson(order.tracking, []),
    items: (items.results || []).map((item) => ({
      id: Number(item.id),
      productoId: Number(item.product_id),
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad),
      estado: item.estado || "pendiente"
    }))
  };
}

export async function savePaymentRecord(db, { orderId, provider, status, externalId = "", approvalUrl = "", payload = "" }) {
  const existing = await db.prepare("SELECT id FROM payments WHERE order_id = ? AND provider = ?").bind(orderId, provider).first();

  if (existing) {
    await db
      .prepare(
        `
        UPDATE payments
        SET status = ?, external_id = ?, approval_url = ?, payload = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .bind(status, externalId, approvalUrl, payload, existing.id)
      .run();
    return;
  }

  await db
    .prepare(
      `
      INSERT INTO payments (order_id, provider, status, external_id, approval_url, payload)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .bind(orderId, provider, status, externalId, approvalUrl, payload)
    .run();
}

export async function markOrderStatus(db, orderId, status, paymentReference = "") {
  await db
    .prepare(
      `
      UPDATE orders
      SET estado = ?, payment_reference = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    )
    .bind(status, paymentReference, orderId)
    .run();
}

export async function clearCart(db, userId) {
  await db.prepare("DELETE FROM cart_items WHERE user_id = ?").bind(userId).run();
}

export async function decrementStockForOrder(db, orderId) {
  const items = await db.prepare("SELECT product_id, cantidad FROM order_items WHERE order_id = ?").bind(orderId).all();

  for (const item of items.results || []) {
    await db
      .prepare(
        `
        UPDATE products
        SET stock = CASE
          WHEN stock - ? < 0 THEN 0
          ELSE stock - ?
        END
        WHERE id = ?
      `
      )
      .bind(Number(item.cantidad), Number(item.cantidad), Number(item.product_id))
      .run();
  }
}

export async function getUserDashboard(db, userId) {
  const user = await getUserById(db, userId);
  const orders = await db
    .prepare("SELECT id, total, estado, proveedor_pago, direccion, tracking, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10")
    .bind(userId)
    .all();
  const orderRows = orders.results || [];
  const orderItems = orderRows.length
    ? await db
        .prepare(
          `
          SELECT id, order_id, product_id, nombre, precio, cantidad, estado
          FROM order_items
          WHERE order_id IN (${orderRows.map(() => "?").join(",")})
          ORDER BY id ASC
        `
        )
        .bind(...orderRows.map((order) => order.id))
        .all()
    : { results: [] };
  const itemsByOrder = new Map();

  for (const item of orderItems.results || []) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push({
      id: Number(item.id),
      productoId: Number(item.product_id),
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad),
      estado: item.estado || "pendiente"
    });
    itemsByOrder.set(item.order_id, list);
  }
  const searches = await db
    .prepare("SELECT busqueda, fecha FROM search_history WHERE user_id = ? ORDER BY fecha DESC LIMIT 10")
    .bind(userId)
    .all();
  const views = await db
    .prepare(
      `
      SELECT pv.fecha, p.nombre
      FROM product_views pv
      INNER JOIN products p ON p.id = pv.product_id
      WHERE pv.user_id = ?
      ORDER BY pv.fecha DESC
      LIMIT 10
    `
    )
    .bind(userId)
    .all();

  return {
    user: serializeUser(user),
    historial: {
      ordenes: orderRows.map((item) => ({
        id: item.id,
        total: Number(item.total),
        estado: item.estado,
        paymentStatus: item.estado,
        proveedorPago: item.proveedor_pago,
        direccion: parseJson(item.direccion, {}),
        direccionEnvio: parseJson(item.direccion, {}),
        tracking: parseJson(item.tracking, []),
        fecha: item.created_at,
        items: itemsByOrder.get(item.id) || []
      })),
      busquedas: (searches.results || []).map((item) => ({
        id: `${item.fecha}-${item.busqueda}`,
        busqueda: item.busqueda,
        fecha: item.fecha
      })),
      productosVistos: (views.results || []).map((item) => ({
        id: `${item.fecha}-${item.nombre}`,
        fecha: item.fecha,
        producto: {
          nombre: item.nombre,
          slug: normalizeSlug(item.nombre)
        }
      })),
      favoritos: []
    }
  };
}

export async function listAdminOrders(db) {
  const orders = await db
    .prepare(
      `
      SELECT o.*, u.nombre AS usuario_nombre, u.email AS usuario_email, u.telefono AS usuario_telefono
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 80
    `
    )
    .all();
  const orderRows = orders.results || [];

  if (!orderRows.length) {
    return [];
  }

  const items = await db
    .prepare(
      `
      SELECT oi.*
      FROM order_items oi
      WHERE oi.order_id IN (${orderRows.map(() => "?").join(",")})
      ORDER BY oi.id ASC
    `
    )
    .bind(...orderRows.map((order) => order.id))
    .all();
  const itemsByOrder = new Map();

  for (const item of items.results || []) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push({
      id: Number(item.id),
      productoId: Number(item.product_id),
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad),
      estado: item.estado || "pendiente"
    });
    itemsByOrder.set(item.order_id, list);
  }

  return orderRows.map((order) => ({
    id: order.id,
    userId: Number(order.user_id),
    usuarioNombre: order.usuario_nombre,
    usuarioEmail: order.usuario_email,
    usuarioTelefono: order.usuario_telefono || "",
    total: Number(order.total),
    estado: order.estado,
    proveedorPago: order.proveedor_pago,
    direccion: parseJson(order.direccion, {}),
    tracking: parseJson(order.tracking, []),
    fecha: order.created_at,
    items: itemsByOrder.get(order.id) || []
  }));
}

export async function listAdminCarts(db) {
  const result = await db
    .prepare(
      `
      SELECT
        u.id AS user_id,
        u.nombre AS usuario_nombre,
        u.email AS usuario_email,
        c.product_id,
        c.cantidad,
        c.updated_at,
        p.nombre,
        p.precio
      FROM cart_items c
      INNER JOIN users u ON u.id = c.user_id
      INNER JOIN products p ON p.id = c.product_id
      ORDER BY c.updated_at DESC
    `
    )
    .all();
  const carts = new Map();

  for (const row of result.results || []) {
    const userId = Number(row.user_id);
    const cart = carts.get(userId) || {
      userId,
      usuarioNombre: row.usuario_nombre,
      usuarioEmail: row.usuario_email,
      items: [],
      total: 0
    };
    const subtotal = Number(row.precio) * Number(row.cantidad);

    cart.items.push({
      productoId: Number(row.product_id),
      nombre: row.nombre,
      precio: Number(row.precio),
      cantidad: Number(row.cantidad),
      subtotal,
      actualizado: row.updated_at
    });
    cart.total += subtotal;
    carts.set(userId, cart);
  }

  return Array.from(carts.values());
}

export async function listAdminUsers(db) {
  const users = await db
    .prepare(
      `
      SELECT id, nombre, email, telefono, nickname, avatar_url, direccion, is_active, created_at
      FROM users
      WHERE role != 'admin'
      ORDER BY created_at DESC
      LIMIT 200
    `
    )
    .all();

  return (users.results || []).map((user) => ({
    id: Number(user.id),
    nombre: user.nombre,
    email: user.email,
    telefono: user.telefono || "",
    nickname: user.nickname || "",
    avatarUrl: user.avatar_url || "",
    isActive: Boolean(Number(user.is_active ?? 1)),
    direccion: parseJson(user.direccion, {}),
    fechaRegistro: user.created_at
  }));
}

export async function getAdminUserDetail(db, userId) {
  const user = await getUserById(db, Number(userId));

  if (!user) {
    return null;
  }

  const dashboard = await getUserDashboard(db, Number(userId));
  const cart = await getCartState(db, Number(userId));

  return {
    user: serializeUser(user),
    historial: dashboard.historial,
    cart: cart.items || [],
    cartSummary: cart,
    orders: dashboard.historial?.ordenes || []
  };
}

export async function setUserActiveStatus(db, userId, isActive) {
  const targetId = Number(userId || 0);
  if (!targetId) {
    throw new Error("Usuario invalido.");
  }

  const target = await getUserById(db, targetId);
  if (!target || target.role === "admin") {
    return null;
  }

  await db
    .prepare(
      `
      UPDATE users
      SET is_active = ?
      WHERE id = ? AND role != 'admin'
    `
    )
    .bind(isActive ? 1 : 0, targetId)
    .run();

  return getUserById(db, targetId);
}

export async function updateOrderItemStatus(db, itemId, estado) {
  const allowed = ["pendiente", "comprado"];
  const nextStatus = allowed.includes(String(estado || "")) ? estado : "pendiente";

  await db
    .prepare("UPDATE order_items SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(nextStatus, Number(itemId))
    .run();

  const row = await db.prepare("SELECT order_id FROM order_items WHERE id = ?").bind(Number(itemId)).first();

  if (row?.order_id) {
    const pending = await db
      .prepare("SELECT COUNT(*) AS total FROM order_items WHERE order_id = ? AND estado != 'comprado'")
      .bind(row.order_id)
      .first();

    if (!Number(pending?.total || 0)) {
      await markOrderStatus(db, row.order_id, "paid", "whatsapp");
    }
  }

  return { ok: true };
}

export async function updateOrderTracking(db, orderId, tracking) {
  const normalized = Array.isArray(tracking)
    ? tracking
        .map((item) => ({
          title: String(item?.title || "").trim(),
          location: String(item?.location || "").trim(),
          note: String(item?.note || "").trim(),
          date: String(item?.date || "").trim(),
          completed: Boolean(item?.completed)
        }))
        .filter((item) => item.title || item.location || item.note || item.date)
    : [];

  await db
    .prepare("UPDATE orders SET tracking = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(JSON.stringify(normalized), String(orderId || "").trim())
    .run();

  return { ok: true, tracking: normalized };
}

export async function updateOrderStatus(db, orderId, estado) {
  const allowed = ["pending_payment", "paid", "cancelled"];
  const next = allowed.includes(String(estado || "").trim()) ? String(estado || "").trim() : "pending_payment";

  await db
    .prepare("UPDATE orders SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(next, String(orderId || "").trim())
    .run();

  return { ok: true, estado: next };
}

export async function deleteOrder(db, orderId) {
  const order = await getOrderById(db, orderId);

  if (!order) {
    return { ok: true };
  }

  if (!["pending_payment", "cancelled"].includes(String(order.estado || ""))) {
    throw new Error("Solo puedes eliminar pedidos en espera o cancelados.");
  }

  await db.prepare("DELETE FROM payments WHERE order_id = ?").bind(orderId).run();
  await db.prepare("DELETE FROM order_items WHERE order_id = ?").bind(orderId).run();
  await db.prepare("DELETE FROM orders WHERE id = ?").bind(orderId).run();
  return { ok: true };
}

export async function canUserCommentOnProduct(db, userId, productId) {
  const purchase = await db
    .prepare(
      `
      SELECT oi.id
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND oi.estado = 'comprado'
      LIMIT 1
    `
    )
    .bind(Number(userId), Number(productId))
    .first();

  return Boolean(purchase);
}

export async function listProductComments(db, productId) {
  const result = await db
    .prepare(
      `
      SELECT pc.*, u.nombre, u.nickname, u.avatar_url
      FROM product_comments pc
      INNER JOIN users u ON u.id = pc.user_id
      WHERE pc.product_id = ?
      ORDER BY pc.created_at DESC
      LIMIT 30
    `
    )
    .bind(Number(productId))
    .all();

  return (result.results || []).map((comment) => ({
    id: Number(comment.id),
    productId: Number(comment.product_id),
    userId: Number(comment.user_id),
    usuario: comment.reviewer_name || comment.nombre,
    nickname: comment.reviewer_name || comment.nickname || "",
    avatarUrl: comment.avatar_url || "",
    rating: Number(comment.rating),
    comentario: comment.comentario,
    fecha: comment.created_at
  }));
}

export async function createProductComment(db, userId, productId, input) {
  const rating = Number(input.rating);
  const comentario = String(input.comentario || "").trim();

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Selecciona una calificacion de 1 a 5 estrellas.");
  }

  if (comentario.length < 3) {
    throw new Error("Escribe un comentario un poco mas completo.");
  }

  if (!(await canUserCommentOnProduct(db, userId, productId))) {
    throw new Error("Podras comentar cuando tu compra este confirmada.");
  }

  await db
    .prepare("INSERT INTO product_comments (product_id, user_id, rating, comentario) VALUES (?, ?, ?, ?)")
    .bind(Number(productId), Number(userId), rating, comentario)
    .run();

  return listProductComments(db, productId);
}

export async function createAdminProductComment(db, adminUserId, input) {
  const productId = Number(input.productId || input.productoId);
  const rating = Number(input.rating);
  const comentario = String(input.comentario || "").trim();
  const reviewerName = String(input.reviewerName || input.nombre || "").trim();

  if (!Number.isFinite(productId)) {
    throw new Error("Selecciona un producto valido.");
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Selecciona una calificacion de 1 a 5 estrellas.");
  }

  if (comentario.length < 3) {
    throw new Error("Escribe un comentario un poco mas completo.");
  }

  const product = await getProductById(db, productId);
  if (!product) {
    throw new Error("El producto no existe.");
  }

  await db
    .prepare("INSERT INTO product_comments (product_id, user_id, reviewer_name, rating, comentario) VALUES (?, ?, ?, ?, ?)")
    .bind(productId, Number(adminUserId), reviewerName, rating, comentario)
    .run();

  return listProductComments(db, productId);
}

export async function updateAdminProductComment(db, commentId, input) {
  const id = Number(commentId);
  const rating = Number(input.rating);
  const comentario = String(input.comentario || "").trim();
  const reviewerName = String(input.reviewerName || input.nombre || "").trim();

  if (!Number.isFinite(id)) {
    throw new Error("Comentario invalido.");
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Selecciona una calificacion de 1 a 5 estrellas.");
  }

  if (comentario.length < 3) {
    throw new Error("Escribe un comentario un poco mas completo.");
  }

  await db
    .prepare("UPDATE product_comments SET reviewer_name = ?, rating = ?, comentario = ? WHERE id = ?")
    .bind(reviewerName, rating, comentario, id)
    .run();

  return { ok: true };
}

export async function deleteProductComment(db, commentId) {
  const id = Number(commentId);

  if (!Number.isFinite(id)) {
    throw new Error("Comentario invalido.");
  }

  await db.prepare("DELETE FROM product_comments WHERE id = ?").bind(id).run();
  return { ok: true };
}

export async function getSiteContent(db) {
  const result = await db.prepare("SELECT clave, valor FROM site_content").all();
  const content = structuredClone(defaultSiteContent);

  for (const row of result.results || []) {
    const parsed = parseJson(row.valor, Array.isArray(defaultSiteContent[row.clave]) ? [] : {});
    content[row.clave] = Array.isArray(defaultSiteContent[row.clave])
      ? (Array.isArray(parsed) ? parsed : [])
      : {
          ...(content[row.clave] || {}),
          ...(parsed && typeof parsed === "object" ? parsed : {})
        };
  }

  return content;
}

export async function updateSiteContent(db, sectionKey, input) {
  const key = String(sectionKey || "").trim();

  if (!Object.prototype.hasOwnProperty.call(defaultSiteContent, key)) {
    throw new Error("La seccion que intentas editar no existe.");
  }

  const nextValue = Array.isArray(defaultSiteContent[key])
    ? (Array.isArray(input) ? input : [])
    : {
        ...defaultSiteContent[key],
        ...(input && typeof input === "object" ? input : {})
      };

  await db
    .prepare(
      `
      INSERT INTO site_content (clave, valor, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(clave) DO UPDATE SET
        valor = excluded.valor,
        updated_at = CURRENT_TIMESTAMP
    `
    )
    .bind(key, JSON.stringify(nextValue))
    .run();

  return nextValue;
}
