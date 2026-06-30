import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const initialProduct = {
  id: null,
  nombre: "",
  slug: "",
  descripcion: "",
  descripcionCorta: "",
  marca: "",
  precio: "",
  precioDescuento: "",
  stock: "",
  vendidos: "",
  categoria: "tecnologia",
  imagenes: [],
  tags: "",
  caracteristicas: "",
  garantia: "",
  devolucion: "",
  infoEnvio: "",
  fechaEstimada: "",
  disponibilidad: "Disponible",
  vendedorOficial: "",
  mostrarSelloOficial: false,
  envioGratis: false,
  mostrarEnvioGratis: false
};

const initialBanner = { titulo: "", subtitulo: "", mediaUrl: "", linkUrl: "/catalogo", activa: true, orden: 1 };
const initialVideo = { titulo: "", descripcion: "", videoUrl: "", posterUrl: "", activa: true, orden: 1 };
const initialMusic = { titulo: "", artista: "", audioUrl: "", portadaUrl: "", activa: true, orden: 1 };
const initialPartner = { name: "", logoUrl: "" };
const initialReview = { id: null, productId: "", reviewerName: "", rating: "5", comentario: "" };
const defaultStoreStatusCards = [
  {
    title: "Productos eliminados",
    text: "El inventario visible fue retirado para crear una nueva coleccion con estandar mas alto."
  },
  {
    title: "Ventas restauradas",
    text: "La seccion comercial se mantiene limpia para iniciar un nuevo ciclo de ventas desde base renovada."
  },
  {
    title: "Experiencia mejorada",
    text: "Navegacion renovada, botones de accion rapida y un look mucho mas profesional."
  }
];
const shippingIconOptions = [
  { id: "avion", label: "Avion", icon: "✈" },
  { id: "barco", label: "Barco", icon: "🚢" },
  { id: "tren", label: "Tren", icon: "🚆" },
  { id: "coche", label: "Coche", icon: "🚗" },
  { id: "moto", label: "Moto", icon: "🏍" }
];
const initialCatalogGenerator = {
  total: "10000",
  batchSize: "250",
  offset: "0",
  category: "tecnologia",
  includeImages: true
};

function statusLabel(status) {
  const value = String(status || "").trim().toLowerCase();
  if (["paid", "pagado"].includes(value)) return "Pagado";
  if (["cancelled", "canceled", "cancelado"].includes(value)) return "Cancelado";
  if (["pending_payment", "pending", "pendiente", "pago_pendiente", "created", "processing"].includes(value)) {
    return "Pendiente por pagar";
  }
  return "Pendiente por pagar";
}

function statusClass(status) {
  const value = String(status || "").trim().toLowerCase();
  if (["paid", "pagado"].includes(value)) return "status-pill status-pill--paid";
  if (["cancelled", "canceled", "cancelado"].includes(value)) return "status-pill status-pill--cancelled";
  return "status-pill status-pill--pending";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

function formatAddress(address) {
  if (!address || typeof address !== "object") {
    return "Sin direccion";
  }

  return Object.entries(address)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ") || "Sin direccion";
}

function getStoreStatusCard(homepage, index) {
  const cards = Array.isArray(homepage?.storeStatusCards) ? homepage.storeStatusCards : [];
  return {
    title: cards[index]?.title ?? defaultStoreStatusCards[index]?.title ?? "",
    text: cards[index]?.text ?? defaultStoreStatusCards[index]?.text ?? ""
  };
}

function normalizeAdminUserDetail(detail) {
  const cartItems = Array.isArray(detail?.cart)
    ? detail.cart
    : Array.isArray(detail?.cart?.items)
      ? detail.cart.items
      : [];
  const orders = Array.isArray(detail?.orders)
    ? detail.orders
    : Array.isArray(detail?.historial?.ordenes)
      ? detail.historial.ordenes
      : [];

  return {
    ...detail,
    cart: cartItems,
    orders
  };
}

function removeWhiteBackgroundFromImage(dataUrl, threshold = 242) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        resolve(dataUrl);
        return;
      }

      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];

        // Remove near-white backgrounds (common in logos exported with white canvas).
        if (red >= threshold && green >= threshold && blue >= threshold) {
          pixels[index + 3] = 0;
        }
      }

      context.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export function AdminPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [content, setContent] = useState({ homepage: {}, general: {}, banners: [], videos: [], music: [] });
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [trackingDraft, setTrackingDraft] = useState("[]");
  const [productForm, setProductForm] = useState(initialProduct);
  const [bannerForm, setBannerForm] = useState(initialBanner);
  const [videoForm, setVideoForm] = useState(initialVideo);
  const [musicForm, setMusicForm] = useState(initialMusic);
  const [partnerForm, setPartnerForm] = useState(initialPartner);
  const [reviewForm, setReviewForm] = useState(initialReview);
  const [generatorForm, setGeneratorForm] = useState(initialCatalogGenerator);
  const [importJson, setImportJson] = useState("");
  const [runningBulkTask, setRunningBulkTask] = useState(false);
  const [message, setMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [folioSearch, setFolioSearch] = useState("");
  const [folioResults, setFolioResults] = useState([]);

  const loadAdmin = async () => {
    const [summaryPayload, productsPayload, ordersPayload, usersPayload, reviewsPayload, categoriesPayload, contentPayload, foliosPayload] =
      await Promise.all([
        apiFetch("/admin/summary", { token }),
        apiFetch("/admin/products", { token }),
        apiFetch("/admin/orders", { token }),
        apiFetch(`/admin/users${userSearch ? `?search=${encodeURIComponent(userSearch)}` : ""}`, { token }),
        apiFetch("/admin/reviews", { token }),
        apiFetch("/admin/categories", { token }),
        apiFetch("/admin/content", { token }),
        apiFetch("/admin/folios", { token })
      ]);

    setSummary(summaryPayload);
    setProducts(productsPayload.items || []);
    setOrders(ordersPayload.items || []);
    setUsers(usersPayload.items || []);
    setReviews(reviewsPayload.items || []);
    setCategories(categoriesPayload.items || []);
    setFolioResults(foliosPayload.items || []);
    setContent({
      homepage: contentPayload.homepage || {},
      general: contentPayload.general || {},
      banners: contentPayload.banners || [],
      videos: contentPayload.videos || [],
      music: contentPayload.music || []
    });
  };

  useEffect(() => {
    loadAdmin().catch((error) => setMessage(error.message));
  }, [token, userSearch]);

  const searchFolios = async () => {
    const payload = await apiFetch(`/admin/folios${folioSearch ? `?search=${encodeURIComponent(folioSearch)}` : ""}`, { token });
    setFolioResults(payload.items || []);
  };

  const metrics = useMemo(
    () => [
      { label: "Usuarios", value: summary?.usuarios || 0 },
      { label: "Productos", value: summary?.productosActivos || 0 },
      { label: "Pedidos", value: summary?.ordenes || 0 },
      { label: "Ingresos", value: `$${summary?.ingresos?.toFixed(2) || "0.00"}` }
    ],
    [summary]
  );

  const resetProductForm = () => setProductForm(initialProduct);

  const fillProductForm = (product) => {
    setProductForm({
      id: product.id,
      nombre: product.nombre || "",
      slug: product.slug || "",
      descripcion: product.descripcion || "",
      descripcionCorta: product.descripcionCorta || "",
      marca: product.marca || "",
      precio: String(product.precioOriginal > 0 ? product.precioOriginal : product.precio || ""),
      precioDescuento: String(product.precioDescuento || ""),
      stock: String(product.stock || ""),
      vendidos: String(product.vendidos || 0),
      categoria: product.categoria || "tecnologia",
      imagenes: product.imagenes || [],
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
      caracteristicas: Array.isArray(product.caracteristicas) ? product.caracteristicas.join("\n") : "",
      garantia: product.garantia || "",
      devolucion: product.devolucion || "",
      infoEnvio: product.infoEnvio || "",
      fechaEstimada: product.fechaEstimada || "",
      disponibilidad: product.disponibilidad || "Disponible",
      vendedorOficial: product.vendedorOficial || "",
      mostrarSelloOficial: Boolean(product.mostrarSelloOficial),
      envioGratis: Boolean(product.envioGratis),
      mostrarEnvioGratis: Boolean(product.mostrarEnvioGratis)
    });
    setTab("products");
  };

  const uploadMultiple = async (files) => {
    const results = [];
    for (const file of Array.from(files || [])) {
      results.push(await fileToDataUrl(file));
    }
    return results;
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...productForm,
        precio: Number(productForm.precio || 0),
        precioDescuento: Number(productForm.precioDescuento || 0),
        stock: Number(productForm.stock || 0),
        vendidos: Number(productForm.vendidos || 0),
        tags: productForm.tags,
        caracteristicas: productForm.caracteristicas
      };
      const path = productForm.id ? `/admin/products/${productForm.id}` : "/admin/products";
      const method = productForm.id ? "PUT" : "POST";
      await apiFetch(path, { method, token, body: payload });
      resetProductForm();
      setMessage(productForm.id ? "Producto actualizado correctamente." : "Producto creado correctamente.");
      await loadAdmin();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const runMassCatalogGeneration = async () => {
    const total = Math.max(1, Number(generatorForm.total || 0));
    const batchSize = Math.max(1, Math.min(500, Number(generatorForm.batchSize || 0)));
    let offset = Math.max(0, Number(generatorForm.offset || 0));

    if (!Number.isFinite(total) || !Number.isFinite(batchSize) || !Number.isFinite(offset)) {
      setMessage("Revisa total, tamano de lote y offset para generar el catalogo.");
      return;
    }

    setRunningBulkTask(true);
    try {
      let remaining = total;
      let createdTotal = 0;
      let failedTotal = 0;

      while (remaining > 0) {
        const chunk = Math.min(batchSize, remaining);
        const response = await apiFetch("/admin/products/generate", {
          method: "POST",
          token,
          body: {
            count: chunk,
            offset,
            includeImages: generatorForm.includeImages,
            category: generatorForm.category
          }
        });

        createdTotal += Number(response.created || 0);
        failedTotal += Number(response.failed || 0);
        offset = Number(response.nextOffset || offset + chunk);
        remaining -= chunk;
        setMessage(`Generando catalogo... ${total - remaining}/${total} productos procesados.`);
      }

      setGeneratorForm((current) => ({ ...current, offset: String(offset) }));
      await loadAdmin();
      setMessage(`Catalogo masivo listo. Creados: ${createdTotal}. Fallidos: ${failedTotal}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setRunningBulkTask(false);
    }
  };

  const importProductsFromJson = async () => {
    if (!importJson.trim()) {
      setMessage("Pega un JSON valido con un arreglo de productos para importar.");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(importJson);
    } catch {
      setMessage("El JSON no tiene un formato valido.");
      return;
    }

    const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [];
    if (!items.length) {
      setMessage("No se encontraron productos en el JSON.");
      return;
    }

    setRunningBulkTask(true);
    try {
      let createdTotal = 0;
      let failedTotal = 0;
      const chunkSize = 200;

      for (let start = 0; start < items.length; start += chunkSize) {
        const chunk = items.slice(start, start + chunkSize);
        const response = await apiFetch("/admin/products/import", {
          method: "POST",
          token,
          body: { items: chunk }
        });
        createdTotal += Number(response.created || 0);
        failedTotal += Number(response.failed || 0);
        setMessage(`Importando productos... ${Math.min(start + chunk.length, items.length)}/${items.length}.`);
      }

      await loadAdmin();
      setImportJson("");
      setMessage(`Importacion completada. Creados: ${createdTotal}. Fallidos: ${failedTotal}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setRunningBulkTask(false);
    }
  };

  const deleteProductItem = async (productId) => {
    if (!window.confirm("Se eliminara este producto. ¿Deseas continuar?")) {
      return;
    }

    await apiFetch(`/admin/products/${productId}`, {
      method: "DELETE",
      token
    });
    await loadAdmin();
    if (Number(productForm.id) === Number(productId)) {
      resetProductForm();
    }
    setMessage("Producto eliminado.");
  };

  const updateOrderStatus = async (orderId, estado) => {
    await apiFetch(`/admin/orders/${orderId}`, {
      method: "PATCH",
      token,
      body: { estado }
    });
    await loadAdmin();
    if (selectedUser?.user?.id) {
      await openUser(selectedUser.user.id);
    }
    setMessage("Pedido actualizado.");
  };

  const updateTracking = async (orderId) => {
    await apiFetch(`/admin/orders/${orderId}`, {
      method: "PUT",
      token,
      body: {
        tracking: JSON.parse(trackingDraft)
      }
    });
    await loadAdmin();
    setMessage("Seguimiento actualizado.");
  };

  const updateOrderItemLocal = (orderId, itemId, changes) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              items: (order.items || []).map((item) => (Number(item.id) === Number(itemId) ? { ...item, ...changes } : item))
            }
          : order
      )
    );
  };

  const saveOrderItemShipping = async (orderId, item) => {
    await apiFetch(`/admin/order-items/${item.id}/shipping`, {
      method: "PATCH",
      token,
      body: {
        entregaEstimada: item.entregaEstimada || "",
        detalleEnvio: item.detalleEnvio || "",
        iconoEnvio: item.iconoEnvio || "coche"
      }
    });
    await loadAdmin();
    if (selectedUser?.user?.id) {
      await openUser(selectedUser.user.id);
    }
    setMessage("Informacion de envio actualizada.");
  };

  const removeOrder = async (orderId) => {
    if (!window.confirm("Se eliminara este pedido. ¿Deseas continuar?")) {
      return;
    }
    await apiFetch(`/admin/orders/${orderId}`, {
      method: "DELETE",
      token
    });
    await loadAdmin();
    if (selectedUser?.user?.id) {
      await openUser(selectedUser.user.id);
    }
    setMessage("Pedido eliminado.");
  };

  const openUser = async (userId) => {
    const detail = await apiFetch(`/admin/users/${userId}`, { token });
    setSelectedUser(normalizeAdminUserDetail(detail));
    setTab("users");
  };

  const toggleUserActive = async (userId, nextIsActive) => {
    try {
      await apiFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        token,
        body: { isActive: nextIsActive }
      });
      await loadAdmin();
      if (selectedUser?.user?.id === userId) {
        await openUser(userId);
      }
      setMessage(nextIsActive ? "Cuenta activada." : "Cuenta desactivada.");
    } catch (error) {
      setMessage(error.message || "No se pudo actualizar el estado de la cuenta.");
    }
  };

  const saveHomepage = async () => {
    await apiFetch("/admin/content/homepage", {
      method: "PUT",
      token,
      body: content.homepage
    });
    await apiFetch("/admin/content/general", {
      method: "PUT",
      token,
      body: content.general
    });
    await loadAdmin();
    setMessage("Portada y datos generales actualizados.");
  };

  const saveTerms = async () => {
    await apiFetch("/admin/content/general", {
      method: "PUT",
      token,
      body: {
        ...content.general,
        termsAndConditions: content.general.termsAndConditions || ""
      }
    });
    await loadAdmin();
    setMessage("Terminos y condiciones actualizados.");
  };

  const saveBanner = async (event) => {
    event.preventDefault();
    await apiFetch("/admin/banners", {
      method: "POST",
      token,
      body: { ...bannerForm, id: undefined }
    });
    setBannerForm(initialBanner);
    await loadAdmin();
    setMessage("Banner guardado.");
  };

  const saveVideo = async (event) => {
    event.preventDefault();
    await apiFetch("/admin/videos", {
      method: "POST",
      token,
      body: { ...videoForm, id: undefined }
    });
    setVideoForm(initialVideo);
    await loadAdmin();
    setMessage("Video guardado.");
  };

  const saveMusic = async (event) => {
    event.preventDefault();
    await apiFetch("/admin/music", {
      method: "POST",
      token,
      body: { ...musicForm, id: undefined }
    });
    setMusicForm(initialMusic);
    await loadAdmin();
    setMessage("Pista guardada.");
  };

  const setTrackAsActive = async (track) => {
    const requests = (content.music || []).map((item) =>
      apiFetch(`/admin/music/${item.id}`, {
        method: "PATCH",
        token,
        body: {
          ...item,
          activa: Number(item.id) === Number(track.id)
        }
      })
    );
    await Promise.all(requests);
    await loadAdmin();
    setMessage(`Pista activa actual: ${track.titulo}`);
  };

  const addPartnerLogo = async (event) => {
    event.preventDefault();
    const logos = Array.isArray(content.general.partnerLogos) ? content.general.partnerLogos : [];
    const next = [...logos, { id: crypto.randomUUID(), ...partnerForm }];
    await apiFetch("/admin/content/general", {
      method: "PUT",
      token,
      body: {
        ...content.general,
        partnerLogos: next
      }
    });
    setPartnerForm(initialPartner);
    await loadAdmin();
    setMessage("Empresa asociada agregada.");
  };

  const removePartnerLogo = async (partnerId) => {
    const logos = Array.isArray(content.general.partnerLogos) ? content.general.partnerLogos : [];
    await apiFetch("/admin/content/general", {
      method: "PUT",
      token,
      body: {
        ...content.general,
        partnerLogos: logos.filter((item) => String(item.id) !== String(partnerId))
      }
    });
    await loadAdmin();
    setMessage("Empresa asociada eliminada.");
  };

  const deleteMedia = async (type, id) => {
    await apiFetch(`/admin/media/${type}/${id}`, {
      method: "DELETE",
      token
    });
    await loadAdmin();
  };

  const deleteReview = async (reviewId) => {
    await apiFetch(`/admin/reviews/${reviewId}`, {
      method: "DELETE",
      token
    });
    await loadAdmin();
  };

  const resetReviewForm = () => {
    setReviewForm(initialReview);
  };

  const fillReviewForm = (review) => {
    setReviewForm({
      id: review.id,
      productId: String(review.productoId || ""),
      reviewerName: review.reviewerName || review.usuarioNombre || "",
      rating: String(review.rating || 5),
      comentario: review.comentario || ""
    });
  };

  const saveReview = async (event) => {
    event.preventDefault();
    const method = reviewForm.id ? "PATCH" : "POST";
    const path = reviewForm.id ? `/admin/reviews/${reviewForm.id}` : "/admin/reviews";
    const payload = await apiFetch(path, {
      method,
      token,
      body: {
        productId: reviewForm.productId,
        reviewerName: reviewForm.reviewerName,
        rating: reviewForm.rating,
        comentario: reviewForm.comentario
      }
    });
    setReviews(payload.items || []);
    resetReviewForm();
    setMessage(reviewForm.id ? "Reseña actualizada." : "Reseña creada.");
  };

  const selectedUserCart = selectedUser?.cart || [];
  const selectedUserOrders = selectedUser?.orders || [];

  return (
    <div className="page-stack">
      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Panel administrador</p>
            <h1>Control total de Gray C Shop</h1>
          </div>
          {message && <p className="inline-message">{message}</p>}
        </div>

        <div className="admin-tabs">
          {[
            ["dashboard", "Dashboard"],
            ["home", "Inicio"],
            ["products", "Productos"],
            ["users", "Usuarios"],
            ["orders", "Pedidos"],
            ["folios", "Buscador de folios"],
            ["reviews", "Reseñas"],
            ["categories", "Categorias"],
            ["content", "Portada y medios"],
            ["terms", "Terminos"]
          ].map(([id, label]) => (
            <button key={id} type="button" className={`pill${tab === id ? " is-active" : ""}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {tab === "dashboard" && (
        <>
          <section className="metrics-row">
            {metrics.map((item) => (
              <article key={item.label} className="metric-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </section>

          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Resumen</p>
                <h2>Lo que puedes administrar desde aqui</h2>
              </div>
            </div>
            <div className="list-stack">
              <article className="mini-item"><strong>Productos</strong><span>Subir, editar, activar, desactivar y eliminar.</span></article>
              <article className="mini-item"><strong>Usuarios</strong><span>Ver datos, carrito, pedidos y seguimiento.</span></article>
              <article className="mini-item"><strong>Portada</strong><span>Textos, banners, videos, musica y logos asociados.</span></article>
              <article className="mini-item"><strong>Pedidos</strong><span>Cambiar estado, ajustar seguimiento y eliminar si aplica.</span></article>
            </div>
          </section>

          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Dashboard editable</p>
                <h2>Personaliza mensaje y portada principal</h2>
              </div>
            </div>
            <label>
              Mensaje superior
              <input
                value={content.homepage.announcement || ""}
                onChange={(event) => setContent((current) => ({ ...current, homepage: { ...current.homepage, announcement: event.target.value } }))}
              />
            </label>
            <label>
              Titulo principal
              <textarea
                rows="3"
                value={content.homepage.heroTitle || ""}
                onChange={(event) => setContent((current) => ({ ...current, homepage: { ...current.homepage, heroTitle: event.target.value } }))}
              />
            </label>
            <button type="button" className="button button--primary" onClick={saveHomepage}>
              Guardar cambios del dashboard
            </button>
          </section>
        </>
      )}

      {tab === "products" && (
        <div className="admin-grid">
          <form className="section-card admin-product-form" onSubmit={saveProduct}>
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">{productForm.id ? "Editar producto" : "Nuevo producto"}</p>
                <h2>{productForm.id ? "Actualiza el producto seleccionado" : "Sube un producto al catalogo"}</h2>
              </div>
              {productForm.id && (
                <button type="button" className="button button--ghost" onClick={resetProductForm}>
                  Nuevo
                </button>
              )}
            </div>
            <div className="form-grid form-grid--wide">
              <label>
                Nombre
                <input value={productForm.nombre} onChange={(event) => setProductForm((current) => ({ ...current, nombre: event.target.value }))} required />
              </label>
              <label>
                Slug
                <input value={productForm.slug} onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value }))} />
              </label>
              <label>
                Categoria
                <select value={productForm.categoria} onChange={(event) => setProductForm((current) => ({ ...current, categoria: event.target.value }))}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Marca
                <input value={productForm.marca} onChange={(event) => setProductForm((current) => ({ ...current, marca: event.target.value }))} />
              </label>
              <label>
                Precio normal
                <input value={productForm.precio} onChange={(event) => setProductForm((current) => ({ ...current, precio: event.target.value }))} required />
              </label>
              <label>
                Precio con descuento
                <input value={productForm.precioDescuento} onChange={(event) => setProductForm((current) => ({ ...current, precioDescuento: event.target.value }))} />
              </label>
              <label>
                Stock
                <input value={productForm.stock} onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))} required />
              </label>
              <label>
                Vendidos
                <input value={productForm.vendidos} onChange={(event) => setProductForm((current) => ({ ...current, vendidos: event.target.value }))} />
              </label>
              <label>
                Disponibilidad
                <input value={productForm.disponibilidad} onChange={(event) => setProductForm((current) => ({ ...current, disponibilidad: event.target.value }))} />
              </label>
              <label>
                Vendedor oficial
                <input value={productForm.vendedorOficial} onChange={(event) => setProductForm((current) => ({ ...current, vendedorOficial: event.target.value }))} placeholder="Gray C Shop" />
              </label>
            </div>
            <label>
              Descripcion corta
              <input value={productForm.descripcionCorta} onChange={(event) => setProductForm((current) => ({ ...current, descripcionCorta: event.target.value }))} />
            </label>
            <label>
              Descripcion completa
              <textarea rows="5" value={productForm.descripcion} onChange={(event) => setProductForm((current) => ({ ...current, descripcion: event.target.value }))} required />
            </label>
            <label>
              Tags
              <input value={productForm.tags} onChange={(event) => setProductForm((current) => ({ ...current, tags: event.target.value }))} placeholder="ia, premium, laptop, hogar" />
            </label>
            <label>
              Caracteristicas
              <textarea rows="5" value={productForm.caracteristicas} onChange={(event) => setProductForm((current) => ({ ...current, caracteristicas: event.target.value }))} placeholder="Una caracteristica por linea" />
            </label>
            <div className="form-grid form-grid--wide">
              <label>
                Informacion de envio
                <input value={productForm.infoEnvio} onChange={(event) => setProductForm((current) => ({ ...current, infoEnvio: event.target.value }))} />
              </label>
              <label>
                Fecha estimada
                <input value={productForm.fechaEstimada} onChange={(event) => setProductForm((current) => ({ ...current, fechaEstimada: event.target.value }))} />
              </label>
              <label>
                Garantia
                <input value={productForm.garantia} onChange={(event) => setProductForm((current) => ({ ...current, garantia: event.target.value }))} />
              </label>
              <label>
                Devolucion
                <input value={productForm.devolucion} onChange={(event) => setProductForm((current) => ({ ...current, devolucion: event.target.value }))} />
              </label>
            </div>
            <label>
              Subir imagenes
              <small className="field-help">Puedes subir varias fotos. La primera sera la imagen principal del producto.</small>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={async (event) => {
                  const files = await uploadMultiple(event.target.files);
                  setProductForm((current) => ({ ...current, imagenes: [...current.imagenes, ...files] }));
                }}
              />
            </label>
            <div className="admin-product-preview-grid">
              {productForm.imagenes.map((image, index) => (
                <img key={index} className="media-thumb" src={image} alt={`preview-${index}`} />
              ))}
            </div>
            <div className="checkbox-row">
              <label className="checkbox-chip">
                <input type="checkbox" checked={productForm.envioGratis} onChange={(event) => setProductForm((current) => ({ ...current, envioGratis: event.target.checked }))} />
                Envio gratis
              </label>
              <label className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={productForm.mostrarEnvioGratis}
                  onChange={(event) => setProductForm((current) => ({ ...current, mostrarEnvioGratis: event.target.checked }))}
                />
                Mostrar envio gratis
              </label>
              <label className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={productForm.mostrarSelloOficial}
                  onChange={(event) => setProductForm((current) => ({ ...current, mostrarSelloOficial: event.target.checked }))}
                />
                Mostrar sello oficial con palomita verde
              </label>
            </div>
            <button type="submit" className="button button--primary">
              {productForm.id ? "Guardar cambios" : "Crear producto"}
            </button>
          </form>

          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Carga masiva</p>
                <h2>Generar o importar miles de productos</h2>
              </div>
            </div>
            <div className="form-grid form-grid--wide">
              <label>
                Total a generar
                <input
                  value={generatorForm.total}
                  onChange={(event) => setGeneratorForm((current) => ({ ...current, total: event.target.value }))}
                  disabled={runningBulkTask}
                />
              </label>
              <label>
                Tamano por lote (max 500)
                <input
                  value={generatorForm.batchSize}
                  onChange={(event) => setGeneratorForm((current) => ({ ...current, batchSize: event.target.value }))}
                  disabled={runningBulkTask}
                />
              </label>
              <label>
                Offset inicial
                <input
                  value={generatorForm.offset}
                  onChange={(event) => setGeneratorForm((current) => ({ ...current, offset: event.target.value }))}
                  disabled={runningBulkTask}
                />
              </label>
              <label>
                Categoria fija
                <select
                  value={generatorForm.category}
                  onChange={(event) => setGeneratorForm((current) => ({ ...current, category: event.target.value }))}
                  disabled={runningBulkTask}
                >
                  {categories.map((category) => (
                    <option key={`generator-${category.id}`} value={category.slug}>
                      {category.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="checkbox-row">
              <label className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={generatorForm.includeImages}
                  onChange={(event) => setGeneratorForm((current) => ({ ...current, includeImages: event.target.checked }))}
                  disabled={runningBulkTask}
                />
                Incluir imagen por URL (placeholder de modelo)
              </label>
            </div>
            <button type="button" className="button button--primary" onClick={runMassCatalogGeneration} disabled={runningBulkTask}>
              {runningBulkTask ? "Procesando catalogo..." : "Generar catalogo masivo"}
            </button>

            <label>
              Importar productos por JSON
              <textarea
                rows="8"
                value={importJson}
                onChange={(event) => setImportJson(event.target.value)}
                placeholder='Pega [{"nombre":"...","descripcion":"...","categoria":"tecnologia","precio":999,"stock":5}]'
                disabled={runningBulkTask}
              />
            </label>
            <button type="button" className="button button--ghost" onClick={importProductsFromJson} disabled={runningBulkTask}>
              {runningBulkTask ? "Importando..." : "Importar JSON"}
            </button>
          </section>

          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Inventario</p>
                <h2>Productos de la tienda</h2>
              </div>
            </div>
            <div className="list-stack">
              {products.map((product) => (
                <article key={product.id} className="mini-item mini-item--product">
                  <img src={product.imagenes?.[0]} alt={product.nombre} />
                  <div>
                    <strong>{product.nombre}</strong>
                    <span>{product.categoria} · {product.marca || "Sin marca"}</span>
                    <small>${product.precio.toFixed(2)} · stock {product.stock} · vendidos {product.vendidos || 0}</small>
                  </div>
                  <button type="button" className="button button--ghost" onClick={() => fillProductForm(product)}>
                    Editar
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => deleteProductItem(product.id)}>
                    Eliminar
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "users" && (
        <div className="admin-grid">
          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Usuarios</p>
                <h2>Clientes registrados</h2>
              </div>
            </div>
            <label>
              Buscar
              <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Nombre, correo o telefono" />
            </label>
            <div className="list-stack">
              {users.map((user) => (
                <article key={user.id} className="mini-item">
                  <button type="button" className="user-list-button" onClick={() => openUser(user.id)}>
                    <strong>{user.nombre}</strong>
                    <span>{user.nickname ? `@${user.nickname}` : user.email}</span>
                    <span>{user.telefono || "Sin telefono"} | {formatAddress(user.direccion)}</span>
                    <small>{user.totalOrdenes || 0} pedido(s) | {formatMoney(user.gastoTotal)}</small>
                    <small>{user.isActive ? "Activa" : "Desactivada"}</small>
                  </button>
                  <button
                    type="button"
                    className={`button ${user.isActive ? "button--danger" : "button--primary"}`}
                    onClick={() => toggleUserActive(user.id, !Boolean(user.isActive))}
                  >
                    {user.isActive ? "Desactivar" : "Activar"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Detalle del usuario</p>
                <h2>{selectedUser?.user?.nombre || "Selecciona un usuario"}</h2>
              </div>
            </div>

            {selectedUser ? (
              <div className="list-stack">
                <div className="user-detail-grid">
                  {selectedUser.user.avatarUrl && <img className="profile-avatar-preview__small" src={selectedUser.user.avatarUrl} alt={selectedUser.user.nombre} />}
                  <article className="mini-item"><strong>Nick</strong><span>{selectedUser.user.nickname ? `@${selectedUser.user.nickname}` : "Sin nick"}</span></article>
                  <article className="mini-item"><strong>Correo</strong><span>{selectedUser.user.email}</span></article>
                  <article className="mini-item"><strong>Estado</strong><span>{selectedUser.user.isActive ? "Activa" : "Desactivada"}</span></article>
                  <article className="mini-item"><strong>Telefono</strong><span>{selectedUser.user.telefono || "Sin telefono"}</span></article>
                  <article className="mini-item mini-item--wide"><strong>Direccion de cliente</strong><span>{formatAddress(selectedUser.user.direccion)}</span></article>
                </div>
                <button
                  type="button"
                  className={`button ${selectedUser.user.isActive ? "button--danger" : "button--primary"}`}
                  onClick={() => toggleUserActive(selectedUser.user.id, !Boolean(selectedUser.user.isActive))}
                >
                  {selectedUser.user.isActive ? "Desactivar cuenta de este usuario" : "Activar cuenta de este usuario"}
                </button>

                <article className="detail-card">
                  <h3>Carrito actual</h3>
                  <div className="list-stack">
                    {selectedUserCart.length ? selectedUserCart.map((item) => (
                      <article key={`${item.productoId}-${item.nombre}`} className="mini-item">
                        <strong>{item.nombre}</strong>
                        <span>{item.cantidad} pieza(s) | {formatMoney(item.precio)} c/u | subtotal {formatMoney(item.subtotal || Number(item.precio || 0) * Number(item.cantidad || 0))}</span>
                      </article>
                    )) : <p className="muted-text">No tiene productos en carrito.</p>}
                  </div>
                </article>

                <article className="detail-card">
                  <h3>Pedidos</h3>
                  <div className="list-stack">
                    {selectedUserOrders.length ? selectedUserOrders.map((order) => (
                      <article key={order.id} className="order-card">
                        <div className="order-card__head">
                          <strong>{order.id}</strong>
                          <span className={statusClass(order.estado)}>{statusLabel(order.estado)}</span>
                        </div>
                        <small>{new Date(order.fecha).toLocaleString()}</small>
                        <p>Total: {formatMoney(order.total)} | Pago: {statusLabel(order.paymentStatus || order.estado)}</p>
                        <p>Direccion de envio: {formatAddress(order.direccionEnvio || order.direccion)}</p>
                        <div className="order-item-list">
                          {(order.items || []).length ? order.items.map((item) => (
                            <span key={`${order.id}-${item.id || item.productoId}-${item.nombre}`}>
                              Folio {item.folio || "Sin folio"} | {item.cantidad} x {item.nombre} | {formatMoney(item.precio)}
                            </span>
                          )) : <span>Sin items detallados para este pedido.</span>}
                        </div>
                        <div className="action-row">
                          {["pending_payment", "paid", "cancelled"].map((status) => (
                            <button key={status} type="button" className="button button--ghost" onClick={() => updateOrderStatus(order.id, status)}>
                              {statusLabel(status)}
                            </button>
                          ))}
                        </div>
                      </article>
                    )) : <p className="muted-text">Todavía no tiene pedidos.</p>}
                  </div>
                </article>
              </div>
            ) : (
              <p className="muted-text">Todavía no seleccionas un cliente.</p>
            )}
          </section>
        </div>
      )}

      {tab === "orders" && (
        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Pedidos</p>
              <h2>Control de compras y seguimiento</h2>
            </div>
          </div>
          <div className="list-stack">
            {orders.map((order) => (
              <article key={order.id} className="order-card">
                <div className="order-card__head">
                  <strong>{order.usuarioNombre}</strong>
                  <span className={statusClass(order.estado)}>{statusLabel(order.estado)}</span>
                </div>
                <small>{order.usuarioEmail} · {order.usuarioTelefono || "Sin telefono"}</small>
                <p>{order.proveedorPago || "Sin proveedor"} · ${order.total.toFixed(2)}</p>
                <div className="admin-shipping-list">
                  {(order.items || []).length ? (
                    order.items.map((item) => (
                      <article key={`${order.id}-${item.id}`} className="admin-shipping-item">
                        <div className="admin-shipping-item__head">
                          <strong>{item.nombre}</strong>
                          <span>Folio {item.folio || "Sin folio"}</span>
                        </div>
                        <div className="form-grid form-grid--wide">
                          <label>
                            Entrega estimada
                            <input
                              value={item.entregaEstimada || ""}
                              onChange={(event) => updateOrderItemLocal(order.id, item.id, { entregaEstimada: event.target.value })}
                              placeholder="Ej. 15 min a 1 hr, manana, 3 a 5 dias"
                            />
                          </label>
                          <label>
                            Detalle del envio
                            <input
                              value={item.detalleEnvio || ""}
                              onChange={(event) => updateOrderItemLocal(order.id, item.id, { detalleEnvio: event.target.value })}
                              placeholder="Ej. En almacen, aduana, terminal o reparto"
                            />
                          </label>
                        </div>
                        <div className="shipping-icon-picker">
                          {shippingIconOptions.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              className={`shipping-icon-option${(item.iconoEnvio || "coche") === option.id ? " is-selected" : ""}`}
                              onClick={() => updateOrderItemLocal(order.id, item.id, { iconoEnvio: option.id })}
                            >
                              <span>{option.icon}</span>
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <button type="button" className="button button--primary" onClick={() => saveOrderItemShipping(order.id, item)}>
                          Guardar envio del producto
                        </button>
                      </article>
                    ))
                  ) : (
                    <p className="muted-text">Sin productos detallados para editar envio.</p>
                  )}
                </div>
                <div className="action-row">
                  {["pending_payment", "paid", "cancelled"].map((status) => (
                    <button key={status} type="button" className="button button--ghost" onClick={() => updateOrderStatus(order.id, status)}>
                      {statusLabel(status)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setTrackingDraft(JSON.stringify(order.tracking || [], null, 2));
                    }}
                  >
                    Editar seguimiento
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => removeOrder(order.id)}>
                    Eliminar
                  </button>
                </div>
                {selectedOrderId === order.id && (
                  <div className="detail-card">
                    <h3>Seguimiento del pedido</h3>
                    <textarea rows="8" value={trackingDraft} onChange={(event) => setTrackingDraft(event.target.value)} />
                    <button type="button" className="button button--primary" onClick={() => updateTracking(order.id)}>
                      Guardar seguimiento
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "reviews" && (
        <section className="section-card">
          <form className="review-form" onSubmit={saveReview}>
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">{reviewForm.id ? "Editar resena" : "Nueva resena"}</p>
                <h2>{reviewForm.id ? "Actualiza nombre y comentario" : "Sube una resena como administrador"}</h2>
              </div>
              {reviewForm.id && (
                <button type="button" className="button button--ghost" onClick={resetReviewForm}>
                  Nueva
                </button>
              )}
            </div>
            <label>
              Editar resena existente
              <select
                value={reviewForm.id || ""}
                onChange={(event) => {
                  const selected = reviews.find((review) => String(review.id) === event.target.value);
                  if (selected) {
                    fillReviewForm(selected);
                  } else {
                    resetReviewForm();
                  }
                }}
              >
                <option value="">Crear nueva resena</option>
                {reviews.map((review) => (
                  <option key={review.id} value={review.id}>
                    {review.productoNombre} | {review.usuarioNombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Producto
              <select value={reviewForm.productId} onChange={(event) => setReviewForm((current) => ({ ...current, productId: event.target.value }))} required>
                <option value="">Selecciona producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nombre visible
              <input
                value={reviewForm.reviewerName}
                onChange={(event) => setReviewForm((current) => ({ ...current, reviewerName: event.target.value }))}
                placeholder="Cliente verificado"
              />
            </label>
            <label>
              Calificacion
              <select value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}>
                <option value="5">5 estrellas</option>
                <option value="4">4 estrellas</option>
                <option value="3">3 estrellas</option>
                <option value="2">2 estrellas</option>
                <option value="1">1 estrella</option>
              </select>
            </label>
            <label>
              Comentario
              <textarea
                rows="5"
                value={reviewForm.comentario}
                onChange={(event) => setReviewForm((current) => ({ ...current, comentario: event.target.value }))}
                required
              />
            </label>
            <button type="submit" className="button button--primary">
              {reviewForm.id ? "Guardar resena" : "Crear resena"}
            </button>
          </form>
        </section>
      )}

      {tab === "folios" && (
        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Buscador de folios</p>
              <h2>Encuentra productos comprados por folio</h2>
            </div>
          </div>
          <div className="form-inline">
            <label>
              Folio, cliente, correo, producto o pedido
              <input value={folioSearch} onChange={(event) => setFolioSearch(event.target.value)} placeholder="Ej. 1000000001" />
            </label>
            <button type="button" className="button button--primary" onClick={searchFolios}>
              Buscar folio
            </button>
          </div>
          <div className="list-stack">
            {folioResults.length ? (
              folioResults.map((item) => (
                <article key={`${item.folio}-${item.id}`} className="folio-result-card">
                  <div>
                    <p className="section-label">Folio</p>
                    <h3>{item.folio}</h3>
                  </div>
                  <div className="folio-result-grid">
                    <span><strong>Producto:</strong> {item.productoNombre}</span>
                    <span><strong>Cliente:</strong> {item.usuarioNombre}</span>
                    <span><strong>Correo:</strong> {item.usuarioEmail}</span>
                    <span><strong>Telefono:</strong> {item.usuarioTelefono || "Sin telefono"}</span>
                    <span><strong>Pedido:</strong> {item.orderId}</span>
                    <span><strong>Estado:</strong> {statusLabel(item.estadoPedido)}</span>
                    <span><strong>Cantidad:</strong> {item.cantidad}</span>
                    <span><strong>Precio:</strong> {formatMoney(item.precio)}</span>
                    <span><strong>Total pedido:</strong> {formatMoney(item.totalPedido)}</span>
                    <span><strong>Fecha:</strong> {new Date(item.fecha).toLocaleString()}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-text">No hay resultados para ese folio.</p>
            )}
          </div>
        </section>
      )}

      {tab === "reviews" && (
        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Reseñas</p>
              <h2>Moderacion de comentarios</h2>
            </div>
          </div>
          <div className="list-stack">
            {reviews.map((review) => (
              <article key={review.id} className="community-card">
                <strong>{review.productoNombre} · {review.usuarioNombre}</strong>
                <small>{review.rating} estrellas</small>
                <p>{review.comentario}</p>
                <button type="button" className="button button--ghost" onClick={() => deleteReview(review.id)}>
                  Eliminar reseña
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "categories" && (
        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Categorias</p>
              <h2>Secciones visibles en la tienda</h2>
            </div>
          </div>
          <div className="list-stack">
            {categories.map((category) => (
              <article key={category.id} className="mini-item">
                <strong>{category.nombre}</strong>
                <span>{category.slug}</span>
                <small>{category.descripcion}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      {(tab === "home" || tab === "content") && (
        <div className="admin-grid">
          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Portada principal</p>
                <h2>Textos, logos y empresas asociadas</h2>
              </div>
            </div>
            <label>
              Nombre del sitio
              <input value={content.general.siteName || ""} onChange={(event) => setContent((current) => ({ ...current, general: { ...current.general, siteName: event.target.value } }))} />
            </label>
            <label>
              Eslogan
              <input value={content.general.tagline || ""} onChange={(event) => setContent((current) => ({ ...current, general: { ...current.general, tagline: event.target.value } }))} />
            </label>
            <label>
              Correo oficial de la web
              <input value={content.general.supportEmail || ""} onChange={(event) => setContent((current) => ({ ...current, general: { ...current.general, supportEmail: event.target.value } }))} />
            </label>
            <label>
              Codigo de invitacion (6 digitos)
              <input
                value={content.general.signupInviteCode || ""}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    general: { ...current.general, signupInviteCode: event.target.value.replace(/\D/g, "").slice(0, 6) }
                  }))
                }
                placeholder="123456"
              />
            </label>
            <label>
              Dominios permitidos para registro
              <input
                value={Array.isArray(content.general.allowedEmailDomains) ? content.general.allowedEmailDomains.join(", ") : content.general.allowedEmailDomains || ""}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    general: {
                      ...current.general,
                      allowedEmailDomains: event.target.value
                        .split(/[,\s\r\n]+/)
                        .map((item) => item.trim().toLowerCase())
                        .filter(Boolean)
                    }
                  }))
                }
                placeholder="gmail.com, outlook.com, hotmail.com"
              />
            </label>
            <label>
              Logo principal (subir imagen)
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const [file] = Array.from(event.target.files || []);
                  if (!file) return;
                  const logoUrl = await fileToDataUrl(file);
                  setContent((current) => ({
                    ...current,
                    general: { ...current.general, logoUrl }
                  }));
                }}
              />
            </label>
            <label>
              O pega URL/base64 del logo principal
              <input
                value={content.general.logoUrl || ""}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    general: { ...current.general, logoUrl: event.target.value }
                  }))
                }
                placeholder="https://... o data:image/..."
              />
            </label>
            <label>
              Mensaje superior
              <input value={content.homepage.announcement || ""} onChange={(event) => setContent((current) => ({ ...current, homepage: { ...current.homepage, announcement: event.target.value } }))} />
            </label>
            <label>
              Titulo principal
              <textarea rows="3" value={content.homepage.heroTitle || ""} onChange={(event) => setContent((current) => ({ ...current, homepage: { ...current.homepage, heroTitle: event.target.value } }))} />
            </label>
            <label>
              Descripcion principal
              <textarea rows="4" value={content.homepage.heroDescription || ""} onChange={(event) => setContent((current) => ({ ...current, homepage: { ...current.homepage, heroDescription: event.target.value } }))} />
            </label>
            <article className="detail-card">
              <h3>Panorama comercial del inicio</h3>
              <p className="muted-text">Edita las tres tarjetas que aparecen en "Estado actual de la tienda".</p>
              <div className="list-stack">
                {defaultStoreStatusCards.map((_, index) => {
                  const card = getStoreStatusCard(content.homepage, index);
                  return (
                    <div key={`store-status-${index}`} className="mini-item mini-item--stacked">
                      <label>
                        Titulo tarjeta {index + 1}
                        <input
                          value={card.title}
                          onChange={(event) =>
                            setContent((current) => {
                              const cards = Array.isArray(current.homepage.storeStatusCards)
                                ? [...current.homepage.storeStatusCards]
                                : [...defaultStoreStatusCards];
                              cards[index] = { ...(cards[index] || {}), title: event.target.value };
                              return { ...current, homepage: { ...current.homepage, storeStatusCards: cards } };
                            })
                          }
                        />
                      </label>
                      <label>
                        Descripcion tarjeta {index + 1}
                        <textarea
                          rows="3"
                          value={card.text}
                          onChange={(event) =>
                            setContent((current) => {
                              const cards = Array.isArray(current.homepage.storeStatusCards)
                                ? [...current.homepage.storeStatusCards]
                                : [...defaultStoreStatusCards];
                              cards[index] = { ...(cards[index] || {}), text: event.target.value };
                              return { ...current, homepage: { ...current.homepage, storeStatusCards: cards } };
                            })
                          }
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </article>
            <label>
              Titulo empresas asociadas
              <input value={content.general.partnerTitle || ""} onChange={(event) => setContent((current) => ({ ...current, general: { ...current.general, partnerTitle: event.target.value } }))} />
            </label>
            <label>
              Terminos y condiciones (texto publico)
              <textarea
                rows="8"
                value={content.general.termsAndConditions || ""}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    general: { ...current.general, termsAndConditions: event.target.value }
                  }))
                }
              />
            </label>
            <label>
              Sobre nosotros (texto publico)
              <textarea
                rows="8"
                value={content.general.aboutUs || ""}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    general: { ...current.general, aboutUs: event.target.value }
                  }))
                }
              />
            </label>
            <article className="detail-card">
              <h3>Formas y links de pago</h3>
              <div className="form-grid">
                <label>
                  Link Mercado Pago
                  <input
                    value={content.general.paymentLinks?.mercadopago || ""}
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        general: {
                          ...current.general,
                          paymentLinks: { ...(current.general.paymentLinks || {}), mercadopago: event.target.value }
                        }
                      }))
                    }
                    placeholder="https://..."
                  />
                </label>
                <label>
                  Link PayPal
                  <input
                    value={content.general.paymentLinks?.paypal || ""}
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        general: {
                          ...current.general,
                          paymentLinks: { ...(current.general.paymentLinks || {}), paypal: event.target.value }
                        }
                      }))
                    }
                    placeholder="https://..."
                  />
                </label>
                <label>
                  Link Tarjeta (Visa / Mastercard)
                  <input
                    value={content.general.paymentLinks?.stripe || ""}
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        general: {
                          ...current.general,
                          paymentLinks: { ...(current.general.paymentLinks || {}), stripe: event.target.value }
                        }
                      }))
                    }
                    placeholder="https://..."
                  />
                </label>
                <label>
                  Link WhatsApp general (opcional)
                  <input
                    value={content.general.paymentLinks?.whatsapp || ""}
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        general: {
                          ...current.general,
                          paymentLinks: { ...(current.general.paymentLinks || {}), whatsapp: event.target.value }
                        }
                      }))
                    }
                    placeholder="https://wa.me/..."
                  />
                </label>
              </div>
            </article>
            <label>
              Volumen musica ambiental ({Number(content.general.backgroundMusicVolume ?? 35)}%)
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Number(content.general.backgroundMusicVolume ?? 35)}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    general: { ...current.general, backgroundMusicVolume: Number(event.target.value) }
                  }))
                }
              />
            </label>
            <button type="button" className="button button--ghost" onClick={saveHomepage}>
              Guardar volumen de musica
            </button>
            <button type="button" className="button button--primary" onClick={saveHomepage}>
              Guardar textos y portada
            </button>

            <article className="detail-card">
              <h3>Empresas asociadas</h3>
              <form className="list-stack" onSubmit={addPartnerLogo}>
                <label>
                  Nombre
                  <input value={partnerForm.name} onChange={(event) => setPartnerForm((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label>
                  Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const [file] = Array.from(event.target.files || []);
                      if (!file) return;
                      const rawLogo = await fileToDataUrl(file);
                      const logoUrl =
                        file.type === "image/png"
                          ? await removeWhiteBackgroundFromImage(rawLogo)
                          : rawLogo;
                      setPartnerForm((current) => ({ ...current, logoUrl }));
                    }}
                  />
                </label>
                <label>
                  O pega URL/logo base64
                  <input value={partnerForm.logoUrl} onChange={(event) => setPartnerForm((current) => ({ ...current, logoUrl: event.target.value }))} />
                </label>
                <button type="submit" className="button button--ghost">Agregar empresa</button>
              </form>
              <div className="list-stack">
                {(content.general.partnerLogos || []).map((partner) => (
                  <article key={partner.id || partner.name} className="mini-item mini-item--product">
                    {partner.logoUrl && <img src={partner.logoUrl} alt={partner.name} />}
                    <div>
                      <strong>{partner.name}</strong>
                    </div>
                    <button type="button" className="button button--ghost" onClick={() => removePartnerLogo(partner.id)}>
                      Eliminar
                    </button>
                  </article>
                ))}
              </div>
            </article>
          </section>

          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Anuncios y medios</p>
                <h2>Solo visibles en la portada principal</h2>
              </div>
            </div>

            <article className="detail-card">
              <h3>Nuevo banner</h3>
              <form className="list-stack" onSubmit={saveBanner}>
                <label>
                  Titulo
                  <input value={bannerForm.titulo} onChange={(event) => setBannerForm((current) => ({ ...current, titulo: event.target.value }))} />
                </label>
                <label>
                  Subtitulo
                  <input value={bannerForm.subtitulo} onChange={(event) => setBannerForm((current) => ({ ...current, subtitulo: event.target.value }))} />
                </label>
                <label>
                  Imagen/banner
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const [file] = Array.from(event.target.files || []);
                      if (!file) return;
                      const mediaUrl = await fileToDataUrl(file);
                      setBannerForm((current) => ({ ...current, mediaUrl }));
                    }}
                  />
                </label>
                <label>
                  O pega URL/base64
                  <input value={bannerForm.mediaUrl} onChange={(event) => setBannerForm((current) => ({ ...current, mediaUrl: event.target.value }))} />
                </label>
                <button type="submit" className="button button--ghost">Guardar banner</button>
              </form>
            </article>

            <article className="detail-card">
              <h3>Nuevo video de portada</h3>
              <form className="list-stack" onSubmit={saveVideo}>
                <label>
                  Titulo
                  <input value={videoForm.titulo} onChange={(event) => setVideoForm((current) => ({ ...current, titulo: event.target.value }))} />
                </label>
                <label>
                  Descripcion
                  <input value={videoForm.descripcion} onChange={(event) => setVideoForm((current) => ({ ...current, descripcion: event.target.value }))} />
                </label>
                <label>
                  Video
                  <input
                    type="file"
                    accept="video/*"
                    onChange={async (event) => {
                      const [file] = Array.from(event.target.files || []);
                      if (!file) return;
                      const videoUrl = await fileToDataUrl(file);
                      setVideoForm((current) => ({ ...current, videoUrl }));
                    }}
                  />
                </label>
                <label>
                  O pega URL/base64 o link de YouTube
                  <input
                    value={videoForm.videoUrl}
                    onChange={(event) => setVideoForm((current) => ({ ...current, videoUrl: event.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </label>
                <label className="checkbox-chip">
                  <input
                    type="checkbox"
                    checked={videoForm.activa}
                    onChange={(event) => setVideoForm((current) => ({ ...current, activa: event.target.checked }))}
                  />
                  Mostrar este anuncio en el inicio
                </label>
                <button type="submit" className="button button--ghost">Guardar video</button>
              </form>
            </article>

            <article className="detail-card">
              <h3>Nueva pista musical</h3>
              <form className="list-stack" onSubmit={saveMusic}>
                <label>
                  Titulo
                  <input value={musicForm.titulo} onChange={(event) => setMusicForm((current) => ({ ...current, titulo: event.target.value }))} />
                </label>
                <label>
                  Artista
                  <input value={musicForm.artista} onChange={(event) => setMusicForm((current) => ({ ...current, artista: event.target.value }))} />
                </label>
                <label>
                  Audio ambiental
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={async (event) => {
                      const [file] = Array.from(event.target.files || []);
                      if (!file) return;
                      const audioUrl = await fileToDataUrl(file);
                      setMusicForm((current) => ({ ...current, audioUrl }));
                    }}
                  />
                </label>
                <label>
                  O pega link directo de audio (.mp3, .m4a, .ogg, .wav)
                  <input value={musicForm.audioUrl} onChange={(event) => setMusicForm((current) => ({ ...current, audioUrl: event.target.value }))} />
                </label>
                <small className="muted-text">La musica se reproduce como ambiente y no muestra controles al cliente. Usa archivo o link directo de audio; YouTube no funciona como audio de fondo.</small>
                <label className="checkbox-chip">
                  <input
                    type="checkbox"
                    checked={musicForm.activa}
                    onChange={(event) => setMusicForm((current) => ({ ...current, activa: event.target.checked }))}
                  />
                  Activar esta pista al guardarla
                </label>
                <button type="submit" className="button button--ghost">Guardar pista</button>
              </form>
            </article>

            <div className="list-stack">
              {content.banners.map((banner) => (
                <article key={banner.id} className="mini-item mini-item--product">
                  {banner.mediaUrl && <img src={banner.mediaUrl} alt={banner.titulo} />}
                  <div>
                    <strong>{banner.titulo}</strong>
                    <span>{banner.subtitulo}</span>
                  </div>
                  <button type="button" className="button button--ghost" onClick={() => deleteMedia("banner", banner.id)}>Eliminar</button>
                </article>
              ))}
              {content.videos.map((video) => (
                <article key={video.id} className="mini-item">
                  <strong>{video.titulo}</strong>
                  <span>{video.descripcion}</span>
                  <button type="button" className="button button--ghost" onClick={() => deleteMedia("video", video.id)}>Eliminar</button>
                </article>
              ))}
              {content.music.map((track) => (
                <article key={track.id} className="mini-item">
                  <strong>{track.titulo}</strong>
                  <span>{track.artista || "Sin artista"} · {track.activa ? "Activa" : "Inactiva"}</span>
                  <button type="button" className="button button--ghost" onClick={() => setTrackAsActive(track)}>
                    Usar esta pista
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => deleteMedia("music", track.id)}>Eliminar</button>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "terms" && (
        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Legal</p>
              <h2>Editor de terminos y condiciones</h2>
            </div>
          </div>
          <label>
            Texto publico
            <textarea
              rows="16"
              value={content.general.termsAndConditions || ""}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  general: { ...current.general, termsAndConditions: event.target.value }
                }))
              }
            />
          </label>
          <button type="button" className="button button--primary" onClick={saveTerms}>
            Guardar terminos y condiciones
          </button>
        </section>
      )}
    </div>
  );
}
