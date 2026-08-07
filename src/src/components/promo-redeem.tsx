"use client";

import { CheckCircle2, Gift, Ticket, WalletCards } from "lucide-react";
import { FormEvent, useState } from "react";

export function PromoRedeem() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/promos/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.get("code") })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Промокод не активовано");
      setSuccess(true);
      setMessage(result.data.message);
      event.currentTarget.reset();
    } catch (caught) {
      setSuccess(false);
      setMessage(caught instanceof Error ? caught.message : "Сталася помилка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="promo-box surface" onSubmit={submit}>
      <span className="promo-icon">
        <Gift />
      </span>
      <div>
        <h2>Є промокод?</h2>
        <p>Активуйте TaVi Coins або квитки Колеса Фортуни.</p>
      </div>
      <div className="promo-input">
        <input name="code" aria-label="Промокод" placeholder="ВВЕДІТЬ КОД" minLength={3} maxLength={32} required />
        <button className="button button-primary" disabled={loading} type="submit">
          {loading ? "Активація…" : "Активувати"}
        </button>
      </div>
      {message && (
        <p className={success ? "promo-message success" : "promo-message error"}>
          {success ? <CheckCircle2 size={16} /> : <Ticket size={16} />} {message}
        </p>
      )}
      <span className="promo-note">
        <WalletCards size={14} /> Нагорода одразу з’явиться у вашому балансі
      </span>
    </form>
  );
}

