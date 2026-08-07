import type { Metadata } from "next";
import { RankingTable } from "@/components/ranking-table";
import { PageHero } from "@/components/ui";
import { players } from "@/lib/data";

export const metadata: Metadata = {
  title: "Рейтинг",
  description: "Сезонний рейтинг гравців TaVi Esports."
};

export default function RatingPage() {
  return (
    <>
      <PageHero
        eyebrow="Season 2026"
        title="Рейтинг гравців"
        text="Очки нараховуються за підтверджені турнірні матчі. Сильніші суперники, серії перемог і місце в турнірі впливають на результат."
      >
        <div className="filter-bar">
          <button className="filter-chip active" type="button">
            Гравці
          </button>
          <button className="filter-chip" type="button">
            Команди
          </button>
          <button className="filter-chip" type="button">
            Поточний сезон
          </button>
        </div>
      </PageHero>
      <section className="content-section">
        <div className="shell">
          <div className="rating-summary">
            <div>
              <span>Сезон</span>
              <strong>Summer 2026</strong>
            </div>
            <div>
              <span>Матчів враховано</span>
              <strong>1 284</strong>
            </div>
            <div>
              <span>Наступне оновлення</span>
              <strong>Після кожного матчу</strong>
            </div>
          </div>
          <RankingTable items={players} />
        </div>
      </section>
    </>
  );
}

