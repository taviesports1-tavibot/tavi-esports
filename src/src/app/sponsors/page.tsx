import { ArrowRight, BarChart3, Eye, Handshake, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Спонсорам" };

export default function SponsorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Partnership"
        title="Розвиваймо український кіберспорт разом"
        text="Нативні інтеграції у турніри, трансляції та контент TaVi з прозорою статистикою і зрозумілими форматами."
      >
        <div className="page-actions">
          <a className="button button-primary button-large" href="https://t.me/bazuka_ml" target="_blank" rel="noreferrer">
            Обговорити партнерство <ArrowRight size={17} />
          </a>
        </div>
      </PageHero>
      <section className="content-section">
        <div className="shell partner-grid">
          <Partner icon={<Eye />} title="Видимість" text="Логотипи, згадки, інтеграції в ефір і окремі брендовані активності." />
          <Partner icon={<UsersRound />} title="Спільнота" text="Прямий контакт з активною українською MLBB-аудиторією." />
          <Partner icon={<BarChart3 />} title="Звітність" text="Покази, переходи, охоплення ефіру та підсумковий звіт кампанії." />
          <Partner icon={<Handshake />} title="Гнучкість" text="Разова підтримка турніру або довгострокове партнерство сезону." />
        </div>
      </section>
    </>
  );
}

function Partner({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="surface partner-card">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}

