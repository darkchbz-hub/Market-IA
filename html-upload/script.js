const API_URL = window.MARKETZONE_CONFIG?.apiUrl || `${window.location.origin}/api`;
const tokenKey = "marketzone_html_token";
const userKey = "marketzone_html_user";
const defaultSiteContent = {
  home: {
    topStrip: "Pagos seguros, acceso privado y garantia en cada compra",
    heroEyebrow: "Marketplace digital",
    heroTitle: "Compra suscripciones, herramientas IA y servicios web desde una sola tienda.",
    heroDescription:
      "Una vitrina limpia y clara para encontrar productos digitales, comprar con confianza y volver cuando quieras.",
    primaryButton: "Ver catalogo",
    secondaryButton: "Crear cuenta",
    categoriesLabel: "Explora rapido",
    categoriesTitle: "Categorias destacadas",
    featuredLabel: "Top productos",
    featuredTitle: "Lo mas vendido",
    infoOneTitle: "Catalogo con busqueda y filtros",
    infoOneText: "Tus clientes encuentran rapido lo que quieren y guardan sus favoritos en su cuenta.",
    infoTwoTitle: "Cuenta privada y segura",
    infoTwoText: "Cada compra, historial y direccion queda guardado dentro del perfil del usuario.",
    infoThreeTitle: "Pagos y control total",
    infoThreeText: "Vende desde una sola tienda y administra tu contenido desde el panel interno."
  },
  catalog: {
    topStrip: "Encuentra productos digitales con pagos seguros y compra protegida",
    label: "Catalogo",
    title: "Encuentra el producto ideal",
    description: "Descubre apps IA, packs y servicios web desde un solo lugar.",
    resultsLabel: "Resultados",
    allMeta: "Mostrando todo el catalogo"
  },
  contact: {
    topStrip: "Atencion personalizada por WhatsApp",
    label: "Contacto",
    title: "Atencion, ventas y seguimiento",
    introTitle: "Habla con nosotros de forma directa",
    introText: "Resolvemos dudas, damos seguimiento a pagos y te ayudamos con tus productos digitales.",
    email: "ventas@marketzone.mx",
    whatsappLabel: "+52 55 1111 1111",
    whatsappUrl: "https://wa.me/5215511111111",
    schedule: "Lunes a sabado de 9:00 a 19:00"
  },
  payment: {
    whatsappUrl: "https://wa.me/5215511111111",
    mercadoPagoLabel: "Mercado Pago",
    mercadoPagoUrl: "https://wa.me/5215511111111",
    paypalLabel: "PayPal",
    paypalUrl: "https://wa.me/5215511111111",
    cardLabel: "Tarjeta de credito o debito Visa o Mastercard",
    cardUrl: "",
    note: "Al continuar te abriremos WhatsApp con el resumen para dar seguimiento a tu pago."
  }
};
let currentSiteContent = defaultSiteContent;
const shopCategories = [
  { value: "productos", label: "Productos" },
  { value: "electronica", label: "Electronica" },
  { value: "casa", label: "Casa" },
  { value: "jardin", label: "Jardin" },
  { value: "apps", label: "Apps IA" },
  { value: "packs", label: "Packs" },
  { value: "webs", label: "Servicios web" },
  { value: "mas", label: "Mas" }
];
const countryOptions = [
  "Afganistan", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaiyan", "Bahamas", "Bangladesh", "Barbados", "Barein",
  "Belgica", "Belice", "Benin", "Bielorrusia", "Birmania", "Bolivia", "Bosnia y Herzegovina", "Botsuana",
  "Brasil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Butan", "Cabo Verde", "Camboya", "Camerun",
  "Canada", "Catar", "Chad", "Chile", "China", "Chipre", "Colombia", "Comoras", "Corea del Norte",
  "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Dominica", "Ecuador",
  "Egipto", "El Salvador", "Emiratos Arabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "Espana",
  "Estados Unidos", "Estonia", "Esuatini", "Etiopia", "Filipinas", "Finlandia", "Fiyi", "Francia", "Gabon",
  "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala", "Guinea", "Guinea-Bisau", "Guinea Ecuatorial",
  "Guyana", "Haiti", "Honduras", "Hungria", "India", "Indonesia", "Irak", "Iran", "Irlanda", "Islandia",
  "Islas Marshall", "Islas Salomon", "Israel", "Italia", "Jamaica", "Japon", "Jordania", "Kazajistan", "Kenia",
  "Kirguistan", "Kiribati", "Kuwait", "Laos", "Lesoto", "Letonia", "Libano", "Liberia", "Libia", "Liechtenstein",
  "Lituania", "Luxemburgo", "Macedonia del Norte", "Madagascar", "Malasia", "Malaui", "Maldivas", "Mali",
  "Malta", "Marruecos", "Mauricio", "Mauritania", "Mexico", "Micronesia", "Moldavia", "Monaco", "Mongolia",
  "Montenegro", "Mozambique", "Namibia", "Nauru", "Nepal", "Nicaragua", "Niger", "Nigeria", "Noruega",
  "Nueva Zelanda", "Oman", "Paises Bajos", "Pakistan", "Palaos", "Panama", "Papua Nueva Guinea", "Paraguay",
  "Peru", "Polonia", "Portugal", "Reino Unido", "Republica Centroafricana", "Republica Checa",
  "Republica del Congo", "Republica Democratica del Congo", "Republica Dominicana", "Ruanda", "Rumania", "Rusia",
  "Samoa", "San Cristobal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucia",
  "Santo Tome y Principe", "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somalia",
  "Sri Lanka", "Sudafrica", "Sudan", "Sudan del Sur", "Suecia", "Suiza", "Surinam", "Tailandia", "Tanzania",
  "Tayikistan", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Tunez", "Turkmenistan", "Turquia",
  "Tuvalu", "Ucrania", "Uganda", "Uruguay", "Uzbekistan", "Vanuatu", "Vaticano", "Venezuela", "Vietnam",
  "Yemen", "Yibuti", "Zambia", "Zimbabue"
];
const countryCodeLabels = {
  MX: "Mexico",
  US: "Estados Unidos",
  ES: "Espana",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Peru",
  VE: "Venezuela"
};

function getCategoryLabel(value) {
  return shopCategories.find((category) => category.value === value)?.label || value || "Producto";
}

function renderCategoryOptions(selectedValue = "") {
  return shopCategories
    .map(
      (category) =>
        `<option value="${category.value}"${category.value === selectedValue ? " selected" : ""}>${category.label}</option>`
    )
    .join("");
}

function normalizeCountryValue(value) {
  const raw = String(value || "").trim();
  return countryCodeLabels[raw.toUpperCase()] || raw || "Mexico";
}

function renderCountryOptions(selectedValue = "") {
  const selectedCountry = normalizeCountryValue(selectedValue);
  return countryOptions
    .map((country) => `<option value="${country}"${country === selectedCountry ? " selected" : ""}>${country}</option>`)
    .join("");
}

function renderCountrySelect(name, selectedValue = "", required = false, cssClass = "js-country-select") {
  return `<select name="${name}" class="${cssClass}"${required ? " required" : ""}>${renderCountryOptions(selectedValue)}</select>`;
}

function slugifyNickname(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

function hydrateCountrySelects(root = document) {
  root.querySelectorAll(".js-country-select").forEach((select) => {
    const selectedValue = select.dataset.selectedCountry || select.value || "Mexico";
    select.innerHTML = renderCountryOptions(selectedValue);
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const parsed = new Date(/Z$/i.test(normalized) ? normalized : `${normalized}Z`);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(parsed);
}

function formatDateTimeForTimezone(value, timeZone = "") {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const parsed = new Date(/Z$/i.test(normalized) ? normalized : `${normalized}Z`);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
    ...(timeZone ? { timeZone } : {})
  }).format(parsed);
}

function getInitials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "GC";
}

function renderAvatar(user = {}, className = "avatar-badge") {
  if (user.avatarUrl) {
    return `<img class="${className}" src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.nombre || "Avatar")}" />`;
  }

  return `<span class="${className} avatar-badge--fallback">${escapeHtml(getInitials(user.nombre || user.usuario || ""))}</span>`;
}

function formatPriceBlock(product) {
  const hasDiscount = Boolean(product.descuentoActivo && Number(product.precioOriginal || 0) > Number(product.precio || 0));

  return `
    <div class="product-price-stack">
      ${hasDiscount ? `<small class="product-price-original">${formatCurrency(product.precioOriginal)}</small>` : ""}
      <strong>${formatCurrency(product.precio)}</strong>
    </div>
  `;
}

function buildWhatsAppMessageUrl(baseUrl, message) {
  const text = encodeURIComponent(message);

  if (/wa\.me|whatsapp/i.test(baseUrl)) {
    return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}text=${text}`;
  }

  const redirectUrl = new URL(baseUrl, window.location.origin);
  redirectUrl.searchParams.set("text", message);
  return redirectUrl.toString();
}

function createCheckoutMessage(order, methodLabel) {
  const itemsText = order.items
    .map((item) => `${item.cantidad} x ${item.nombre} (${formatCurrency(item.subtotal)})`)
    .join("\n");

  return `Hola, quiero dar seguimiento a mi pedido ${order.id}.\nMetodo: ${methodLabel}\nTotal: ${formatCurrency(order.total)}\nProductos:\n${itemsText}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderStars(value = 0) {
  const rating = Math.round(Number(value || 0));
  return Array.from({ length: 5 }, (_, index) => (index < rating ? "★" : "☆")).join("");
}

function getToken() {
  return localStorage.getItem(tokenKey) || "";
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(userKey) || "null");
  } catch {
    return null;
  }
}

function setAuthSession({ token, user }) {
  if (token) {
    localStorage.setItem(tokenKey, token);
  }

  if (user) {
    localStorage.setItem(userKey, JSON.stringify(user));
  }
}

function clearAuthSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
}

function getCurrentPageTarget() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  return `${path}${window.location.search}${window.location.hash}`;
}

function getDefaultPostLoginTarget(user = getStoredUser()) {
  return user?.role === "admin" ? "./cuenta.html" : "./index.html";
}

function getNextTarget() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "";

  if (!next || next.includes("cuenta.html")) {
    return "";
  }

  return next;
}

function redirectToAccountGate() {
  const next = encodeURIComponent(getCurrentPageTarget());
  window.location.replace(`./cuenta.html?next=${next}`);
}

async function apiRequest(path, options = {}) {
  const { method = "GET", body, auth = false } = options;
  const headers = new Headers();
  const token = getToken();

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (auth && !token) {
    throw new Error("Necesitas iniciar sesion.");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload?.message || payload || "No se pudo completar la solicitud.";
    throw new Error(message);
  }

  return payload;
}

async function loadSiteContent() {
  try {
    const content = await apiRequest("/site-content");
    currentSiteContent = {
      home: { ...defaultSiteContent.home, ...(content.home || {}) },
      catalog: { ...defaultSiteContent.catalog, ...(content.catalog || {}) },
      contact: { ...defaultSiteContent.contact, ...(content.contact || {}) },
      payment: { ...defaultSiteContent.payment, ...(content.payment || {}) }
    };
    return currentSiteContent;
  } catch {
    currentSiteContent = defaultSiteContent;
    return currentSiteContent;
  }
}

function applySiteContent(content) {
  document.querySelectorAll("[data-content]").forEach((node) => {
    const [section, field] = String(node.dataset.content || "").split(".");
    const value = content?.[section]?.[field];

    if (!value) {
      return;
    }

    node.textContent = value;

    if (node.tagName === "A" && section === "contact" && field === "email") {
      node.setAttribute("href", `mailto:${value}`);
    }
  });

  document.querySelectorAll("[data-href-content]").forEach((node) => {
    const [section, field] = String(node.dataset.hrefContent || "").split(".");
    const value = content?.[section]?.[field];

    if (value) {
      node.setAttribute("href", value);
    }
  });
}

function normalizeProduct(product) {
  return {
    id: product.id,
    slug: product.slug || "",
    categoria: product.categoria,
    nombre: product.nombre,
    descripcion: product.descripcion,
    precio: Number(product.precio || 0),
    precioOriginal: Number(product.precioOriginal || 0),
    precioDescuento: Number(product.precioDescuento || 0),
    descuentoActivo: Boolean(product.descuentoActivo),
    stock: product.stock,
    imagen: product.imagenes?.[0] || "https://via.placeholder.com/900x675?text=Gray%20C%20Shop",
    imagenes: product.imagenes || [],
    tags: product.tags || [],
    caracteristicas: product.caracteristicas || [],
    envioGratis: Boolean(product.envioGratis),
    mostrarEnvioGratis: Boolean(product.mostrarEnvioGratis),
    ratingPromedio: Number(product.ratingPromedio || 0),
    ratingTotal: Number(product.ratingTotal || 0)
  };
}

function updateHeaderState(cartCount = 0) {
  const user = getStoredUser();

  document.querySelectorAll(".js-cart-count").forEach((node) => {
    node.textContent = String(cartCount);
  });

  document.querySelectorAll(".js-account-link").forEach((node) => {
    node.textContent = user?.nombre ? `Hola, ${user.nombre}` : "Mi cuenta";
  });
}

async function refreshHeaderState() {
  let cartCount = 0;

  if (getToken()) {
    try {
      const cart = await apiRequest("/cart", { auth: true });
      cartCount = cart.items.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
    } catch {
      cartCount = 0;
    }
  }

  updateHeaderState(cartCount);
}

function createStatusBox(message, isError = false) {
  const box = document.createElement("div");
  box.className = `status-message${isError ? " is-error" : ""}`;
  box.textContent = message;
  return box;
}

function setSectionMessage(selector, message, isError = false) {
  const container = document.querySelector(selector);

  if (!container) {
    return;
  }

  let box = container.querySelector(".js-section-message");

  if (!box) {
    box = document.createElement("div");
    box.className = "js-section-message";
    container.prepend(box);
  }

  box.innerHTML = "";
  box.appendChild(createStatusBox(message, isError));
}

async function hydrateSession() {
  if (!getToken()) {
    clearAuthSession();
    return null;
  }

  try {
    const payload = await apiRequest("/auth/me", { auth: true });
    setAuthSession({ user: payload.user });
    return payload.user;
  } catch {
    clearAuthSession();
    return null;
  }
}

function buildAddressFromFormData(formData) {
  return {
    calle: String(formData.get("calle") || "").trim(),
    ciudad: String(formData.get("ciudad") || "").trim(),
    estado: String(formData.get("estado") || "").trim(),
    cp: String(formData.get("cp") || "").trim(),
    pais: String(formData.get("pais") || "").trim()
  };
}

function hasAddressData(direccion) {
  return Object.values(direccion).some(Boolean);
}

function formatTrackingForEditor(tracking = []) {
  return (tracking || [])
    .map((item) =>
      [item.title || "", item.location || "", item.date || "", item.note || "", item.completed ? "si" : "no"].join(" | ")
    )
    .join("\n");
}

function parseTrackingFromEditor(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = "", location = "", date = "", note = "", completed = ""] = line.split("|").map((item) => item.trim());
      return {
        title,
        location,
        date,
        note,
        completed: /^(si|yes|1|true)$/i.test(completed)
      };
    })
    .filter((item) => item.title || item.location || item.note || item.date);
}

function renderTrackingTimeline(tracking = []) {
  if (!tracking.length) {
    return `<p class="muted">Todavia no hay movimientos de seguimiento cargados.</p>`;
  }

  return `
    <div class="tracking-timeline">
      ${tracking
        .map(
          (item) => `
            <article class="tracking-step${item.completed ? " is-complete" : ""}">
              <div class="tracking-step__dot"></div>
              <div class="tracking-step__content">
                <strong>${escapeHtml(item.title || "Movimiento")}</strong>
                <span>${escapeHtml(item.location || "Ubicacion pendiente")}</span>
                ${item.date ? `<small>${escapeHtml(item.date)}</small>` : ""}
                ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderHistoryList(items, renderItem) {
  if (!items.length) {
    return `<p class="muted">Sin registros todavia.</p>`;
  }

  return `<div class="history-list">${items.map(renderItem).join("")}</div>`;
}

async function loadAccountDashboard() {
  const dashboard = await apiRequest("/users/me", { auth: true });
  setAuthSession({ user: dashboard.user });
  return dashboard;
}

async function loadAdminProducts() {
  const payload = await apiRequest("/admin/products", { auth: true });
  return payload.items.map(normalizeProduct);
}

async function saveSiteSection(sectionKey, payload) {
  const response = await apiRequest(`/admin/site-content/${sectionKey}`, {
    method: "PUT",
    auth: true,
    body: payload
  });

  currentSiteContent = {
    ...currentSiteContent,
    [sectionKey]: {
      ...(currentSiteContent[sectionKey] || {}),
      ...(response.section || {})
    }
  };
  applySiteContent(currentSiteContent);

  return response.section;
}

async function loadAdminOrders() {
  const payload = await apiRequest("/admin/orders", { auth: true });
  return payload.items || [];
}

async function loadAdminCarts() {
  const payload = await apiRequest("/admin/carts", { auth: true });
  return payload.items || [];
}

async function loadAdminUsers() {
  const payload = await apiRequest("/admin/users", { auth: true });
  return payload.items || [];
}

async function loadAdminUserDetail(userId) {
  return apiRequest(`/admin/users/${userId}`, { auth: true });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`No se pudo leer el archivo ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function readFilesAsDataUrls(fileList) {
  return Promise.all(fileList.map((file) => readFileAsDataUrl(file)));
}

async function requestUserGeoMeta(statusNode = null) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const fallback = {
    latitude: 0,
    longitude: 0,
    timezone,
    capturedAt: new Date().toISOString()
  };

  if (!navigator.geolocation) {
    if (statusNode) {
      statusNode.textContent = "Tu navegador no permite leer ubicacion. Guardaremos tu zona horaria.";
    }

    return fallback;
  }

  if (statusNode) {
    statusNode.textContent = "Solicitando acceso a tu ubicacion...";
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 300000
      });
    });

    if (statusNode) {
      statusNode.textContent = "Ubicacion autorizada correctamente.";
    }

    return {
      latitude: Number(position.coords.latitude || 0),
      longitude: Number(position.coords.longitude || 0),
      timezone,
      capturedAt: new Date().toISOString()
    };
  } catch {
    if (statusNode) {
      statusNode.textContent = "No se pudo usar tu ubicacion exacta. Seguiremos con tu zona horaria actual.";
    }

    return fallback;
  }
}

async function validateNicknameInput(input, errorNode, excludeUserId = 0) {
  const nickname = slugifyNickname(input?.value || "");

  if (input) {
    input.value = nickname;
  }

  if (!nickname) {
    if (errorNode) {
      errorNode.textContent = "";
    }

    return false;
  }

  if (nickname.length < 3) {
    if (errorNode) {
      errorNode.textContent = "Tu nickname debe tener al menos 3 caracteres.";
    }

    return false;
  }

  try {
    const payload = await apiRequest(`/auth/nickname-available?nickname=${encodeURIComponent(nickname)}`);
    const sameUser = excludeUserId && getStoredUser()?.id === excludeUserId && getStoredUser()?.nickname === nickname;
    const available = Boolean(payload.available || sameUser);

    if (errorNode) {
      errorNode.textContent = available ? "" : "Ese nickname ya esta utilizado. Debes escoger otro.";
    }

    return available;
  } catch {
    if (errorNode) {
      errorNode.textContent = "No pudimos validar el nickname en este momento.";
    }

    return false;
  }
}

function renderImagePreview(container, images, emptyMessage = "Todavia no cargaste imagenes.") {
  container.innerHTML = "";

  if (!images.length) {
    container.innerHTML = `<p class="muted">${emptyMessage}</p>`;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "admin-image-preview";

  images.forEach((image, index) => {
    const figure = document.createElement("figure");
    figure.className = "admin-image-card";
    figure.innerHTML = `
      <img src="${image}" alt="Vista previa ${index + 1}" />
      <figcaption>Imagen ${index + 1}</figcaption>
    `;
    grid.appendChild(figure);
  });

  container.appendChild(grid);
}

function serializeAdminProductForm(form) {
  const formData = new FormData(form);

  return {
    nombre: String(formData.get("nombre") || "").trim(),
    descripcion: String(formData.get("descripcion") || "").trim(),
    categoria: String(formData.get("categoria") || "").trim(),
    precio: Number(formData.get("precio") || 0),
    precioDescuento: Number(formData.get("precioDescuento") || 0),
    stock: Number(formData.get("stock") || 0),
    tags: String(formData.get("tags") || "").trim(),
    caracteristicas: String(formData.get("caracteristicas") || "").trim(),
    envioGratis: formData.get("envioGratis") === "on",
    mostrarEnvioGratis: formData.get("mostrarEnvioGratis") === "on"
  };
}

function serializeSectionForm(form) {
  const formData = new FormData(form);
  return Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value || "").trim()]));
}

async function renderAdminPanel(container) {
  const [items, orders, carts, users] = await Promise.all([
    loadAdminProducts(),
    loadAdminOrders(),
    loadAdminCarts(),
    loadAdminUsers()
  ]);
  const content = await loadSiteContent();
  const homeContent = content.home;
  const catalogContent = content.catalog;
  const contactContent = content.contact;
  const paymentContent = content.payment;

  container.innerHTML = `
    <section class="admin-panel">
      <div class="section-head">
        <div>
          <p class="section-label">Tu catalogo</p>
          <h3>Publica, edita descuentos y controla tus productos</h3>
        </div>
        <button type="button" class="button button--light js-admin-clear">Vaciar catalogo</button>
      </div>
      <form class="form-card admin-form js-admin-form">
        <input type="hidden" name="productId" value="" />
        <div class="admin-grid">
          <label>
            Nombre
            <input name="nombre" type="text" required />
          </label>
          <label>
            Categoria
            <select name="categoria" required>
              ${renderCategoryOptions()}
            </select>
          </label>
          <label>
            Precio normal
            <input name="precio" type="number" min="1" step="1" required />
          </label>
          <label>
            Precio con descuento
            <input name="precioDescuento" type="number" min="0" step="1" placeholder="0 para dejar sin oferta" />
          </label>
          <label>
            Stock
            <input name="stock" type="number" min="0" step="1" required />
          </label>
        </div>
        <label>
          Descripcion
          <textarea name="descripcion" rows="4" required></textarea>
        </label>
        <label>
          Tags
          <input name="tags" type="text" placeholder="ia, premium, productividad" />
        </label>
        <label>
          Caracteristicas
          <textarea name="caracteristicas" rows="4" placeholder="Una caracteristica por linea"></textarea>
        </label>
        <div class="admin-grid">
          <label class="toggle-field">
            <input name="envioGratis" type="checkbox" />
            <span>Este producto tiene envio gratis</span>
          </label>
          <label class="toggle-field">
            <input name="mostrarEnvioGratis" type="checkbox" />
            <span>Mostrar esta informacion en la publicacion</span>
          </label>
        </div>
        <label>
          Imagenes desde tu computadora
          <input name="imagenesArchivos" type="file" accept="image/*" multiple />
        </label>
        <div class="admin-upload-note">
          Si subes nuevas imagenes al editar, se reemplazaran las actuales.
        </div>
        <div class="js-admin-image-preview"></div>
        <div class="button-row">
          <button type="submit" class="button button--primary js-admin-submit">Guardar producto</button>
          <button type="button" class="button button--light js-admin-reset">Nuevo producto</button>
        </div>
      </form>
      <div class="admin-product-list js-admin-product-list">
        ${
          items.length
            ? items
                .map(
                  (item) => `
                    <article class="admin-product-item" data-product-id="${item.id}">
                      <div>
                        <strong>${escapeHtml(item.nombre)}</strong>
                        <p>${escapeHtml(getCategoryLabel(item.categoria))} - Stock ${item.stock}</p>
                        <p>
                          ${
                            item.descuentoActivo
                              ? `<span class="admin-price-old">${formatCurrency(item.precioOriginal)}</span> <span class="admin-price-offer">${formatCurrency(item.precio)}</span>`
                              : formatCurrency(item.precio)
                          }
                        </p>
                        ${
                          item.mostrarEnvioGratis
                            ? `<p>${item.envioGratis ? "Envio gratis visible" : "Envio con costo visible"}</p>`
                            : ""
                        }
                      </div>
                      <div class="admin-actions">
                        <button type="button" class="button button--light" data-action="edit">Editar</button>
                        <button type="button" class="button button--light" data-action="delete">Eliminar</button>
                      </div>
                    </article>
                  `
                )
                .join("")
            : `<div class="empty-state"><h2>No hay productos todavia</h2><p>Agrega el primero para empezar a vender.</p></div>`
        }
      </div>
    </section>
    <section class="admin-panel">
      <div class="section-head">
        <div>
          <p class="section-label">Clientes</p>
          <h3>Usuarios registrados y acceso a su historial</h3>
        </div>
      </div>
      <div class="admin-user-list">
        ${
          users.length
            ? users
                .map(
                  (user) => `
                    <a class="admin-user-card" href="./usuario-admin.html?id=${user.id}">
                      ${renderAvatar(user, "comment-avatar")}
                      <div>
                        <strong>${escapeHtml(user.nombre)}</strong>
                        <p>${escapeHtml(user.email)}</p>
                        <small>${escapeHtml(user.telefono || "Sin telefono")}${user.nickname ? ` - /${escapeHtml(user.nickname)}` : ""}</small>
                      </div>
                    </a>
                  `
                )
                .join("")
            : `<div class="empty-state"><h2>No hay usuarios registrados</h2><p>Cuando lleguen nuevos clientes apareceran aqui.</p></div>`
        }
      </div>
    </section>
    <section class="admin-panel">
      <div class="section-head">
        <div>
          <p class="section-label">Ventas</p>
          <h3>Pedidos, pagos en espera y seguimiento</h3>
        </div>
      </div>
      <div class="admin-order-list js-admin-order-list">
        ${
          orders.length
            ? orders
                .map(
                  (order) => `
                    <article class="admin-order-item">
                      <div class="admin-order-head">
                        <div>
                          <strong>${escapeHtml(order.id)} - ${escapeHtml(order.usuarioNombre)}</strong>
                          <p>${escapeHtml(order.usuarioEmail)} - ${escapeHtml(order.usuarioTelefono || "Sin telefono")}</p>
                          <p>${escapeHtml(order.proveedorPago)} - ${escapeHtml(order.estado)} - ${formatCurrency(order.total)}</p>
                          <p class="muted">Pedido realizado: ${escapeHtml(formatDateTime(order.fecha) || "Sin fecha")}</p>
                          <p class="muted">${escapeHtml(
                            [order.direccion?.calle, order.direccion?.ciudad, order.direccion?.estado, order.direccion?.cp, order.direccion?.pais]
                              .filter(Boolean)
                              .join(", ") || "Sin direccion guardada"
                          )}</p>
                        </div>
                        <div class="admin-actions">
                          <a class="button button--light" href="./usuario-admin.html?id=${order.userId}">Ver cliente</a>
                          ${
                            order.estado !== "cancelled"
                              ? `<button type="button" class="button button--light" data-order-cancel="${order.id}">Cancelar pedido</button>`
                              : ""
                          }
                          ${
                            ["pending_payment", "cancelled"].includes(order.estado)
                              ? `<button type="button" class="button button--light" data-order-delete="${order.id}">Eliminar pedido</button>`
                              : ""
                          }
                        </div>
                      </div>
                      <div class="history-list">
                        ${order.items
                          .map(
                            (item) => `
                              <div class="admin-order-product">
                                <span>${escapeHtml(item.nombre)} x ${item.cantidad}</span>
                                <button type="button" class="button button--light" data-order-item="${item.id}" data-status="${item.estado === "comprado" ? "pendiente" : "comprado"}">
                                  ${item.estado === "comprado" ? "Comprado confirmado" : "Marcar comprado"}
                                </button>
                              </div>
                            `
                          )
                          .join("")}
                      </div>
                      <div class="admin-tracking-box">
                        <strong>Seguimiento del pedido</strong>
                        <p class="muted">Formato por linea: estado | lugar | fecha | nota | si/no</p>
                        <textarea class="js-order-tracking" data-order-id="${order.id}" rows="5">${escapeHtml(formatTrackingForEditor(order.tracking || []))}</textarea>
                        <div class="button-row">
                          <button type="button" class="button button--primary" data-save-tracking="${order.id}">Guardar seguimiento</button>
                        </div>
                        ${renderTrackingTimeline(order.tracking || [])}
                      </div>
                    </article>
                  `
                )
                .join("")
            : `<div class="empty-state"><h2>No hay pedidos todavia</h2><p>Cuando alguien envie su pedido por WhatsApp aparecera aqui.</p></div>`
        }
      </div>
    </section>
    <section class="admin-panel">
      <div class="section-head">
        <div>
          <p class="section-label">Carritos</p>
          <h3>Productos que los usuarios estan agregando</h3>
        </div>
      </div>
      <div class="admin-order-list">
        ${
          carts.length
            ? carts
                .map(
                  (cart) => `
                    <article class="admin-order-item">
                      <strong>${escapeHtml(cart.usuarioNombre)} - ${formatCurrency(cart.total)}</strong>
                      <p class="muted">${escapeHtml(cart.usuarioEmail)}</p>
                      <div class="history-list">
                        ${cart.items.map((item) => `<span>${escapeHtml(item.nombre)} x ${item.cantidad}</span>`).join("")}
                      </div>
                    </article>
                  `
                )
                .join("")
            : `<div class="empty-state"><h2>No hay carritos activos</h2><p>Aqui veras lo que agregan antes de comprar.</p></div>`
        }
      </div>
    </section>
    <section class="admin-panel">
      <div class="section-head">
        <div>
          <p class="section-label">Tu pagina</p>
          <h3>Edita textos, contacto y pagos sin tocar codigo</h3>
        </div>
      </div>
      <div class="admin-content-grid">
        <form class="form-card admin-form js-site-form" data-section="home">
          <div class="admin-form-title">
            <strong>Inicio</strong>
            <span>Portada y mensajes principales</span>
          </div>
          <label>
            Franja superior
            <input name="topStrip" type="text" value="${escapeHtml(homeContent.topStrip)}" />
          </label>
          <label>
            Etiqueta principal
            <input name="heroEyebrow" type="text" value="${escapeHtml(homeContent.heroEyebrow)}" />
          </label>
          <label>
            Titulo principal
            <textarea name="heroTitle" rows="3">${escapeHtml(homeContent.heroTitle)}</textarea>
          </label>
          <label>
            Descripcion principal
            <textarea name="heroDescription" rows="4">${escapeHtml(homeContent.heroDescription)}</textarea>
          </label>
          <div class="admin-grid">
            <label>
              Boton principal
              <input name="primaryButton" type="text" value="${escapeHtml(homeContent.primaryButton)}" />
            </label>
            <label>
              Boton secundario
              <input name="secondaryButton" type="text" value="${escapeHtml(homeContent.secondaryButton)}" />
            </label>
          </div>
          <label>
            Titulo de categorias
            <input name="categoriesTitle" type="text" value="${escapeHtml(homeContent.categoriesTitle)}" />
          </label>
          <label>
            Titulo de productos destacados
            <input name="featuredTitle" type="text" value="${escapeHtml(homeContent.featuredTitle)}" />
          </label>
          <div class="button-row">
            <button type="submit" class="button button--primary">Guardar inicio</button>
          </div>
        </form>
        <form class="form-card admin-form js-site-form" data-section="catalog">
          <div class="admin-form-title">
            <strong>Catalogo</strong>
            <span>Encabezado y mensaje de resultados</span>
          </div>
          <label>
            Franja superior
            <input name="topStrip" type="text" value="${escapeHtml(catalogContent.topStrip)}" />
          </label>
          <label>
            Etiqueta
            <input name="label" type="text" value="${escapeHtml(catalogContent.label)}" />
          </label>
          <label>
            Titulo principal
            <input name="title" type="text" value="${escapeHtml(catalogContent.title)}" />
          </label>
          <label>
            Descripcion
            <textarea name="description" rows="4">${escapeHtml(catalogContent.description)}</textarea>
          </label>
          <label>
            Etiqueta de resultados
            <input name="resultsLabel" type="text" value="${escapeHtml(catalogContent.resultsLabel)}" />
          </label>
          <div class="button-row">
            <button type="submit" class="button button--primary">Guardar catalogo</button>
          </div>
        </form>
        <form class="form-card admin-form js-site-form" data-section="contact">
          <div class="admin-form-title">
            <strong>Contacto</strong>
            <span>Datos visibles para soporte y ventas</span>
          </div>
          <label>
            Franja superior
            <input name="topStrip" type="text" value="${escapeHtml(contactContent.topStrip)}" />
          </label>
          <label>
            Titulo
            <input name="title" type="text" value="${escapeHtml(contactContent.title)}" />
          </label>
          <label>
            Texto principal
            <textarea name="introText" rows="4">${escapeHtml(contactContent.introText)}</textarea>
          </label>
          <label>
            Email
            <input name="email" type="email" value="${escapeHtml(contactContent.email)}" />
          </label>
          <label>
            WhatsApp visible
            <input name="whatsappLabel" type="text" value="${escapeHtml(contactContent.whatsappLabel)}" />
          </label>
          <label>
            Link de WhatsApp
            <input name="whatsappUrl" type="url" value="${escapeHtml(contactContent.whatsappUrl)}" />
          </label>
          <label>
            Horario
            <input name="schedule" type="text" value="${escapeHtml(contactContent.schedule)}" />
          </label>
          <div class="button-row">
            <button type="submit" class="button button--primary">Guardar contacto</button>
          </div>
        </form>
        <form class="form-card admin-form js-site-form" data-section="payment">
          <div class="admin-form-title">
            <strong>Pagos</strong>
            <span>Controla tus links de WhatsApp y tarjeta</span>
          </div>
          <label>
            Link general de seguimiento por WhatsApp
            <input name="whatsappUrl" type="url" value="${escapeHtml(paymentContent.whatsappUrl)}" />
          </label>
          <label>
            Mercado Pago
            <input name="mercadoPagoLabel" type="text" value="${escapeHtml(paymentContent.mercadoPagoLabel)}" />
          </label>
          <label>
            Link de WhatsApp para Mercado Pago
            <input name="mercadoPagoUrl" type="url" value="${escapeHtml(paymentContent.mercadoPagoUrl || paymentContent.whatsappUrl)}" />
          </label>
          <label>
            PayPal
            <input name="paypalLabel" type="text" value="${escapeHtml(paymentContent.paypalLabel)}" />
          </label>
          <label>
            Link de WhatsApp para PayPal
            <input name="paypalUrl" type="url" value="${escapeHtml(paymentContent.paypalUrl || paymentContent.whatsappUrl)}" />
          </label>
          <label>
            Tarjetas
            <input name="cardLabel" type="text" value="${escapeHtml(paymentContent.cardLabel)}" />
          </label>
          <label>
            Link para tarjeta Visa o Mastercard
            <input name="cardUrl" type="url" value="${escapeHtml(paymentContent.cardUrl || "")}" />
          </label>
          <label>
            Nota en checkout
            <textarea name="note" rows="3">${escapeHtml(paymentContent.note)}</textarea>
          </label>
          <div class="button-row">
            <button type="submit" class="button button--primary">Guardar pagos</button>
          </div>
        </form>
      </div>
    </section>
  `;

  const form = container.querySelector(".js-admin-form");
  const resetButton = container.querySelector(".js-admin-reset");
  const clearButton = container.querySelector(".js-admin-clear");
  const fileInput = form.querySelector('[name="imagenesArchivos"]');
  const imagePreview = container.querySelector(".js-admin-image-preview");

  renderImagePreview(imagePreview, [], "Sube imagenes para ver la vista previa del producto.");

  function resetAdminForm() {
    form.reset();
    form.dataset.currentImages = "[]";
    form.querySelector('[name="productId"]').value = "";
    form.querySelector('[name="envioGratis"]').checked = false;
    form.querySelector('[name="mostrarEnvioGratis"]').checked = false;
    form.querySelector('[name="precioDescuento"]').value = "";
    form.querySelector(".js-admin-submit").textContent = "Guardar producto";
    renderImagePreview(imagePreview, [], "Sube imagenes para ver la vista previa del producto.");
  }

  fileInput.addEventListener("change", async () => {
    const files = Array.from(fileInput.files || []);

    if (!files.length) {
      const currentImages = JSON.parse(form.dataset.currentImages || "[]");
      renderImagePreview(imagePreview, currentImages, "Sube imagenes para ver la vista previa del producto.");
      return;
    }

    try {
      const previews = await readFilesAsDataUrls(files);
      renderImagePreview(imagePreview, previews, "Sube imagenes para ver la vista previa del producto.");
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const productId = form.querySelector('[name="productId"]').value;
    const payload = serializeAdminProductForm(form);
    const files = Array.from(fileInput.files || []);

    try {
      if (files.length) {
        payload.imagenes = await readFilesAsDataUrls(files);
      } else if (productId) {
        payload.imagenes = JSON.parse(form.dataset.currentImages || "[]");
      } else {
        payload.imagenes = [];
      }

      if (productId) {
        await apiRequest(`/admin/products/${productId}`, {
          method: "PUT",
          auth: true,
          body: payload
        });
        setSectionMessage(".page-stack", "Cambios guardados correctamente.");
      } else {
        await apiRequest("/admin/products", {
          method: "POST",
          auth: true,
          body: payload
        });
        setSectionMessage(".page-stack", "Producto publicado correctamente.");
      }

      await renderAdminPanel(container);
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
  });

  resetButton.addEventListener("click", resetAdminForm);

  clearButton.addEventListener("click", async () => {
    if (!confirm("Esto borrara todos los productos del catalogo actual.")) {
      return;
    }

    try {
      await apiRequest("/admin/products", {
        method: "DELETE",
        auth: true
      });
      setSectionMessage(".page-stack", "Catalogo vaciado correctamente.");
      await renderAdminPanel(container);
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
  });

  container.querySelectorAll(".admin-product-item").forEach((itemNode) => {
    const productId = Number(itemNode.dataset.productId);
    const product = items.find((entry) => Number(entry.id) === productId);

    itemNode.querySelector('[data-action="edit"]').addEventListener("click", () => {
      form.querySelector('[name="productId"]').value = String(product.id);
      form.querySelector('[name="nombre"]').value = product.nombre;
      form.querySelector('[name="categoria"]').value = product.categoria;
      form.querySelector('[name="precio"]').value = String(product.descuentoActivo ? product.precioOriginal : product.precio);
      form.querySelector('[name="precioDescuento"]').value = product.descuentoActivo ? String(product.precio) : "";
      form.querySelector('[name="stock"]').value = String(product.stock);
      form.querySelector('[name="descripcion"]').value = product.descripcion;
      form.querySelector('[name="tags"]').value = product.tags.join(", ");
      form.querySelector('[name="caracteristicas"]').value = product.caracteristicas.join("\n");
      form.querySelector('[name="envioGratis"]').checked = Boolean(product.envioGratis);
      form.querySelector('[name="mostrarEnvioGratis"]').checked = Boolean(product.mostrarEnvioGratis);
      form.dataset.currentImages = JSON.stringify(product.imagenes);
      fileInput.value = "";
      renderImagePreview(imagePreview, product.imagenes, "Sube imagenes para ver la vista previa del producto.");
      form.querySelector(".js-admin-submit").textContent = "Actualizar producto";
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    itemNode.querySelector('[data-action="delete"]').addEventListener("click", async () => {
      if (!confirm(`Vas a eliminar ${product.nombre}.`)) {
        return;
      }

      try {
        await apiRequest(`/admin/products/${product.id}`, {
          method: "DELETE",
          auth: true
        });
        setSectionMessage(".page-stack", "Producto eliminado correctamente.");
        await renderAdminPanel(container);
      } catch (error) {
        setSectionMessage(".page-stack", error.message, true);
      }
    });
  });

  container.querySelectorAll("[data-order-item]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest(`/admin/order-items/${button.dataset.orderItem}`, {
          method: "PATCH",
          auth: true,
          body: {
            estado: button.dataset.status
          }
        });
        setSectionMessage(".page-stack", "Estado del producto actualizado.");
        await renderAdminPanel(container);
      } catch (error) {
        setSectionMessage(".page-stack", error.message, true);
      }
    });
  });

  container.querySelectorAll("[data-order-cancel]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest(`/admin/orders/${button.dataset.orderCancel}`, {
          method: "PATCH",
          auth: true,
          body: {
            estado: "cancelled"
          }
        });
        setSectionMessage(".page-stack", "Pedido cancelado correctamente.");
        await renderAdminPanel(container);
      } catch (error) {
        setSectionMessage(".page-stack", error.message, true);
      }
    });
  });

  container.querySelectorAll("[data-order-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Vas a eliminar este pedido del historial.")) {
        return;
      }

      try {
        await apiRequest(`/admin/orders/${button.dataset.orderDelete}`, {
          method: "DELETE",
          auth: true
        });
        setSectionMessage(".page-stack", "Pedido eliminado correctamente.");
        await renderAdminPanel(container);
      } catch (error) {
        setSectionMessage(".page-stack", error.message, true);
      }
    });
  });

  container.querySelectorAll("[data-save-tracking]").forEach((button) => {
    button.addEventListener("click", async () => {
      const orderId = button.dataset.saveTracking;
      const textarea = container.querySelector(`.js-order-tracking[data-order-id="${orderId}"]`);

      try {
        await apiRequest(`/admin/orders/${orderId}`, {
          method: "PUT",
          auth: true,
          body: {
            tracking: parseTrackingFromEditor(textarea?.value || "")
          }
        });
        setSectionMessage(".page-stack", "Seguimiento actualizado correctamente.");
        await renderAdminPanel(container);
      } catch (error) {
        setSectionMessage(".page-stack", error.message, true);
      }
    });
  });

  container.querySelectorAll(".js-site-form").forEach((formNode) => {
    formNode.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const sectionKey = event.currentTarget.dataset.section;
        const payload = serializeSectionForm(event.currentTarget);
        await saveSiteSection(sectionKey, payload);
        setSectionMessage(".page-stack", "Contenido actualizado correctamente.");
      } catch (error) {
        setSectionMessage(".page-stack", error.message, true);
      }
    });
  });
}

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  article.innerHTML = `
    <a class="product-card__image" href="./producto.html?id=${product.id}">
      ${product.descuentoActivo ? `<span class="product-card__offer">Oferta</span>` : ""}
      <img src="${product.imagen}" alt="${product.nombre}" />
    </a>
    <div class="product-card__body">
      <span class="product-card__category">${escapeHtml(getCategoryLabel(product.categoria))}</span>
      <h3><a href="./producto.html?id=${product.id}">${product.nombre}</a></h3>
      ${
        product.mostrarEnvioGratis
          ? `<p class="shipping-pill">${product.envioGratis ? "Envio gratis" : "Envio con costo"}</p>`
          : ""
      }
      <p class="product-rating">${renderStars(product.ratingPromedio)} <span>${product.ratingTotal} opiniones</span></p>
      <p class="product-card__description">${escapeHtml(product.descripcion)}</p>
    </div>
    <div class="product-card__footer">
      <div class="product-card__price">
        ${formatPriceBlock(product)}
        <small>Stock ${product.stock}</small>
      </div>
      <div class="product-card__actions">
        <a href="./producto.html?id=${product.id}" class="button button--primary">Ver detalles</a>
        <button type="button" class="button button--light">Agregar al carrito</button>
      </div>
    </div>
  `;

  article.querySelector("button").addEventListener("click", async () => {
    if (!getToken()) {
      window.location.href = "./cuenta.html";
      return;
    }

    try {
      await apiRequest("/cart/items", {
        method: "POST",
        auth: true,
        body: {
          productId: product.id,
          cantidad: 1
        }
      });
      await refreshHeaderState();
      alert(`${product.nombre} se agrego al carrito.`);
    } catch (error) {
      alert(error.message);
    }
  });

  return article;
}

async function renderHomePage() {
  const container = document.querySelector(".js-featured-products");

  if (!container) {
    return;
  }

  try {
    const payload = await apiRequest("/products?limit=4");
    container.innerHTML = "";
    payload.items.map(normalizeProduct).forEach((product) => container.appendChild(createProductCard(product)));
  } catch (error) {
    container.innerHTML = "";
    container.appendChild(createStatusBox(`No se pudo conectar a la API. ${error.message}`, true));
  }
}

function closeCatalogFilters() {
  const overlay = document.querySelector(".js-filter-overlay");
  const toggle = document.querySelector(".js-filter-toggle");

  if (!overlay || overlay.hidden) {
    return;
  }

  overlay.hidden = true;
  document.body.classList.remove("has-drawer-open");

  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
  }
}

function openCatalogFilters() {
  const overlay = document.querySelector(".js-filter-overlay");
  const toggle = document.querySelector(".js-filter-toggle");

  if (!overlay) {
    return;
  }

  overlay.hidden = false;
  document.body.classList.add("has-drawer-open");

  if (toggle) {
    toggle.setAttribute("aria-expanded", "true");
  }
}

function bindCatalogDrawer() {
  const toggle = document.querySelector(".js-filter-toggle");
  const close = document.querySelector(".js-filter-close");
  const overlay = document.querySelector(".js-filter-overlay");

  if (!toggle || !close || !overlay) {
    return;
  }

  toggle.addEventListener("click", () => {
    if (overlay.hidden) {
      openCatalogFilters();
      return;
    }

    closeCatalogFilters();
  });

  close.addEventListener("click", closeCatalogFilters);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeCatalogFilters();
    }
  });
}

function syncCatalogControlsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const search = document.querySelector("#catalog-search");
  const category = document.querySelector("#catalog-category");
  const min = document.querySelector("#catalog-min");
  const max = document.querySelector("#catalog-max");

  if (search) {
    search.value = params.get("search") || "";
  }

  if (category) {
    category.value = params.get("category") || "";
  }

  if (min) {
    min.value = params.get("minPrice") || "";
  }

  if (max) {
    max.value = params.get("maxPrice") || "";
  }
}

async function applyCatalogFilters() {
  const search = document.querySelector("#catalog-search")?.value.trim() || "";
  const category = document.querySelector("#catalog-category")?.value || "";
  const minPrice = document.querySelector("#catalog-min")?.value || "";
  const maxPrice = document.querySelector("#catalog-max")?.value || "";
  const sort = document.querySelector("#catalog-sort")?.value || "featured";
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (category) {
    params.set("category", category);
  }

  if (minPrice) {
    params.set("minPrice", minPrice);
  }

  if (maxPrice) {
    params.set("maxPrice", maxPrice);
  }

  params.set("limit", "24");

  const results = document.querySelector(".js-catalog-products");
  const title = document.querySelector(".js-catalog-title");
  const meta = document.querySelector(".js-catalog-meta");

  if (!results || !title || !meta) {
    return;
  }

  try {
    const payload = await apiRequest(`/products?${params.toString()}`);
    let items = payload.items.map(normalizeProduct);

    if (sort === "price-asc") {
      items = items.sort((left, right) => left.precio - right.precio);
    } else if (sort === "price-desc") {
      items = items.sort((left, right) => right.precio - left.precio);
    } else if (sort === "name") {
      items = items.sort((left, right) => left.nombre.localeCompare(right.nombre, "es"));
    }

    results.innerHTML = "";
    items.forEach((product) => results.appendChild(createProductCard(product)));
    title.textContent = `${payload.pagination.total} productos encontrados`;
    meta.textContent = category ? `Categoria activa: ${getCategoryLabel(category)}` : currentSiteContent.catalog.allMeta;

    const nextParams = new URLSearchParams();

    if (search) {
      nextParams.set("search", search);
    }

    if (category) {
      nextParams.set("category", category);
    }

    if (minPrice) {
      nextParams.set("minPrice", minPrice);
    }

    if (maxPrice) {
      nextParams.set("maxPrice", maxPrice);
    }

    const queryString = nextParams.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${queryString ? `?${queryString}` : ""}`);
    closeCatalogFilters();
  } catch (error) {
    results.innerHTML = "";
    results.appendChild(createStatusBox(`No se pudo cargar el catalogo. ${error.message}`, true));
  }
}

async function renderCatalogPage() {
  if (!document.querySelector("#catalog-search")) {
    return;
  }

  syncCatalogControlsFromUrl();
  bindCatalogDrawer();

  document.querySelector("#catalog-apply").addEventListener("click", applyCatalogFilters);
  document.querySelector("#catalog-clear").addEventListener("click", () => {
    document.querySelector("#catalog-search").value = "";
    document.querySelector("#catalog-category").value = "";
    document.querySelector("#catalog-min").value = "";
    document.querySelector("#catalog-max").value = "";
    document.querySelector("#catalog-sort").value = "featured";
    applyCatalogFilters();
  });

  await applyCatalogFilters();
}

function renderComments(comments = []) {
  if (!comments.length) {
    return `<p class="muted">Todavia no hay comentarios. Tu opinion puede ser la primera.</p>`;
  }

  const isAdmin = getStoredUser()?.role === "admin";

  return comments
    .map(
      (comment) => `
        <article class="comment-item" data-comment-id="${comment.id}">
          <div class="comment-item__head">
            ${renderAvatar({ nombre: comment.usuario, avatarUrl: comment.avatarUrl }, "comment-avatar")}
            <div class="comment-item__meta">
              <strong>${escapeHtml(comment.usuario)}</strong>
              <small>${comment.nickname ? `/${escapeHtml(comment.nickname)}` : ""}</small>
              <span>${renderStars(comment.rating)}</span>
            </div>
          </div>
          <p>${escapeHtml(comment.comentario)}</p>
          ${
            isAdmin
              ? `<div class="comment-actions"><button type="button" class="button button--light" data-comment-delete="${comment.id}">Eliminar comentario</button></div>`
              : ""
          }
        </article>
      `
    )
    .join("");
}

function bindCommentModeration(container, productId) {
  if (getStoredUser()?.role !== "admin") {
    return;
  }

  container.querySelectorAll("[data-comment-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Vas a eliminar este comentario.")) {
        return;
      }

      try {
        await apiRequest(`/admin/comments/${button.dataset.commentDelete}`, {
          method: "DELETE",
          auth: true
        });
        const response = await apiRequest(`/products/${productId}`, { auth: true });
        container.querySelector(".js-comments-list").innerHTML = renderComments(response.comments || []);
        bindCommentModeration(container, productId);
        setSectionMessage(".page-stack", "Comentario eliminado correctamente.");
      } catch (error) {
        setSectionMessage(".page-stack", error.message, true);
      }
    });
  });
}

async function renderProductPage() {
  const container = document.querySelector(".js-product-detail");

  if (!container) {
    return;
  }

  const productId = new URLSearchParams(window.location.search).get("id");

  if (!productId) {
    container.appendChild(createStatusBox("No encontramos el producto solicitado.", true));
    return;
  }

  try {
    const payload = await apiRequest(`/products/${productId}`, { auth: Boolean(getToken()) });
    const product = normalizeProduct(payload.product);
    const comments = payload.comments || [];
    const canComment = Boolean(payload.canComment);
    const user = getStoredUser();

    container.innerHTML = `
      <article class="product-detail">
        <div class="product-detail__media">
          ${product.descuentoActivo ? `<span class="product-card__offer">Oferta</span>` : ""}
          <img src="${product.imagen}" alt="${escapeHtml(product.nombre)}" />
        </div>
        <div class="product-detail__info">
          <a href="./catalogo.html" class="muted">Volver al catalogo</a>
          <span class="product-card__category">${escapeHtml(getCategoryLabel(product.categoria))}</span>
          <h1>${escapeHtml(product.nombre)}</h1>
          ${
            product.mostrarEnvioGratis
              ? `<p class="shipping-pill">${product.envioGratis ? "Envio gratis disponible" : "Este producto tiene costo de envio"}</p>`
              : ""
          }
          <p class="product-rating">${renderStars(product.ratingPromedio)} <span>${product.ratingTotal} opiniones</span></p>
          <div class="product-detail__price">${formatPriceBlock(product)}</div>
          <p>${escapeHtml(product.descripcion)}</p>
          <div class="detail-block">
            <h3>Caracteristicas</h3>
            ${
              product.caracteristicas.length
                ? `<ul class="plain-list">${product.caracteristicas.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
                : `<p class="muted">Este producto aun no tiene caracteristicas cargadas.</p>`
            }
          </div>
          <div class="tag-row">
            ${product.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="button-row">
            <button type="button" class="button button--primary js-detail-add">Agregar al carrito</button>
            <a href="./checkout.html" class="button button--light">Ir a pagar</a>
          </div>
        </div>
      </article>
      <section class="section-block">
        <div class="section-head">
          <div>
            <p class="section-label">Opiniones</p>
            <h2>Comentarios y puntuacion</h2>
          </div>
        </div>
        ${
          canComment
            ? `
              <form class="form-card review-form js-review-form">
                <label>
                  Calificacion
                  <select name="rating" required>
                    <option value="5">5 estrellas</option>
                    <option value="4">4 estrellas</option>
                    <option value="3">3 estrellas</option>
                    <option value="2">2 estrellas</option>
                    <option value="1">1 estrella</option>
                  </select>
                </label>
                <label>
                  Comentario
                  <textarea name="comentario" rows="4" placeholder="Cuenta como te fue con este producto" required></textarea>
                </label>
                <button type="submit" class="button button--primary">Publicar comentario</button>
              </form>
            `
            : `
              <div class="form-card review-lock">
                <strong>${user ? "Podras comentar cuando tu compra aparezca como comprada." : "Inicia sesion para seguir tu compra y comentar despues."}</strong>
                <p class="muted">Solo los clientes que ya compraron este producto pueden dejar una opinion publica.</p>
              </div>
            `
        }
        <div class="comments-list js-comments-list">${renderComments(comments)}</div>
      </section>
    `;

    bindCommentModeration(container, product.id);

    container.querySelector(".js-detail-add").addEventListener("click", async () => {
      if (!getToken()) {
        window.location.href = "./cuenta.html";
        return;
      }

      try {
        await apiRequest("/cart/items", {
          method: "POST",
          auth: true,
          body: {
            productId: product.id,
            cantidad: 1
          }
        });
        await refreshHeaderState();
        alert(`${product.nombre} se agrego al carrito.`);
      } catch (error) {
        alert(error.message);
      }
    });

    const reviewForm = container.querySelector(".js-review-form");

    if (reviewForm) {
      reviewForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
          const response = await apiRequest(`/products/${product.id}/comments`, {
            method: "POST",
            auth: true,
            body: {
              rating: Number(formData.get("rating")),
              comentario: String(formData.get("comentario") || "").trim()
            }
          });
          event.currentTarget.reset();
          container.querySelector(".js-comments-list").innerHTML = renderComments(response.comments || []);
          bindCommentModeration(container, product.id);
        } catch (error) {
          setSectionMessage(".page-stack", error.message, true);
        }
      });
    }
  } catch (error) {
    container.innerHTML = "";
    container.appendChild(createStatusBox(error.message, true));
  }
}

function renderLoggedOutCart() {
  const cartContainer = document.querySelector(".js-cart-items");
  const summary = document.querySelector(".js-cart-summary");

  if (!cartContainer || !summary) {
    return;
  }

  cartContainer.innerHTML = `
    <div class="empty-state">
      <h2>Inicia sesion para ver tu carrito</h2>
      <p>Tu carrito se guarda en tu cuenta para que sigas comprando cuando quieras.</p>
      <a href="./cuenta.html" class="button button--primary">Entrar a mi cuenta</a>
    </div>
  `;
  summary.innerHTML = `
    <h2>Resumen</h2>
    <p class="muted">Tu carrito se guarda por usuario en la base de datos.</p>
  `;
}

async function changeCartQuantity(productId, quantity) {
  await apiRequest(`/cart/items/${productId}`, {
    method: "PATCH",
    auth: true,
    body: {
      cantidad: quantity
    }
  });
}

async function removeCartItem(productId) {
  await apiRequest(`/cart/items/${productId}`, {
    method: "DELETE",
    auth: true
  });
}

async function renderCartPage() {
  const cartContainer = document.querySelector(".js-cart-items");
  const summary = document.querySelector(".js-cart-summary");

  if (!cartContainer || !summary) {
    return;
  }

  if (!getToken()) {
    renderLoggedOutCart();
    return;
  }

  try {
    const cart = await apiRequest("/cart", { auth: true });

    if (!cart.items.length) {
      cartContainer.innerHTML = `
        <div class="empty-state">
          <h2>Tu carrito esta vacio</h2>
          <p>Agrega productos desde el catalogo para continuar.</p>
          <a href="./catalogo.html" class="button button--primary">Ir al catalogo</a>
        </div>
      `;
      summary.innerHTML = `
        <h2>Resumen</h2>
        <p class="muted">Todavia no agregas productos.</p>
      `;
      await refreshHeaderState();
      return;
    }

    cartContainer.innerHTML = "";

    cart.items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "cart-item";
      article.innerHTML = `
        <img src="${item.imagenes?.[0] || "https://via.placeholder.com/900x675?text=Gray%20C%20Shop"}" alt="${item.nombre}" />
        <div class="cart-item__body">
          <span class="product-card__category">${escapeHtml(getCategoryLabel(item.categoria))}</span>
          <h3>${item.nombre}</h3>
          <p>${item.descripcion}</p>
          <strong>${formatCurrency(item.subtotal)}</strong>
        </div>
        <div class="cart-item__actions">
          <div class="qty-row">
            <button type="button" data-action="minus">-</button>
            <span>${item.cantidad}</span>
            <button type="button" data-action="plus">+</button>
          </div>
          <button type="button" class="button button--light" data-action="remove">Quitar</button>
        </div>
      `;

      article.querySelector('[data-action="minus"]').addEventListener("click", async () => {
        try {
          await changeCartQuantity(item.productoId, Number(item.cantidad) - 1);
          await renderCartPage();
        } catch (error) {
          alert(error.message);
        }
      });

      article.querySelector('[data-action="plus"]').addEventListener("click", async () => {
        try {
          await changeCartQuantity(item.productoId, Number(item.cantidad) + 1);
          await renderCartPage();
        } catch (error) {
          alert(error.message);
        }
      });

      article.querySelector('[data-action="remove"]').addEventListener("click", async () => {
        try {
          await removeCartItem(item.productoId);
          await renderCartPage();
        } catch (error) {
          alert(error.message);
        }
      });

      cartContainer.appendChild(article);
    });

    summary.innerHTML = `
      <h2>Resumen</h2>
      <div class="summary-line">
        <span>Productos</span>
        <strong>${cart.items.length}</strong>
      </div>
      <div class="summary-line">
        <span>Total estimado</span>
        <strong>${formatCurrency(cart.total)}</strong>
      </div>
      <p class="muted">Tu carrito queda guardado en tu cuenta para que sigas tu compra con seguridad.</p>
      <a class="button button--primary" href="./checkout.html">Continuar a checkout</a>
      <a class="button button--light" href="./catalogo.html">Seguir comprando</a>
    `;

    await refreshHeaderState();
  } catch (error) {
    cartContainer.innerHTML = "";
    cartContainer.appendChild(createStatusBox(`No se pudo cargar tu carrito. ${error.message}`, true));
  }
}

function renderAccountDashboard(dashboard) {
  const profileCard = document.querySelector(".js-profile-card");

  if (!profileCard) {
    return;
  }

  const direccion = dashboard.user.direccion || {};
  const timezone = dashboard.user.geoMeta?.timezone || "";
  const whatsappBase = currentSiteContent.payment.whatsappUrl || currentSiteContent.contact?.whatsappUrl || "https://wa.me/5215511111111";
  const ordenesHtml = renderHistoryList(
    dashboard.historial.ordenes || [],
    (item) => `
      <div class="history-item">
        <strong>${item.id}</strong>
        <span>${formatCurrency(item.total)} - ${item.estado}</span>
        <span>Pedido realizado: ${escapeHtml(formatDateTimeForTimezone(item.fecha, timezone) || "Sin fecha")}</span>
        ${(item.items || [])
          .map(
            (orderItem) => `
              <small class="${orderItem.estado === "comprado" ? "purchase-ok" : "muted"}">
                ${orderItem.estado === "comprado" ? "Comprado confirmado" : "Pendiente"} - ${escapeHtml(orderItem.nombre)} x ${orderItem.cantidad}
              </small>
            `
          )
          .join("")}
        <div class="button-row button-row--compact">
          <a class="button button--light" href="${buildWhatsAppMessageUrl(whatsappBase, `Hola, aqui mando mi voucher del pedido ${item.id}.`)}" target="_blank" rel="noreferrer">Aqui manda tu voucher</a>
        </div>
        ${renderTrackingTimeline(item.tracking || [])}
      </div>
    `
  );
  const busquedasHtml = renderHistoryList(
    dashboard.historial.busquedas || [],
    (item) => `
      <div class="history-item">
        <strong>${item.busqueda}</strong>
        <span>${new Date(item.fecha).toLocaleString("es-MX")}</span>
      </div>
    `
  );
  const vistosHtml = renderHistoryList(
    dashboard.historial.productosVistos || [],
    (item) => `
      <div class="history-item">
        <strong>${item.producto.nombre}</strong>
        <span>${new Date(item.fecha).toLocaleString("es-MX")}</span>
      </div>
    `
  );

  profileCard.className = "profile-card js-profile-card";
  profileCard.innerHTML = `
    <div class="profile-head">
      ${renderAvatar(dashboard.user, "profile-avatar")}
      <div>
        <p class="section-label">Tu cuenta</p>
        <h2>${dashboard.user.nombre}</h2>
        <p class="muted">${dashboard.user.email}</p>
        <p class="muted">${dashboard.user.nickname ? `/${escapeHtml(dashboard.user.nickname)}` : "Agrega un nickname publico para tus comentarios."}</p>
      </div>
    </div>
    <p class="muted">${dashboard.user.telefono || "Agrega tu numero para que podamos darte mejor seguimiento."}</p>
    <p class="muted">Todas tus compras tienen garantia, pagos seguros y seguimiento desde un solo lugar.</p>
    ${
      dashboard.user.role === "admin"
        ? `
          <section class="admin-inline-shell">
            <div class="section-head">
              <div>
                <p class="section-label">Administrador</p>
                <h3>Usuarios registrados, pedidos y control de tienda</h3>
              </div>
            </div>
            <div class="js-admin-panel"></div>
          </section>
        `
        : ""
    }
    <form class="profile-update-form">
      <div class="profile-grid">
        <label>
          Nickname publico
          <input name="nickname" type="text" minlength="3" maxlength="24" pattern="[A-Za-z0-9._-]{3,24}" value="${escapeHtml(dashboard.user.nickname || "")}" required />
          <small class="field-error js-profile-nickname-error"></small>
        </label>
        <label>
          Foto de perfil
          <input name="avatarArchivo" type="file" accept="image/*" />
          <small class="field-help">Tu foto aparecera cuando comentes productos.</small>
        </label>
        <label>
          Telefono
          <input name="telefono" type="text" value="${dashboard.user.telefono || ""}" required />
        </label>
        <label>
          Calle
          <input name="calle" type="text" value="${direccion.calle || ""}" required />
        </label>
        <label>
          Ciudad
          <input name="ciudad" type="text" value="${direccion.ciudad || ""}" required />
        </label>
        <label>
          Estado
          <input name="estado" type="text" value="${direccion.estado || ""}" required />
        </label>
        <label>
          Codigo postal
          <input name="cp" type="text" value="${direccion.cp || ""}" required />
        </label>
        <label>
          Pais
          ${renderCountrySelect("pais", direccion.pais || "Mexico", true)}
        </label>
      </div>
      <p class="field-help js-profile-geo-status">Zona horaria guardada: ${escapeHtml(timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Sin registrar")}</p>
      <button type="submit" class="button button--primary">Guardar perfil</button>
    </form>
    <div class="history-grid">
      <section>
        <h3>Tus compras</h3>
        ${ordenesHtml}
      </section>
      <section>
        <h3>Lo que buscaste</h3>
        ${busquedasHtml}
      </section>
      <section>
        <h3>Vistos recientemente</h3>
        ${vistosHtml}
      </section>
    </div>
  `;

  const profileForm = profileCard.querySelector(".profile-update-form");
  const nicknameInput = profileForm.querySelector('[name="nickname"]');
  const nicknameError = profileForm.querySelector(".js-profile-nickname-error");
  const geoStatus = profileForm.querySelector(".js-profile-geo-status");

  nicknameInput.addEventListener("input", () => {
    nicknameInput.value = slugifyNickname(nicknameInput.value);
    nicknameError.textContent = "";
  });

  nicknameInput.addEventListener("blur", () => {
    validateNicknameInput(nicknameInput, nicknameError, Number(dashboard.user.id));
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!profileForm.reportValidity()) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const direccionPayload = buildAddressFromFormData(formData);
    const nicknameAvailable = await validateNicknameInput(nicknameInput, nicknameError, Number(dashboard.user.id));

    if (!nicknameAvailable) {
      return;
    }

    try {
      const avatarFile = formData.get("avatarArchivo");
      const avatarUrl = avatarFile instanceof File && avatarFile.size ? await readFileAsDataUrl(avatarFile) : dashboard.user.avatarUrl || "";
      const geoMeta = await requestUserGeoMeta(geoStatus);
      const payload = await apiRequest("/users/me", {
        method: "PUT",
        auth: true,
        body: {
          direccion: direccionPayload,
          telefono: String(formData.get("telefono") || "").trim(),
          nickname: String(formData.get("nickname") || "").trim(),
          avatarUrl,
          geoMeta
        }
      });
      setAuthSession({ user: payload.user });
      setSectionMessage(".page-stack", "Perfil actualizado correctamente.");
      const nextDashboard = await loadAccountDashboard();
      renderAccountDashboard(nextDashboard);
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
  });

  if (dashboard.user.role === "admin") {
    const adminPanel = profileCard.querySelector(".js-admin-panel");

    renderAdminPanel(adminPanel).catch((error) => {
      adminPanel.innerHTML = "";
      adminPanel.appendChild(createStatusBox(error.message, true));
    });
  }
}

async function renderAccountPage() {
  const registerForm = document.querySelector(".js-register-form");
  const loginForm = document.querySelector(".js-login-form");
  const logoutButton = document.querySelector(".js-logout-button");
  const profileCard = document.querySelector(".js-profile-card");
  const authShell = document.querySelector(".js-auth-shell");

  if (!registerForm || !loginForm || !logoutButton || !profileCard || !authShell) {
    return;
  }

  if (!getToken()) {
    const nextTarget = getNextTarget();

    if (nextTarget) {
      setSectionMessage(".page-stack", "Crea tu cuenta o inicia sesion para entrar a la tienda.");
    }
  }

  const registerNicknameInput = registerForm.querySelector('[name="nickname"]');
  const registerNicknameError = registerForm.querySelector(".js-register-nickname-error");
  const registerGeoStatus = registerForm.querySelector(".js-register-geo-status");

  registerNicknameInput.addEventListener("input", () => {
    registerNicknameInput.value = slugifyNickname(registerNicknameInput.value);
    registerNicknameError.textContent = "";
  });

  registerNicknameInput.addEventListener("blur", () => {
    validateNicknameInput(registerNicknameInput, registerNicknameError);
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!registerForm.reportValidity()) {
      return;
    }

    const formData = new FormData(registerForm);
    const direccion = buildAddressFromFormData(formData);
    const nicknameAvailable = await validateNicknameInput(registerNicknameInput, registerNicknameError);

    if (!nicknameAvailable) {
      return;
    }

    try {
      const avatarFile = formData.get("avatarArchivo");
      const avatarUrl = avatarFile instanceof File && avatarFile.size ? await readFileAsDataUrl(avatarFile) : "";
      const geoMeta = await requestUserGeoMeta(registerGeoStatus);
      const payload = await apiRequest("/auth/register", {
        method: "POST",
        body: {
          nombre: String(formData.get("nombre") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          password: String(formData.get("password") || ""),
          telefono: String(formData.get("telefono") || "").trim(),
          nickname: String(formData.get("nickname") || "").trim(),
          direccion,
          avatarUrl,
          geoMeta
        }
      });

      setAuthSession(payload);
      setSectionMessage(".page-stack", "Cuenta creada correctamente.");
      registerForm.reset();
      registerGeoStatus.textContent = "Te pediremos acceso a tu ubicacion para guardar tu zona horaria exacta.";
      const nextTarget = getNextTarget();

      if (nextTarget) {
        window.location.href = nextTarget;
        return;
      }

      await refreshHeaderState();
      window.location.href = getDefaultPostLoginTarget(payload.user);
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);

    try {
      const payload = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: String(formData.get("email") || "").trim(),
          password: String(formData.get("password") || "")
        }
      });

      setAuthSession(payload);
      loginForm.reset();
      setSectionMessage(".page-stack", "Bienvenido de nuevo.");
      const nextTarget = getNextTarget();

      if (nextTarget) {
        window.location.href = nextTarget;
        return;
      }

      await refreshHeaderState();
      window.location.href = getDefaultPostLoginTarget(payload.user);
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
  });

  logoutButton.addEventListener("click", async () => {
    clearAuthSession();
    profileCard.className = "profile-card js-profile-card is-hidden";
    profileCard.innerHTML = "";
    setSectionMessage(".page-stack", "Sesion cerrada correctamente.");
    await refreshHeaderState();
  });

  if (getToken()) {
    try {
      const dashboard = await loadAccountDashboard();
      authShell.classList.add("is-hidden");
      renderAccountDashboard(dashboard);
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
  } else {
    authShell.classList.remove("is-hidden");
    profileCard.className = "profile-card js-profile-card is-hidden";
  }
}

async function renderAdminUserDetailPage() {
  const container = document.querySelector(".js-admin-user-detail");

  if (!container) {
    return;
  }

  const currentUser = getStoredUser();

  if (currentUser?.role !== "admin") {
    container.innerHTML = "";
    container.appendChild(createStatusBox("Solo el administrador puede ver esta pagina.", true));
    return;
  }

  const userId = new URLSearchParams(window.location.search).get("id");

  if (!userId) {
    container.innerHTML = "";
    container.appendChild(createStatusBox("No encontramos el cliente solicitado.", true));
    return;
  }

  try {
    const detail = await loadAdminUserDetail(userId);
    const user = detail.user;
    const direccion = user.direccion || {};
    const timezone = user.geoMeta?.timezone || "";
    const cart = detail.cart || { items: [], total: 0 };

    container.innerHTML = `
      <div class="section-head">
        <div>
          <p class="section-label">Cliente</p>
          <h2>${escapeHtml(user.nombre)}</h2>
        </div>
        <a href="./cuenta.html" class="button button--light">Volver al administrador</a>
      </div>
      <div class="admin-user-detail-grid">
        <section class="form-card">
          <div class="profile-head">
            ${renderAvatar(user, "profile-avatar")}
            <div>
              <strong>${escapeHtml(user.nombre)}</strong>
              <p class="muted">${escapeHtml(user.email)}</p>
              <p class="muted">${user.nickname ? `/${escapeHtml(user.nickname)}` : "Sin nickname publico"}</p>
            </div>
          </div>
          <div class="history-list">
            <div class="history-item">
              <strong>Telefono</strong>
              <span>${escapeHtml(user.telefono || "Sin telefono")}</span>
            </div>
            <div class="history-item">
              <strong>Direccion</strong>
              <span>${escapeHtml([direccion.calle, direccion.ciudad, direccion.estado, direccion.cp, direccion.pais].filter(Boolean).join(", ") || "Sin direccion")}</span>
            </div>
            <div class="history-item">
              <strong>Registro</strong>
              <span>${escapeHtml(formatDateTimeForTimezone(user.fechaRegistro, timezone) || "Sin fecha")}</span>
            </div>
          </div>
        </section>
        <section class="form-card">
          <p class="section-label">Carrito actual</p>
          <h3>${formatCurrency(cart.total || 0)}</h3>
          <div class="history-list">
            ${
              cart.items?.length
                ? cart.items
                    .map(
                      (item) => `
                        <div class="history-item">
                          <strong>${escapeHtml(item.nombre)}</strong>
                          <span>${item.cantidad} x ${formatCurrency(item.precio)}</span>
                        </div>
                      `
                    )
                    .join("")
                : `<p class="muted">Este cliente no tiene productos en el carrito.</p>`
            }
          </div>
        </section>
      </div>
      <section class="admin-panel">
        <div class="section-head">
          <div>
            <p class="section-label">Pedidos</p>
            <h3>Historial completo del cliente</h3>
          </div>
        </div>
        <div class="admin-order-list">
          ${
            detail.historial?.ordenes?.length
              ? detail.historial.ordenes
                  .map(
                    (order) => `
                      <article class="admin-order-item">
                        <strong>${escapeHtml(order.id)}</strong>
                        <p>${formatCurrency(order.total)} - ${escapeHtml(order.estado)}</p>
                        <p class="muted">Pedido realizado: ${escapeHtml(formatDateTimeForTimezone(order.fecha, timezone) || "Sin fecha")}</p>
                        <div class="history-list">
                          ${(order.items || [])
                            .map(
                              (item) => `
                                <div class="history-item">
                                  <strong>${escapeHtml(item.nombre)}</strong>
                                  <span>${item.cantidad} x ${formatCurrency(item.precio)} - ${escapeHtml(item.estado)}</span>
                                </div>
                              `
                            )
                            .join("")}
                        </div>
                        ${renderTrackingTimeline(order.tracking || [])}
                      </article>
                    `
                  )
                  .join("")
              : `<div class="empty-state"><h2>Este cliente aun no compra</h2><p>Cuando haga su primer pedido lo veras aqui con su ID.</p></div>`
          }
        </div>
      </section>
    `;
  } catch (error) {
    container.innerHTML = "";
    container.appendChild(createStatusBox(error.message, true));
  }
}

function renderCheckoutLoggedOut(layout) {
  layout.innerHTML = `
    <div class="empty-state">
      <h2>Inicia sesion para continuar con tu compra</h2>
      <p>Tu compra y tus pedidos quedan guardados dentro de tu cuenta.</p>
      <a href="./cuenta.html" class="button button--primary">Ir a mi cuenta</a>
    </div>
  `;
}

function renderCheckoutForm(layout, summary, user) {
  const direccion = user?.direccion || {};
  const paymentContent = currentSiteContent.payment;

  layout.innerHTML = `
    <form class="form-card checkout-card js-checkout-form">
      <h2>Direccion de envio</h2>
      <div class="profile-grid">
        <label>
          Telefono
          <input name="telefono" type="text" value="${user?.telefono || ""}" required />
        </label>
        <label>
          Calle
          <input name="calle" type="text" value="${direccion.calle || ""}" required />
        </label>
        <label>
          Ciudad
          <input name="ciudad" type="text" value="${direccion.ciudad || ""}" required />
        </label>
        <label>
          Estado
          <input name="estado" type="text" value="${direccion.estado || ""}" required />
        </label>
        <label>
          Codigo postal
          <input name="cp" type="text" value="${direccion.cp || ""}" required />
        </label>
      </div>
      <label>
        Pais
        ${renderCountrySelect("pais", direccion.pais || "Mexico", true)}
      </label>

      <div class="payment-options">
        <button type="button" class="payment-option is-selected" data-provider="mercadopago">
          <strong>${escapeHtml(paymentContent.mercadoPagoLabel)}</strong>
          <span class="payment-option__note">Transferencia por WhatsApp sin costo extra</span>
        </button>
        <button type="button" class="payment-option" data-provider="paypal">
          <strong>${escapeHtml(paymentContent.paypalLabel)}</strong>
          <span class="payment-option__note">Seguimiento por WhatsApp con comision del 6%</span>
        </button>
        <button type="button" class="payment-option" data-provider="stripe">
          <strong>${escapeHtml(paymentContent.cardLabel)}</strong>
          <span class="payment-option__note">Pago directo con tu link de tarjeta</span>
        </button>
      </div>

      <p class="muted">${escapeHtml(paymentContent.note)}</p>
    </form>

    <aside class="summary-card">
      <p class="section-label">Resumen</p>
      <h2>${formatCurrency(summary.total)}</h2>
      <div class="history-list">
        ${summary.items
          .map(
            (item) => `
              <div class="history-item">
                <strong>${item.nombre}</strong>
                <span>${item.cantidad} x ${formatCurrency(item.precio)}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </aside>
  `;

  const form = layout.querySelector(".js-checkout-form");

  async function proceedToPayment(provider, button) {
    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const direccionPayload = buildAddressFromFormData(formData);
    const telefono = String(formData.get("telefono") || "").trim();
    const paymentButtons = Array.from(layout.querySelectorAll("[data-provider]"));

    paymentButtons.forEach((item) => {
      item.classList.remove("is-selected");
      item.disabled = true;
    });
    button.classList.add("is-selected");

    try {
      const orderPayload = await apiRequest("/checkout/orders", {
        method: "POST",
        auth: true,
        body: {
          direccion: direccionPayload,
          proveedorPago: provider,
          telefono
        }
      });

      const methodLabel =
        provider === "paypal"
          ? paymentContent.paypalLabel
          : provider === "stripe"
            ? paymentContent.cardLabel
            : paymentContent.mercadoPagoLabel;
      const message = createCheckoutMessage(orderPayload.order, methodLabel);
      const selectedUrl =
        provider === "paypal"
          ? paymentContent.paypalUrl || paymentContent.whatsappUrl
          : provider === "stripe"
            ? paymentContent.cardUrl
            : paymentContent.mercadoPagoUrl || paymentContent.whatsappUrl;

      if (!selectedUrl) {
        throw new Error("Todavia no configuraste el link para este metodo de pago.");
      }

      if (provider === "stripe") {
        const redirectUrl = new URL(selectedUrl, window.location.origin);
        redirectUrl.searchParams.set("orderId", orderPayload.order.id);
        redirectUrl.searchParams.set("total", String(orderPayload.order.total));
        redirectUrl.searchParams.set("provider", provider);
        window.location.href = redirectUrl.toString();
        return;
      }

      window.location.href = buildWhatsAppMessageUrl(selectedUrl, message);
    } catch (error) {
      paymentButtons.forEach((item) => {
        item.disabled = false;
      });
      setSectionMessage(".page-stack", error.message, true);
    }
  }

  layout.querySelectorAll("[data-provider]").forEach((button) => {
    button.addEventListener("click", () => {
      proceedToPayment(button.dataset.provider, button);
    });
  });
}

async function renderCheckoutPage() {
  const layout = document.querySelector(".js-checkout-layout");

  if (!layout) {
    return;
  }

  if (!getToken()) {
    renderCheckoutLoggedOut(layout);
    return;
  }

  try {
    const [summary, dashboard] = await Promise.all([apiRequest("/checkout/summary", { auth: true }), loadAccountDashboard()]);
    renderCheckoutForm(layout, summary, dashboard.user);
  } catch (error) {
    layout.innerHTML = "";
    layout.appendChild(createStatusBox(error.message, true));
  }
}

async function renderPaymentStatusPage() {
  const layout = document.querySelector(".js-payment-status-layout");

  if (!layout) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || "pending";
  const provider = params.get("provider") || "";
  const orderId = params.get("orderId") || "";
  const paypalOrderId = params.get("token") || "";
  const mercadopagoPaymentId = params.get("payment_id") || "";
  const stripeSessionId = params.get("session_id") || "";

  layout.innerHTML = `
    <section class="summary-card payment-status-card">
      <p class="section-label">Resultado del pago</p>
      <h1>${status === "success" ? "Pago completado" : status === "cancel" ? "Pago cancelado" : "Pago pendiente"}</h1>
      <p class="muted js-payment-status-message">Validando informacion de la orden...</p>
      <div class="button-row">
        <a href="./cuenta.html" class="button button--primary">Ver mi perfil</a>
        <a href="./catalogo.html" class="button button--light">Volver al catalogo</a>
      </div>
    </section>
  `;

  const message = layout.querySelector(".js-payment-status-message");

  if (!getToken()) {
    message.textContent = "Inicia sesion con la misma cuenta para confirmar el estado del pago.";
    return;
  }

  try {
    if (status === "success" && provider === "paypal" && paypalOrderId) {
      await apiRequest("/payments/paypal/capture", {
        method: "POST",
        auth: true,
        body: {
          orderId,
          paypalOrderId
        }
      });
      message.textContent = "El pago con PayPal ya fue capturado correctamente.";
      return;
    }

    if ((status === "success" || status === "pending") && provider === "mercadopago" && mercadopagoPaymentId) {
      await apiRequest("/payments/mercadopago/confirm", {
        method: "POST",
        auth: true,
        body: {
          orderId,
          paymentId: mercadopagoPaymentId
        }
      });
      message.textContent = "El pago con Mercado Pago ya fue validado.";
      return;
    }

    if (status === "success" && provider === "stripe" && stripeSessionId) {
      await apiRequest("/payments/stripe/confirm", {
        method: "POST",
        auth: true,
        body: {
          orderId,
          sessionId: stripeSessionId
        }
      });
      message.textContent = "El pago con tarjeta ya fue validado.";
      return;
    }

    if (status === "cancel") {
      message.textContent = "El proveedor marco esta operacion como cancelada.";
      return;
    }

    message.textContent = "La orden regreso desde el proveedor. Revisa tu perfil para ver el estado actualizado.";
  } catch (error) {
    message.textContent = error.message;
  }
}

function bindHeaderSearch() {
  document.querySelectorAll(".js-search-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector(".js-header-search");
      const search = input?.value.trim();
      const nextUrl = search ? `./catalogo.html?search=${encodeURIComponent(search)}` : "./catalogo.html";
      window.location.href = nextUrl;
    });
  });
}

async function init() {
  const page = document.body.dataset.page;
  const siteContent = await loadSiteContent();

  if (page !== "account" && !getToken()) {
    redirectToAccountGate();
    return;
  }

  applySiteContent(siteContent);
  hydrateCountrySelects(document);

  bindHeaderSearch();
  await hydrateSession();

  if (page !== "account" && !getStoredUser()) {
    redirectToAccountGate();
    return;
  }

  await refreshHeaderState();

  if (page === "home") {
    await renderHomePage();
  }

  if (page === "catalog") {
    await renderCatalogPage();
  }

  if (page === "product") {
    await renderProductPage();
  }

  if (page === "cart") {
    await renderCartPage();
  }

  if (page === "account") {
    await renderAccountPage();
  }

  if (page === "admin-user") {
    await renderAdminUserDetailPage();
  }

  if (page === "checkout") {
    await renderCheckoutPage();
  }

  if (page === "payment-status") {
    await renderPaymentStatusPage();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => {
    console.error(error);
  });
});
