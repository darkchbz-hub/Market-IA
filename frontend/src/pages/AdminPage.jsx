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
  categoria: "tecnologia",
  imagenes: [],
  tags: "",
  caracteristicas: "",
  garantia: "",
  devolucion: "",
  infoEnvio: "",
  fechaEstimada: "",
  disponibilidad: "Disponible",
  envioGratis: false,
  mostrarEnvioGratis: false
};

const initialBanner = { titulo: "", subtitulo: "", mediaUrl: "", linkUrl: "/catalogo", activa: true, orden: 1 };
const initialVideo = { titulo: "", descripcion: "", videoUrl: "", posterUrl: "", activa: true, orden: 1 };
const initialMusic = { titulo: "", artista: "", audioUrl: "", portadaUrl: "", activa: true, orden: 1 };
const initialPartner = { name: "", logoUrl: "" };

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
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
  const [message, setMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const loadAdmin = async () => {
    const [summaryPayload, productsPayload, ordersPayload, usersPayload, reviewsPayload, categoriesPayload, contentPayload] =
      await Promise.all([
        apiFetch("/admin/summary", { token }),
        apiFetch("/admin/products", { token }),
        apiFetch("/admin/orders", { token }),
        apiFetch(`/admin/users${userSearch ? `?search=${encodeURIComponent(userSearch)}` : ""}`, { token }),
        apiFetch("/admin/reviews", { token }),
        apiFetch("/admin/categories", { token }),
        apiFetch("/admin/content", { token })
      ]);

    setSummary(summaryPayload);
    setProducts(productsPayload.items || []);
    setOrders(ordersPayload.items || []);
    setUsers(usersPayload.items || []);
    setReviews(reviewsPayload.items || []);
    setCategories(categoriesPayload.items || []);
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
      categoria: product.categoria || "tecnologia",
      imagenes: product.imagenes || [],
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
      caracteristicas: Array.isArray(product.caracteristicas) ? product.caracteristicas.join("\n") : "",
      garantia: product.garantia || "",
      devolucion: product.devolucion || "",
      infoEnvio: product.infoEnvio || "",
      fechaEstimada: product.fechaEstimada || "",
      disponibilidad: product.disponibilidad || "Disponible",
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
    setSelectedUser(detail);
    setTab("users");
  };

  const deleteUserAccount = async (userId) => {
    if (!window.confirm("Se eliminara esta cuenta de usuario y su informacion relacionada. Deseas continuar?")) {
      return;
    }
    try {
      await apiFetch(`/admin/users/${userId}/delete`, {
        method: "POST",
        token
      });

      setSelectedUser(null);
      await loadAdmin();
      setMessage("Cuenta de usuario eliminada.");
    } catch (error) {
      setMessage(error.message || "No se pudo eliminar la cuenta.");
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
        method: "PUT",
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
            ["products", "Productos"],
            ["users", "Usuarios"],
            ["orders", "Pedidos"],
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
        </>
      )}

      {tab === "products" && (
        <div className="admin-grid">
          <form className="section-card" onSubmit={saveProduct}>
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
                Disponibilidad
                <input value={productForm.disponibilidad} onChange={(event) => setProductForm((current) => ({ ...current, disponibilidad: event.target.value }))} />
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
            <div className="pill-row">
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
            </div>
            <button type="submit" className="button button--primary">
              {productForm.id ? "Guardar cambios" : "Crear producto"}
            </button>
          </form>

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
                    <small>${product.precio.toFixed(2)} · stock {product.stock}</small>
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
                <button key={user.id} type="button" className="user-list-button" onClick={() => openUser(user.id)}>
                  <strong>{user.nombre}</strong>
                  <span>{user.telefono || user.email}</span>
                </button>
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
                <article className="mini-item"><strong>Correo</strong><span>{selectedUser.user.email}</span></article>
                <article className="mini-item"><strong>Telefono</strong><span>{selectedUser.user.telefono || "Sin telefono"}</span></article>
                <article className="mini-item"><strong>Direccion</strong><span>{Object.values(selectedUser.user.direccion || {}).filter(Boolean).join(", ") || "Sin direccion"}</span></article>
                <button type="button" className="button button--ghost" onClick={() => deleteUserAccount(selectedUser.user.id)}>
                  Eliminar cuenta de este usuario
                </button>

                <article className="detail-card">
                  <h3>Carrito actual</h3>
                  <div className="list-stack">
                    {selectedUser.cart.length ? selectedUser.cart.map((item) => (
                      <article key={`${item.productoId}-${item.nombre}`} className="mini-item">
                        <strong>{item.nombre}</strong>
                        <span>{item.cantidad} · ${item.precio.toFixed(2)}</span>
                      </article>
                    )) : <p className="muted-text">No tiene productos en carrito.</p>}
                  </div>
                </article>

                <article className="detail-card">
                  <h3>Pedidos</h3>
                  <div className="list-stack">
                    {selectedUser.orders.length ? selectedUser.orders.map((order) => (
                      <article key={order.id} className="order-card">
                        <div className="order-card__head">
                          <strong>{order.id}</strong>
                          <span>{order.estado}</span>
                        </div>
                        <small>{new Date(order.fecha).toLocaleString()}</small>
                        <p>Total: ${order.total.toFixed(2)}</p>
                        <div className="action-row">
                          {["pending_payment", "paid", "cancelled"].map((status) => (
                            <button key={status} type="button" className="button button--ghost" onClick={() => updateOrderStatus(order.id, status)}>
                              {status}
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
                  <span>{order.estado}</span>
                </div>
                <small>{order.usuarioEmail} · {order.usuarioTelefono || "Sin telefono"}</small>
                <p>{order.proveedorPago || "Sin proveedor"} · ${order.total.toFixed(2)}</p>
                <div className="action-row">
                  {["pending_payment", "paid", "cancelled"].map((status) => (
                    <button key={status} type="button" className="button button--ghost" onClick={() => updateOrderStatus(order.id, status)}>
                      {status}
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

      {tab === "content" && (
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
                      const logoUrl = await fileToDataUrl(file);
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
                  O pega URL/base64
                  <input value={videoForm.videoUrl} onChange={(event) => setVideoForm((current) => ({ ...current, videoUrl: event.target.value }))} />
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
                  Audio o video musical
                  <input
                    type="file"
                    accept="audio/*,video/mp4,video/webm"
                    onChange={async (event) => {
                      const [file] = Array.from(event.target.files || []);
                      if (!file) return;
                      const audioUrl = await fileToDataUrl(file);
                      setMusicForm((current) => ({ ...current, audioUrl }));
                    }}
                  />
                </label>
                <label>
                  O pega link directo (.mp3, .m4a, .ogg, .wav, .mp4, .webm)
                  <input value={musicForm.audioUrl} onChange={(event) => setMusicForm((current) => ({ ...current, audioUrl: event.target.value }))} />
                </label>
                <small className="muted-text">Acepta links directos de audio/video y tambien YouTube (youtube.com o youtu.be).</small>
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
