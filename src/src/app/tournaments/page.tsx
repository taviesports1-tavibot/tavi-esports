import type { Metadata } from "next";
import { TournamentCard } from "@/components/tournament-card";
import { PageHero } from "@/components/ui";
import { tournaments } from "@/lib/data";

export const metadata: Metadata = {
  title: "Турніри",
  description: "Актуальні та завершені турніри Mobile Legends: Bang Bang від TaVi Esports."
};

export default function TournamentsPage() {
  return (
    <>
      <PageHero
        eyebrow="TaVi Tournaments"
        title="Знайди свій наступний турнір"
        text="Від швидких 1×1 до великих командних сіток. Прозорі правила, підтверджені результати й автоматичне просування переможців."
      >
        <div className="filter-bar" aria-label="Фільтри турнірів">
          <button className="filter-chip active" type="button">
            Усі
          </button>
          <button className="filter-chip" type="button">
            Реєстрація
          </button>
          <button className="filter-chip" type="button">
            Незабаром
          </button>
          <button className="filter-chip" type="button">
            Завершені
          </button>
        </div>
      </PageHero>
      <section className="content-section">
        <div className="shell">
          <div className="card-grid tournament-grid">
            {tournaments.map((tournament) => (
              <TournamentCard tournament={tournament} key={tournament.id} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

