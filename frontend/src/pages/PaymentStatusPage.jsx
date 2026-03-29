import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";

export function PaymentStatusPage() {
  const { status } = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const processedRef = useRef("");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const orderId = searchParams.get("orderId");
  const stripePaymentIntent = searchParams.get("payment_intent");
  const paypalOrderId = searchParams.get("token");
  const mercadopagoPaymentId = searchParams.get("payment_id");

  useEffect(() => {
    const processPayment = async () => {
      if (!token || !orderId || status === "cancel") {
        return;
      }

      const key = `${status}-${orderId}-${stripePaymentIntent || paypalOrderId || mercadopagoPaymentId || "none"}`;

      if (processedRef.current === key) {
        return;
      }

      processedRef.current = key;
      setProcessing(true);

      try {
        if (status === "success" && stripePaymentIntent) {
          await apiFetch("/payments/stripe/confirm", {
            method: "POST",
            token,
            body: {
              orderId,
              paymentIntentId: stripePaymentIntent
            }
          });

          setMessage("El pago con Stripe ya fue confirmado.");
          return;
        }

        if (status === "success" && paypalOrderId) {
          await apiFetch("/payments/paypal/capture", {
            method: "POST",
            token,
            body: {
              orderId,
              paypalOrderId
            }
          });

          setMessage("El pago con PayPal ya fue capturado.");
          return;
        }

        if ((status === "success" || status === "pending") && mercadopagoPaymentId) {
          await apiFetch("/payments/mercadopago/confirm", {
            method: "POST",
            token,
            body: {
              orderId,
              paymentId: mercadopagoPaymentId
            }
          });

          setMessage("El pago con Mercado Pago ya fue validado.");
          return;
        }
      } catch (error) {
        setMessage(error.message);
      } finally {
        setProcessing(false);
      }
    };

    processPayment().catch(() => {});
  }, [token, orderId, stripePaymentIntent, paypalOrderId, mercadopagoPaymentId, status]);

  const titles = {
    success: "Pago completado",
    pending: "Pago pendiente",
    cancel: "Pago cancelado"
  };

  return (
    <section className="status-page">
      <div className="card status-card">
        <p className="section-label">Resultado del pago</p>
        <h1>{titles[status] || "Estado del pago"}</h1>
        <p>
          {orderId
            ? `La orden ${orderId} ya regreso desde el proveedor.`
            : "El proveedor de pago devolvio el estado de la operacion."}
        </p>
        {processing && <p className="inline-message">Validando pago con el proveedor...</p>}
        {message && <p className="inline-message">{message}</p>}
        <div className="action-row">
          <Link to="/perfil" className="button button--primary">
            Ver perfil
          </Link>
          <Link to="/" className="button button--light">
            Volver al catalogo
          </Link>
        </div>
      </div>
    </section>
  );
}
