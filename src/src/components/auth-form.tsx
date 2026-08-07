"use client";

import { AlertCircle, ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Не вдалося виконати запит");
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Сталася невідома помилка");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <form className="auth-form" onSubmit={submit}>
      {error && (
        <div className="form-alert" role="alert">
          <AlertCircle size={17} /> {error}
        </div>
      )}
      {!isLogin && (
        <label>
          <span>Ігровий нікнейм</span>
          <div className="input-wrap">
            <UserRound size={17} />
            <input name="nickname" minLength={3} maxLength={24} placeholder="Наприклад, Bazuka" required />
          </div>
        </label>
      )}
      <label>
        <span>Email</span>
        <div className="input-wrap">
          <Mail size={17} />
          <input name="email" type="email" autoComplete="email" placeholder="name@example.com" required />
        </div>
      </label>
      <label>
        <span>Пароль</span>
        <div className="input-wrap">
          <LockKeyhole size={17} />
          <input
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={isLogin ? 1 : 8}
            placeholder="••••••••"
            required
          />
        </div>
        {!isLogin && <small>Мінімум 8 символів, велика літера та цифра</small>}
      </label>
      <button className="button button-primary button-large" disabled={loading} type="submit">
        {loading ? "Зачекайте…" : isLogin ? "Увійти до профілю" : "Створити профіль"}
        {!loading && <ArrowRight size={17} />}
      </button>
      <p className="auth-switch">
        {isLogin ? "Ще немає профілю?" : "Вже маєте профіль?"}{" "}
        <Link href={isLogin ? "/register" : "/login"}>{isLogin ? "Зареєструватися" : "Увійти"}</Link>
      </p>
    </form>
  );
}

