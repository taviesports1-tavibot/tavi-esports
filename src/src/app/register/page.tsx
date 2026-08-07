import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Реєстрація" };

export default function RegisterPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <Logo />
        <span className="auth-kicker">JOIN TAVI</span>
        <h1>Створіть профіль гравця</h1>
        <p>Один профіль для турнірів, команд, рейтингу, друзів, чату та всіх винагород TaVi.</p>
        <AuthForm mode="register" />
      </div>
      <div className="auth-visual register-visual" aria-hidden="true">
        <div className="auth-shield">T</div>
        <strong>РАЗОМ ДО ПЕРЕМОГИ</strong>
        <span>Українська MLBB-спільнота</span>
      </div>
    </section>
  );
}

