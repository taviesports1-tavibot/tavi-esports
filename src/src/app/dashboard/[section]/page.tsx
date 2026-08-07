import { ArrowLeft, Settings2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui";
import { getSession } from "@/lib/auth";

const sections: Record<string, { title: string; text: string }> = {
  profile: { title: "Мій профіль", text: "Аватар, MLBB ID, роль, контакти та налаштування видимості." },
  team: { title: "Моя команда", text: "Склад, запрошення, ролі, заміни та історія команди." },
  tournaments: { title: "Мої турніри", text: "Заявки, статуси реєстрації, майбутні та завершені турніри." },
  matches: { title: "Мої матчі", text: "Розклад, лобі, звіти про результат і спірні матчі." },
  friends: { title: "Друзі", text: "Заявки в друзі, список контактів і гравці онлайн." },
  achievements: { title: "Досягнення", text: "Відзнаки, прогрес і сезонні нагороди." },
  wallet: { title: "Фінанси", text: "TaVi Coins, квитки, промокоди й повна історія операцій." },
  settings: { title: "Налаштування", text: "Безпека, сповіщення, мова, тема та приватність." },
  "team-search": { title: "Пошук команди", text: "Створіть анкету або знайдіть гравців за роллю та графіком." }
};

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const section = sections[(await params).section];
  return { title: section?.title || "Особистий кабінет" };
}

export default async function DashboardSectionPage({ params }: Props) {
  const section = sections[(await params).section];
  if (!section) notFound();
  const user = await getSession();

  if (!user) {
    return (
      <section className="auth-required">
        <div className="auth-required-card">
          <Settings2 size={34} />
          <Eyebrow>Кабінет гравця</Eyebrow>
          <h1>Потрібна авторизація</h1>
          <p>Увійдіть, щоб відкрити розділ «{section.title}».</p>
          <Link className="button button-primary button-large" href="/login">
            Увійти
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-page">
      <div className="shell">
        <Link className="back-link" href="/dashboard">
          <ArrowLeft size={16} /> Особистий кабінет
        </Link>
        <div className="dashboard-section-head">
          <Eyebrow>TaVi ID · {user.id.slice(0, 8)}</Eyebrow>
          <h1>{section.title}</h1>
          <p>{section.text}</p>
        </div>
        <div className="empty-state">
          <span className="empty-mark">T</span>
          <h3>Розділ готовий до даних</h3>
          <p>Інтерфейс підключено. Вміст з’явиться після підключення PostgreSQL та імпорту старих даних.</p>
          <Link className="button button-ghost" href="/dashboard">
            Повернутися до огляду
          </Link>
        </div>
      </div>
    </section>
  );
}

