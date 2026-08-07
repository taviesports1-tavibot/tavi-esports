import { Radio, Youtube } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState, PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Трансляції" };

export default function StreamsPage() {
  return (
    <>
      <PageHero
        eyebrow="TaVi Live"
        title="Трансляції матчів"
        text="Прямі ефіри, записи фіналів і розклад майбутніх трансляцій в одному розділі."
      />
      <section className="content-section">
        <div className="shell">
          <div className="stream-status surface">
            <Radio size={20} />
            <div>
              <strong>Зараз немає прямого ефіру</strong>
              <span>Наступна трансляція з’явиться тут автоматично після публікації адміністратором.</span>
            </div>
            <a className="button button-ghost" href="https://youtube.com" target="_blank" rel="noreferrer">
              <Youtube size={17} /> YouTube
            </a>
          </div>
          <EmptyState
            title="Ефір готується"
            text="Підпишіться на Telegram TaVi, щоб не пропустити анонс наступного матчу."
            action="Telegram TaVi"
            href="https://t.me/taviesports"
          />
        </div>
      </section>
    </>
  );
}

