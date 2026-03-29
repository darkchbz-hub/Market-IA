import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";

const initialProduct = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: "",
  categoria: "apps",
  imagenes: "",
  tags: ""
};

function mapProducts(items) {
  return items.map((product) => ({
    ...product,
    imagenPrincipal: product.imagenes?.[0] || "",
    tagsText: (product.tags || []).join(", ")
  }));
}

export function AdminPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(initialProduct);
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    const [summaryPayload, usersPayload, ordersPayload, analyticsPayload, productsPayload] = await Promise.all([
      apiFetch("/admin/summary", { token }),
      apiFetch("/admin/users", { token }),
      apiFetch("/admin/orders", { token }),
      apiFetch("/admin/analytics", { token }),
      apiFetch("/products?limit=48")
    ]);

    setSummary(summaryPayload);
    setUsers(usersPayload.items);
    setOrders(ordersPayload.items);
    setAnalytics(analyticsPayload);
    setProducts(mapProducts(productsPayload.items));
  };

  useEffect(() => {
    loadDashboard().catch((error) => setMessage(error.message));
  }, [token]);

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await apiFetch("/admin/products", {
        method: "POST",
        token,
        body: {
          nombre: productForm.nombre,
          descripcion: productForm.descripcion,
          precio: Number(productForm.precio),
          stock: Number(productForm.stock),
          categoria: productForm.categoria,
          imagenes: productForm.imagenes ? [productForm.imagenes] : [],
          tags: productForm.tags
        }
      });

      setProductForm(initialProduct);
      setMessage("Producto creado correctamente.");
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateProductField = (productId, field, value) => {
    setProducts((current) =>
      current.map((product) => (product.id === productId ? { ...product, [field]: value } : product))
    );
  };

  const saveProduct = async (product) => {
    try {
      await apiFetch(`/admin/products/${product.id}`, {
        method: "PATCH",
        token,
        body: {
          nombre: product.nombre,
          descripcion: product.descripcion,
          precio: Number(product.precio),
          stock: Number(product.stock),
          categoria: product.categoria,
          imagenes: product.imagenPrincipal ? [product.imagenPrincipal] : [],
          tags: product.tagsText
        }
      });

      setMessage(`Cambios guardados para ${product.nombre}.`);
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const archiveProduct = async (productId) => {
    try {
      await apiFetch(`/admin/products/${productId}`, {
        method: "DELETE",
        token
      });

      setMessage("Producto desactivado.");
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page-section page-section--spaced">
      <section className="metrics-row">
        <article className="metric">
          <span>Usuarios</span>
          <strong>{summary?.usuarios || 0}</strong>
        </article>
        <article className="metric">
          <span>Ordenes</span>
          <strong>{summary?.ordenes || 0}</strong>
        </article>
        <article className="metric">
          <span>Pagadas</span>
          <strong>{summary?.ordenesPagadas || 0}</strong>
        </article>
        <article className="metric">
          <span>Ingresos</span>
          <strong>${summary?.ingresos?.toFixed(2) || "0.00"}</strong>
        </article>
      </section>

      {message && <p className="inline-message">{message}</p>}

      <section className="admin-layout">
        <form className="card" onSubmit={handleCreateProduct}>
          <div className="section-header">
            <div>
              <p className="section-label">Nuevo producto</p>
              <h2>Agregar al catalogo</h2>
            </div>
          </div>

          <label>
            Nombre
            <input
              type="text"
              value={productForm.nombre}
              onChange={(event) => setProductForm((current) => ({ ...current, nombre: event.target.value }))}
              required
            />
          </label>

          <label>
            Descripcion
            <textarea
              rows="4"
              value={productForm.descripcion}
              onChange={(event) => setProductForm((current) => ({ ...current, descripcion: event.target.value }))}
              required
            />
          </label>

          <div className="form-grid">
            <label>
              Precio
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.precio}
                onChange={(event) => setProductForm((current) => ({ ...current, precio: event.target.value }))}
                required
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                value={productForm.stock}
                onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
                required
              />
            </label>
          </div>

          <label>
            Categoria
            <select
              value={productForm.categoria}
              onChange={(event) => setProductForm((current) => ({ ...current, categoria: event.target.value }))}
            >
              <option value="apps">Apps</option>
              <option value="packs">Packs</option>
              <option value="webs">Servicios web</option>
            </select>
          </label>

          <label>
            Imagen principal
            <input
              type="url"
              value={productForm.imagenes}
              onChange={(event) => setProductForm((current) => ({ ...current, imagenes: event.target.value }))}
            />
          </label>

          <label>
            Tags
            <input
              type="text"
              value={productForm.tags}
              onChange={(event) => setProductForm((current) => ({ ...current, tags: event.target.value }))}
            />
          </label>

          <button type="submit" className="button button--primary">
            Crear producto
          </button>
        </form>

        <div className="admin-side">
          <section className="card">
            <div className="section-header">
              <div>
                <p className="section-label">Productos mas vistos</p>
                <h2>Top interes</h2>
              </div>
            </div>
            <div className="list-stack">
              {analytics?.productosMasVistos?.map((item) => (
                <article key={item.id} className="mini-item">
                  <strong>{item.nombre}</strong>
                  <span>{item.vistas} vistas</span>
                </article>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="section-header">
              <div>
                <p className="section-label">Busquedas</p>
                <h2>Terminos frecuentes</h2>
              </div>
            </div>
            <div className="list-stack">
              {analytics?.busquedasPopulares?.map((item) => (
                <article key={item.termino} className="mini-item">
                  <strong>{item.termino}</strong>
                  <span>{item.total} veces</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="section-label">Inventario</p>
            <h2>Editar productos existentes</h2>
          </div>
        </div>

        <div className="editable-grid">
          {products.map((product) => (
            <article key={product.id} className="editable-card">
              <div className="form-grid">
                <label>
                  Nombre
                  <input
                    type="text"
                    value={product.nombre}
                    onChange={(event) => updateProductField(product.id, "nombre", event.target.value)}
                  />
                </label>
                <label>
                  Categoria
                  <input
                    type="text"
                    value={product.categoria}
                    onChange={(event) => updateProductField(product.id, "categoria", event.target.value)}
                  />
                </label>
                <label>
                  Precio
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.precio}
                    onChange={(event) => updateProductField(product.id, "precio", event.target.value)}
                  />
                </label>
                <label>
                  Stock
                  <input
                    type="number"
                    min="0"
                    value={product.stock}
                    onChange={(event) => updateProductField(product.id, "stock", event.target.value)}
                  />
                </label>
              </div>

              <label>
                Descripcion
                <textarea
                  rows="3"
                  value={product.descripcion}
                  onChange={(event) => updateProductField(product.id, "descripcion", event.target.value)}
                />
              </label>

              <label>
                Imagen
                <input
                  type="url"
                  value={product.imagenPrincipal}
                  onChange={(event) => updateProductField(product.id, "imagenPrincipal", event.target.value)}
                />
              </label>

              <label>
                Tags
                <input
                  type="text"
                  value={product.tagsText}
                  onChange={(event) => updateProductField(product.id, "tagsText", event.target.value)}
                />
              </label>

              <div className="action-row">
                <button type="button" className="button button--primary" onClick={() => saveProduct(product)}>
                  Guardar
                </button>
                <button type="button" className="button button--light" onClick={() => archiveProduct(product.id)}>
                  Desactivar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-tables">
        <section className="card">
          <div className="section-header">
            <div>
              <p className="section-label">Clientes</p>
              <h2>Usuarios registrados</h2>
            </div>
          </div>
          <div className="list-stack">
            {users.map((item) => (
              <article key={item.id} className="mini-item">
                <strong>{item.nombre}</strong>
                <span>{item.email}</span>
                <span>{item.totalOrdenes} ordenes</span>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <div>
              <p className="section-label">Ventas</p>
              <h2>Ordenes recientes</h2>
            </div>
          </div>
          <div className="list-stack">
            {orders.map((item) => (
              <article key={item.id} className="mini-item">
                <strong>{item.cliente}</strong>
                <span>{item.estado}</span>
                <span>${item.total.toFixed(2)}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
