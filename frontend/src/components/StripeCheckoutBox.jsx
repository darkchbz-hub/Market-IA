import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { STRIPE_PUBLISHABLE_KEY } from "../lib/api.js";

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

function StripeForm({ orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setStatus("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`
      }
    });

    if (result.error) {
      setStatus(result.error.message || "No se pudo completar el pago.");
      setSubmitting(false);
      return;
    }

    setStatus("Redirigiendo a Stripe...");
  };

  return (
    <form className="stripe-box" onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" className="button button--primary" disabled={!stripe || submitting}>
        {submitting ? "Procesando..." : "Pagar con Stripe"}
      </button>
      {status && <p className="inline-message">{status}</p>}
    </form>
  );
}

export function StripeCheckoutBox({ clientSecret, orderId }) {
  if (!clientSecret) {
    return null;
  }

  if (!STRIPE_PUBLISHABLE_KEY || !stripePromise) {
    return <p className="inline-message">Agrega `VITE_STRIPE_PUBLISHABLE_KEY` para usar el formulario real de Stripe.</p>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <StripeForm orderId={orderId} />
    </Elements>
  );
}
