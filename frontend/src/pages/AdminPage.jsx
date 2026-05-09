import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const initialProduct = {
  nombre: "",
  slug: "",
  descripcion: "",
  descripcionCorta: "",
  marca: "",
  precio: "",
  precioAnterior: "",
  descuento: "",
  stock: "",
  categoria: "tecnologia",
  imagenes: [],
  tags: "",
  garantia: "",
  devolucion: "",
  infoEnvio: "",
  fechaEstimada: "",
  disponibilidad: "Disponible",
  destacado: true,
  oferta: true,
  masVendido: false,
  recomendado: true
};

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
  const [productForm, setProductForm] = useState(initialProduct);
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
    setContent(contentPayload);
  };

  useEffect(() => {
    loadAdmin().catch((error) => setMessage(error.message));
  }, [token, userSearch]);

  const metrics = useMemo(
    () => [
      { label: "Usuarios", value: summary?.usuarios || 0 },
      { label: "Productos activos", value: summary?.productosActivos || 0 },
      { label: "Pedidos", value: summary?.ordenes || 0 },
      { label: "Ingresos", value: `$${summary?.ingresos?.toFixed(2) || "0.00"}` }
    ],
    [summary]
  );

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
      await apiFetch("/admin/products", {
        method: "POST",
        token,
        body: {
          ...productForm,
          precio: Number(productForm.precio || 0),
          precioAnterior: Number(productForm.precioAnterior || 0),
          descuento: Number(productForm.descuento || 0),
          stock: Number(productForm.stock || 0),
          tags: productForm.tags
        }
      });
      setProductForm(initialProduct);
      setMessage("Producto creado correctamente.");
      await loadAdmin();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateOrderStatus = async (orderId, estado) => {
    try {
      await apiFetch(`/admin/orders/${orderId}`, {
        method: "PATCH",
        token,
        body: {
          estado,
          paymentStatus: estado === "pagado" || estado === "entregado" ? "paid" : "pending",
          shippingStatus:
            estado === "enviado" ? "shipped" : estado === "entregado" ? "delivered" : estado === "cancelado" ? "cancelled" : "pending"
        }
      });
      await loadAdmin();
      if (selectedUser) {
        const detail = await apiFetch(`/admin/users/${selectedUser.user.id}`, { token });
        setSelectedUser(detail);
      }
      setMessage("Pedido actualizado.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const openUser = async (userId) => {
    try {
      const detail = await apiFetch(`/admin/users/${userId}`, { token });
      setSelectedUser(detail);
      setTab("users");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveHomepage = async () => {
    try {
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
      setMessage("Contenido principal actualizado.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveBanner = async (banner) => {
    const method = banner.id ? "PATCH" : "POST";
    const path = banner.id ? `/admin/banners/${banner.id}` : "/admin/banners";
    await apiFetch(path, {
      method,
      token,
      body: banner
    });
    await loadAdmin();
  };

  const saveVideo = async (video) => {
    const method = video.id ? "PATCH" : "POST";
    const path = video.id ? `/admin/videos/${video.id}` : "/admin/videos";
    await apiFetch(path, {
      method,
      token,
      body: video
    });
    await loadAdmin();
  };

  const saveMusic = async (track) => {
    const method = track.id ? "PATCH" : "POST";
    const path = track.id ? `/admin/music/${track.id}` : "/admin/music";
    await apiFetch(path, {
      method,
      token,
      body: track
    });
    await loadAdmin();
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
            <h1>Control total del marketplace</h1>
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
            ["content", "Portada y medios"]
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
                <p className="section-label">Actividad reciente</p>
                <h2>Movimientos del panel</h2>
              </div>
            </div>
            <div className="list-stack">
              {(summary?.actividadReciente || []).map((item) => (
                <article key={item.id} className="mini-item">
                  <strong>{item.accion}</strong>
                  <span>{item.entidad}</span>
                  <small>{new Date(item.fecha).toLocaleString()}</small>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "products" && (
        <div className="admin-grid">
          <form className="section-card" onSubmit={saveProduct}>
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Nuevo producto</p>
                <h2>Agregar producto al catalogo</h2>
              </div>
            </div>
            <div className="form-grid form-grid--wide">
              <label>
                Nombre
                <input value={productForm.nombre} onChange={(event) => setProductForm((current) => ({ ...current, nombre: event.target.value }))} required />
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
                Precio
                <input value={productForm.precio} onChange={(event) => setProductForm((current) => ({ ...current, precio: event.target.value }))} required />
              </label>
              <label>
                Precio anterior
                <input value={productForm.precioAnterior} onChange={(event) => setProductForm((current) => ({ ...current, precioAnterior: event.target.value }))} />
              </label>
              <label>
                Descuento
                <input value={productForm.descuento} onChange={(event) => setProductForm((current) => ({ ...current, descuento: event.target.value }))} />
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
              Descripcion
              <textarea rows="5" value={productForm.descripcion} onChange={(event) => setProductForm((current) => ({ ...current, descripcion: event.target.value }))} required />
            </label>
            <label>
              Tags
              <input value={productForm.tags} onChange={(event) => setProductForm((current) => ({ ...current, tags: event.target.value }))} />
            </label>
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
              Politica de devolucion
              <input value={productForm.devolucion} onChange={(event) => setProductForm((current) => ({ ...current, devolucion: event.target.value }))} />
            </label>
            <label>
              Subir imagenes desde tu computadora
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
              {[
                ["destacado", "Destacado"],
                ["oferta", "Oferta"],
                ["masVendido", "Mas vendido"],
                ["recomendado", "Recomendado"]
              ].map(([key, label]) => (
                <label key={key} className="checkbox-chip">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm[key])}
                    onChange={(event) => setProductForm((current) => ({ ...current, [key]: event.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </div>
            <button type="submit" className="button button--primary">
              Crear producto
            </button>
          </form>

          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Inventario</p>
                <h2>Productos cargados</h2>
              </div>
            </div>
            <div className="list-stack">
              {products.map((product) => (
                <article key={product.id} className="mini-item mini-item--product">
                  <img src={product.imagenes?.[0]} alt={product.nombre} />
                  <div>
                    <strong>{product.nombre}</strong>
                    <span>
                      {product.categoria} · {product.marca}
                    </span>
                    <small>
                      ${product.precio.toFixed(2)} · stock {product.stock}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={async () => {
                      await apiFetch(`/admin/products/${product.id}`, {
                        method: "PATCH",
                        token,
                        body: { activo: !product.activo }
                      });
                      await loadAdmin();
                    }}
                  >
                    {product.activo ? "Desactivar" : "Activar"}
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
                <article className="mini-item">
                  <strong>Correo</strong>
                  <span>{selectedUser.user.email}</span>
                </article>
                <article className="mini-item">
                  <strong>Telefono</strong>
                  <span>{selectedUser.user.telefono}</span>
                </article>
                <article className="mini-item">
                  <strong>Direccion</strong>
                  <span>{Object.values(selectedUser.user.direccion || {}).filter(Boolean).join(", ")}</span>
                </article>
                <article className="detail-card">
                  <h3>Carrito actual</h3>
                  <div className="list-stack">
                    {selectedUser.cart.map((item) => (
                      <article key={item.productoId} className="mini-item">
                        <strong>{item.nombre}</strong>
                        <span>{item.cantidad} · ${item.precio.toFixed(2)}</span>
                      </article>
                    ))}
                  </div>
                </article>
                <article className="detail-card">
                  <h3>Pedidos</h3>
                  <div className="list-stack">
                    {selectedUser.orders.map((order) => (
                      <article key={order.id} className="order-card">
                        <div className="order-card__head">
                          <strong>{order.id.slice(0, 8)}</strong>
                          <span>{order.estado}</span>
                        </div>
                        <small>${order.total.toFixed(2)}</small>
                        <div className="action-row">
                          {["pendiente", "pagado", "preparando", "enviado", "entregado", "cancelado"].map((status) => (
                            <button key={status} type="button" className="button button--ghost" onClick={() => updateOrderStatus(order.id, status)}>
                              {status}
                            </button>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              </div>
            ) : (
              <p className="muted-text">Todavia no seleccionas un cliente.</p>
            )}
          </section>
        </div>
      )}

      {tab === "orders" && (
        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Pedidos</p>
              <h2>Control de estados y pagos</h2>
            </div>
          </div>
          <div className="list-stack">
            {orders.map((order) => (
              <article key={order.id} className="order-card">
                <div className="order-card__head">
                  <strong>{order.cliente}</strong>
                  <span>{order.estado}</span>
                </div>
                <small>
                  {order.email} · {order.telefono}
                </small>
                <p>
                  {order.proveedorPago || "Sin proveedor"} · ${order.total.toFixed(2)}
                </p>
                <div className="action-row">
                  {["pendiente", "pagado", "preparando", "enviado", "entregado", "cancelado"].map((status) => (
                    <button key={status} type="button" className="button button--ghost" onClick={() => updateOrderStatus(order.id, status)}>
                      {status}
                    </button>
                  ))}
                </div>
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
                <strong>
                  {review.productoNombre} · {review.usuarioNombre}
                </strong>
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
              <h2>Organiza tu marketplace</h2>
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
                <p className="section-label">Textos principales</p>
                <h2>Portada editable</h2>
              </div>
            </div>
            <label>
              Anuncio
              <input
                value={content.homepage.announcement || ""}
                onChange={(event) => setContent((current) => ({ ...current, homepage: { ...current.homepage, announcement: event.target.value } }))}
              />
            </label>
            <label>
              Titulo hero
              <textarea
                rows="4"
                value={content.homepage.heroTitle || ""}
                onChange={(event) => setContent((current) => ({ ...current, homepage: { ...current.homepage, heroTitle: event.target.value } }))}
              />
            </label>
            <label>
              Descripcion hero
              <textarea
                rows="4"
                value={content.homepage.heroDescription || ""}
                onChange={(event) =>
                  setContent((current) => ({ ...current, homepage: { ...current.homepage, heroDescription: event.target.value } }))
                }
              />
            </label>
            <button type="button" className="button button--primary" onClick={saveHomepage}>
              Guardar portada
            </button>
          </section>

          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Banners, videos y musica</p>
                <h2>Medios del sitio</h2>
              </div>
            </div>

            <div className="list-stack">
              {content.banners.map((banner) => (
                <article key={banner.id} className="mini-item mini-item--product">
                  <img src={banner.mediaUrl} alt={banner.titulo} />
                  <div>
                    <strong>{banner.titulo}</strong>
                    <span>{banner.subtitulo}</span>
                  </div>
                  <button type="button" className="button button--ghost" onClick={() => deleteMedia("banner", banner.id)}>
                    Eliminar
                  </button>
                </article>
              ))}
              <button
                type="button"
                className="button button--ghost"
                onClick={async () => {
                  const image = window.prompt("Pega la URL o data URL del banner");
                  if (!image) return;
                  await saveBanner({ titulo: "Nuevo banner", subtitulo: "", mediaUrl: image, linkUrl: "/catalogo", orden: 99, activa: true });
                }}
              >
                Agregar banner
              </button>

              {content.videos.map((video) => (
                <article key={video.id} className="mini-item">
                  <strong>{video.titulo}</strong>
                  <span>{video.videoUrl}</span>
                  <button type="button" className="button button--ghost" onClick={() => deleteMedia("video", video.id)}>
                    Eliminar
                  </button>
                </article>
              ))}
              <button
                type="button"
                className="button button--ghost"
                onClick={async () => {
                  const videoUrl = window.prompt("Pega la URL o data URL del video");
                  if (!videoUrl) return;
                  await saveVideo({ titulo: "Nuevo video", descripcion: "", videoUrl, posterUrl: "", orden: 99, activa: true });
                }}
              >
                Agregar video
              </button>

              {content.music.map((track) => (
                <article key={track.id} className="mini-item">
                  <strong>{track.titulo}</strong>
                  <span>{track.artista}</span>
                  <button type="button" className="button button--ghost" onClick={() => deleteMedia("music", track.id)}>
                    Eliminar
                  </button>
                </article>
              ))}
              <button
                type="button"
                className="button button--ghost"
                onClick={async () => {
                  const audioUrl = window.prompt("Pega la URL o data URL del audio");
                  if (!audioUrl) return;
                  await saveMusic({ titulo: "Nueva pista", artista: "Libre de regalias", audioUrl, portadaUrl: "", orden: 99, activa: true });
                }}
              >
                Agregar musica
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
