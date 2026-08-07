import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Вхід" };

export default function LoginPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <Logo />
        <span className="auth-kicker">WELCOME BACK</span>
        <h1>Поверніться до гри</h1>
        <p>Увійдіть, щоб керувати командою, матчами, повідомленнями та винагородами.</p>
        <AuthForm mode="login" />
      </div>
      <div className="auth-visual" aria-hidden="true">
        <div className="auth-shield">T</div>
        <strong>RISE ABOVE</strong>
        <span>TaVi Esports Platform</span>
      </div>
    </section>
  );
}

