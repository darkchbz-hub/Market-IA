import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";

const money = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

export function InvoicePage() {
  const { orderId } = useParams();
  const { token } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/orders/${orderId}/invoice`, { token })
      .then((payload) => setInvoice(payload.invoice))
      .catch((requestError) => setError(requestError.message));
  }, [orderId, token]);

  if (error) return <section className="section-card status-card"><h1>Factura no disponible</h1><p>{error}</p><Link to="/perfil" className="button button--ghost">Volver a mis pedidos</Link></section>;
  if (!invoice) return <section className="section-card status-card"><p>Preparando factura...</p></section>;

  return (
    <div className="invoice-page">
      <div className="invoice-toolbar"><Link to="/perfil" className="button button--ghost">← Volver</Link><button type="button" className="button button--primary" onClick={() => window.print()}>Descargar / guardar PDF</button></div>
      <article className="invoice-sheet">
        <header className="invoice-header">
          <img src="/assets/gray-c-shop-logo.png" alt="Gray C Shop" />
          <div><p>FACTURA DE COMPRA</p><h1>Gray C Shop</h1><span>Eleva tu estilo de vida / Elevate Your Lifestyle</span></div>
          <div className="invoice-number"><small>ORDEN</small><strong>{invoice.id}</strong></div>
        </header>
        <section className="invoice-meta">
          <div><small>CLIENTE</small><strong>{invoice.customerName}</strong><span>{invoice.customerEmail}</span></div>
          <div><small>FECHA Y HORA DE COMPRA</small><strong>{new Date(invoice.date).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}</strong><span>Pago: {invoice.paymentProvider || "Registrado"}</span></div>
        </section>
        <div className="invoice-table-wrap"><table className="invoice-table"><thead><tr><th>Producto</th><th>Folio</th><th>Cantidad</th><th>Precio</th><th>Importe</th></tr></thead><tbody>{invoice.items.map((item) => <tr key={item.id}><td><strong>{item.nombre}</strong></td><td>{item.folio}</td><td>{item.cantidad}</td><td>{money(item.precio)}</td><td>{money(item.precio * item.cantidad)}</td></tr>)}</tbody></table></div>
        <section className="invoice-totals">
          <div><span>Subtotal</span><strong>{money(invoice.subtotal)}</strong></div>
          {invoice.discount > 0 && <div className="invoice-discount"><span>Descuento {invoice.couponCode ? `(${invoice.couponCode})` : ""}</span><strong>-{money(invoice.discount)}</strong></div>}
          <div className="invoice-grand-total"><span>Total pagado</span><strong>{money(invoice.total)}</strong></div>
        </section>
        <footer className="invoice-footer"><img src="/assets/review-tigresa.png" alt="Tigresa agradece tu compra" /><div><small>TIGRESA DICE</small><h2>¡Gracias por tu compra!</h2><p>Esperamos que disfrutes tus productos. Conserva esta factura como comprobante de tu pedido.</p></div></footer>
      </article>
    </div>
  );
}
