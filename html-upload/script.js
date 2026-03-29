const API_URL = window.MARKETZONE_CONFIG?.apiUrl || `${window.location.origin}/api`;
const tokenKey = "marketzone_html_token";
const userKey = "marketzone_html_user";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
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

async function apiRequest(path, options = {}) {
  const { method = "GET", body, auth = false } = options;
  const headers = new Headers();

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();

    if (!token) {
      throw new Error("Necesitas iniciar sesion.");
    }

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

function normalizeProduct(product) {
  return {
    id: product.id,
    categoria: product.categoria,
    nombre: product.nombre,
    descripcion: product.descripcion,
    precio: product.precio,
    stock: product.stock,
    imagen: product.imagenes?.[0] || "https://via.placeholder.com/900x675?text=MarketZone",
    tags: product.tags || []
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

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  article.innerHTML = `
    <div class="product-card__image">
      <img src="${product.imagen}" alt="${product.nombre}" />
    </div>
    <div class="product-card__body">
      <span class="product-card__category">${product.categoria}</span>
      <h3>${product.nombre}</h3>
      <p>${product.descripcion}</p>
      <div class="tag-row">
        ${product.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
    </div>
    <div class="product-card__footer">
      <div class="product-card__price">
        <strong>${formatCurrency(product.precio)}</strong>
        <small>Stock ${product.stock}</small>
      </div>
      <button type="button" class="button button--primary">Agregar</button>
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
    meta.textContent = category ? `Categoria activa: ${category}` : "Mostrando todo el catalogo";

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

function renderLoggedOutCart() {
  const cartContainer = document.querySelector(".js-cart-items");
  const summary = document.querySelector(".js-cart-summary");

  if (!cartContainer || !summary) {
    return;
  }

  cartContainer.innerHTML = `
    <div class="empty-state">
      <h2>Inicia sesion para ver tu carrito</h2>
      <p>El carrito ya esta conectado a tu cuenta real dentro del backend.</p>
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
        <img src="${item.imagenes?.[0] || "https://via.placeholder.com/900x675?text=MarketZone"}" alt="${item.nombre}" />
        <div class="cart-item__body">
          <span class="product-card__category">${item.categoria}</span>
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
      <p class="muted">Este carrito ya pertenece al usuario autenticado dentro del backend.</p>
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
  const ordenesHtml = renderHistoryList(
    dashboard.historial.ordenes || [],
    (item) => `
      <div class="history-item">
        <strong>${item.id}</strong>
        <span>${formatCurrency(item.total)} - ${item.estado}</span>
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
    <p class="section-label">Perfil real</p>
    <h2>${dashboard.user.nombre}</h2>
    <p class="muted">${dashboard.user.email}</p>
    <form class="profile-update-form">
      <div class="profile-grid">
        <label>
          Calle
          <input name="calle" type="text" value="${direccion.calle || ""}" />
        </label>
        <label>
          Ciudad
          <input name="ciudad" type="text" value="${direccion.ciudad || ""}" />
        </label>
        <label>
          Estado
          <input name="estado" type="text" value="${direccion.estado || ""}" />
        </label>
        <label>
          Codigo postal
          <input name="cp" type="text" value="${direccion.cp || ""}" />
        </label>
        <label>
          Pais
          <input name="pais" type="text" value="${direccion.pais || ""}" />
        </label>
      </div>
      <button type="submit" class="button button--primary">Guardar direccion</button>
    </form>
    <div class="history-grid">
      <section>
        <h3>Ordenes</h3>
        ${ordenesHtml}
      </section>
      <section>
        <h3>Busquedas</h3>
        ${busquedasHtml}
      </section>
      <section>
        <h3>Productos vistos</h3>
        ${vistosHtml}
      </section>
    </div>
  `;

  profileCard.querySelector(".profile-update-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const direccionPayload = buildAddressFromFormData(formData);

    try {
      const payload = await apiRequest("/users/me", {
        method: "PUT",
        auth: true,
        body: {
          direccion: direccionPayload
        }
      });
      setAuthSession({ user: payload.user });
      setSectionMessage(".page-stack", "Direccion actualizada correctamente.");
      const nextDashboard = await loadAccountDashboard();
      renderAccountDashboard(nextDashboard);
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
  });
}

async function renderAccountPage() {
  const registerForm = document.querySelector(".js-register-form");
  const loginForm = document.querySelector(".js-login-form");
  const logoutButton = document.querySelector(".js-logout-button");
  const profileCard = document.querySelector(".js-profile-card");

  if (!registerForm || !loginForm || !logoutButton || !profileCard) {
    return;
  }

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const direccion = buildAddressFromFormData(formData);

    try {
      const payload = await apiRequest("/auth/register", {
        method: "POST",
        body: {
          nombre: String(formData.get("nombre") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          password: String(formData.get("password") || "")
        }
      });

      setAuthSession(payload);

      if (hasAddressData(direccion)) {
        const updated = await apiRequest("/users/me", {
          method: "PUT",
          auth: true,
          body: {
            direccion
          }
        });
        setAuthSession({ user: updated.user });
      }

      setSectionMessage(".page-stack", "Cuenta creada y enlazada con la app real.");
      registerForm.reset();
      const dashboard = await loadAccountDashboard();
      renderAccountDashboard(dashboard);
      await refreshHeaderState();
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
      setSectionMessage(".page-stack", "Sesion iniciada.");
      const dashboard = await loadAccountDashboard();
      renderAccountDashboard(dashboard);
      await refreshHeaderState();
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
  });

  logoutButton.addEventListener("click", async () => {
    clearAuthSession();
    profileCard.className = "profile-card js-profile-card is-hidden";
    profileCard.innerHTML = "";
    setSectionMessage(".page-stack", "Sesion cerrada.");
    await refreshHeaderState();
  });

  if (getToken()) {
    try {
      const dashboard = await loadAccountDashboard();
      renderAccountDashboard(dashboard);
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
  } else {
    profileCard.className = "profile-card js-profile-card is-hidden";
  }
}

function renderCheckoutLoggedOut(layout) {
  layout.innerHTML = `
    <div class="empty-state">
      <h2>Inicia sesion para continuar con tu compra</h2>
      <p>El checkout esta enlazado con tu usuario y tu carrito real.</p>
      <a href="./cuenta.html" class="button button--primary">Ir a mi cuenta</a>
    </div>
  `;
}

function renderCheckoutForm(layout, summary, user) {
  const direccion = user?.direccion || {};

  layout.innerHTML = `
    <form class="form-card checkout-card js-checkout-form">
      <h2>Direccion de envio</h2>
      <div class="profile-grid">
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
        <input name="pais" type="text" value="${direccion.pais || "MX"}" required />
      </label>

      <div class="payment-options">
        <button type="button" class="payment-option is-selected" data-provider="mercadopago">
          <strong>Mercado Pago</strong>
          <span>Recomendado para Mexico</span>
        </button>
        <button type="button" class="payment-option" data-provider="paypal">
          <strong>PayPal</strong>
          <span>Pago externo y captura automatica</span>
        </button>
      </div>

      <p class="muted">Stripe sigue disponible en el backend, pero esta version HTML ya queda completa con PayPal y Mercado Pago.</p>
      <button type="submit" class="button button--primary">Crear orden y continuar</button>
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

  let selectedProvider = "mercadopago";

  layout.querySelectorAll("[data-provider]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedProvider = button.dataset.provider;
      layout.querySelectorAll("[data-provider]").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
    });
  });

  layout.querySelector(".js-checkout-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const direccionPayload = buildAddressFromFormData(formData);

    try {
      const orderPayload = await apiRequest("/checkout/orders", {
        method: "POST",
        auth: true,
        body: {
          direccion: direccionPayload,
          proveedorPago: selectedProvider
        }
      });

      if (selectedProvider === "paypal") {
        const payment = await apiRequest("/payments/paypal/order", {
          method: "POST",
          auth: true,
          body: {
            orderId: orderPayload.order.id
          }
        });

        if (!payment.approvalUrl) {
          throw new Error("PayPal no devolvio la URL de aprobacion.");
        }

        window.location.href = payment.approvalUrl;
        return;
      }

      const payment = await apiRequest("/payments/mercadopago/preference", {
        method: "POST",
        auth: true,
        body: {
          orderId: orderPayload.order.id
        }
      });

      if (!payment.initPoint) {
        throw new Error("Mercado Pago no devolvio la URL de pago.");
      }

      window.location.href = payment.initPoint;
    } catch (error) {
      setSectionMessage(".page-stack", error.message, true);
    }
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
  bindHeaderSearch();
  await hydrateSession();
  await refreshHeaderState();

  const page = document.body.dataset.page;

  if (page === "home") {
    await renderHomePage();
  }

  if (page === "catalog") {
    await renderCatalogPage();
  }

  if (page === "cart") {
    await renderCartPage();
  }

  if (page === "account") {
    await renderAccountPage();
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
