"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function ConfirmForm({ onDone }: { onDone: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setBusy(false);
    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={onSubmit}>
      <PaymentElement />
      {error && <p className="error">{error}</p>}
      <button type="submit" className="btn-block" disabled={!stripe || busy} style={{ marginTop: "0.75rem" }}>
        Confirm escrow funding
      </button>
    </form>
  );
}

/** Confirms the PaymentIntent behind a challenge's escrow funding clientSecret. */
export function StripeFundForm({
  clientSecret,
  onDone,
}: {
  clientSecret: string;
  onDone: () => void;
}) {
  if (!stripePromise) {
    return (
      <p className="muted">
        Stripe isn&apos;t configured (no <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>) — the
        escrow PaymentIntent was created server-side, but there&apos;s no way to confirm it from
        this client until a publishable key is set.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <ConfirmForm onDone={onDone} />
    </Elements>
  );
}
