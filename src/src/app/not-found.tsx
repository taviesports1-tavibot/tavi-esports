import Link from "next/link";
import { Eyebrow } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="auth-required">
      <div className="auth-required-card">
        <span className="empty-mark">T</span>
        <Eyebrow>404 · Not Found</Eyebrow>
        <h1>Сторінку не знайдено</h1>
        <p>Можливо, адресу змінено або цей розділ ще готується до наступного матчу.</p>
        <Link className="button button-primary button-large" href="/">
          На головну
        </Link>
      </div>
    </section>
  );
}

