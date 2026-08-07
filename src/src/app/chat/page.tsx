import { MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Чат" };

export default async function ChatPage() {
  const session = await getSession();
  if (!session) {
    return (
      <section className="auth-required">
        <div className="auth-required-card">
          <MessageSquareText size={34} />
          <Eyebrow>TaVi Chat</Eyebrow>
          <h1>Спілкуйтеся після входу</h1>
          <p>Приватні повідомлення, командні й турнірні чати доступні лише авторизованим гравцям.</p>
          <Link className="button button-primary button-large" href="/login">
            Увійти
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-page">
      <div className="shell chat-shell surface">
        <aside>
          <Eyebrow>Повідомлення</Eyebrow>
          <h1>Чати</h1>
          <div className="chat-search">Пошук діалогу…</div>
          <button className="chat-room active" type="button">
            <span>TV</span>
            <div>
              <strong>TaVi Summer Clash</strong>
              <small>Турнірний чат</small>
            </div>
          </button>
        </aside>
        <div className="chat-window">
          <div className="chat-window-head">
            <div>
              <strong>TaVi Summer Clash</strong>
              <span>28 учасників</span>
            </div>
          </div>
          <div className="chat-empty">
            <MessageSquareText />
            <h2>Чат готовий</h2>
            <p>Повідомлення зберігатимуться тут. Модерація та захист від спаму працюють на сервері.</p>
          </div>
          <div className="chat-compose">
            <input aria-label="Повідомлення" placeholder="Напишіть повідомлення…" />
            <button className="button button-primary" type="button">
              Надіслати
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

