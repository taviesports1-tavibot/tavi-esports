"use client";

import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { FormEvent, useState } from "react";

export function AdminPromoForm() {
  const [state, setState] = useState<{ kind: "idle" | "error" | "success"; message: string }>({
    kind: "idle",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setState({ kind: "idle", message: "" });
    const form = new FormData(event.currentTarget);
    const payload = {
      code: form.get("code"),
      rewardType: form.get("rewardType"),
      rewardAmount: Number(form.get("rewardAmount")),
      maxUses: Number(form.get("maxUses")),
      maxUsesPerUser: Number(form.get("maxUsesPerUser")),
      startsAt: new Date(String(form.get("startsAt"))).toISOString(),
      expiresAt: new Date(String(form.get("expiresAt"))).toISOString(),
      active: true
    };

    try {
      const response = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Не вдалося створити промокод");
      setState({ kind: "success", message: `Промокод ${result.data.promo.code} створено` });
      event.currentTarget.reset();
    } catch (caught) {
      setState({
        kind: "error",
        message: caught instanceof Error ? caught.message : "Сталася невідома помилка"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="surface admin-promo-form" onSubmit={submit}>
      <div className="admin-card-head">
        <div>
          <small>REWARDS</small>
          <h2>Створити промокод</h2>
        </div>
        <Plus />
      </div>
      {state.kind !== "idle" && (
        <div className={state.kind === "success" ? "admin-notice success" : "admin-notice error"}>
          {state.kind === "success" ? <CheckCircle2 /> : <AlertCircle />} {state.message}
        </div>
      )}
      <div className="admin-form-grid">
        <label>
          <span>Код</span>
          <input name="code" placeholder="TAVI2026" minLength={3} maxLength={32} required />
        </label>
        <label>
          <span>Тип нагороди</span>
          <select name="rewardType" defaultValue="coins">
            <option value="coins">TaVi Coins</option>
            <option value="wheel_tickets">Квитки Колеса Фортуни</option>
          </select>
        </label>
        <label>
          <span>Кількість нагороди</span>
          <input name="rewardAmount" type="number" defaultValue={100} min={1} max={100000} required />
        </label>
        <label>
          <span>Загальний ліміт</span>
          <input name="maxUses" type="number" defaultValue={100} min={1} max={100000} required />
        </label>
        <label>
          <span>На одного гравця</span>
          <input name="maxUsesPerUser" type="number" defaultValue={1} min={1} max={100} required />
        </label>
        <label>
          <span>Початок</span>
          <input name="startsAt" type="datetime-local" required />
        </label>
        <label>
          <span>Завершення</span>
          <input name="expiresAt" type="datetime-local" required />
        </label>
      </div>
      <button className="button button-primary" disabled={loading} type="submit">
        {loading ? "Створення…" : "Створити промокод"}
      </button>
    </form>
  );
}

