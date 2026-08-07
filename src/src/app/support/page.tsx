import { Clock3, HelpCircle, MessageSquareText, Send } from "lucide-react";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Підтримка" };

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Support Center"
        title="Ми допоможемо"
        text="Проблема з реєстрацією, матчем, результатом або профілем? Створіть звернення — воно отримає номер і статус."
      />
      <section className="content-section">
        <div className="shell support-layout">
          <form className="surface support-form">
            <h2>Нове звернення</h2>
            <p>Не додавайте пароль, коди підтвердження або банківські дані.</p>
            <label>
              <span>Тема</span>
              <select defaultValue="technical">
                <option value="technical">Технічна проблема</option>
                <option value="tournament">Турнір або матч</option>
                <option value="account">Профіль та авторизація</option>
                <option value="payment">TaVi Coins або промокод</option>
              </select>
            </label>
            <label>
              <span>Опис</span>
              <textarea rows={7} placeholder="Опишіть, що сталося і що ви вже спробували…" />
            </label>
            <button className="button button-primary button-large" type="button">
              <Send size={17} /> Надіслати звернення
            </button>
          </form>
          <aside className="support-info">
            <div className="surface">
              <HelpCircle />
              <h3>Адміністратори</h3>
              <p>Головний адміністратор: @bazuka_ml</p>
              <p>Турнірний адміністратор: @vinks_03</p>
            </div>
            <div className="surface">
              <Clock3 />
              <h3>Статус звернення</h3>
              <p>Нове → У роботі → Потрібна відповідь → Вирішено</p>
            </div>
            <div className="surface">
              <MessageSquareText />
              <h3>Telegram</h3>
              <p>Для термінового питання перед матчем напишіть адміністратору турніру.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

