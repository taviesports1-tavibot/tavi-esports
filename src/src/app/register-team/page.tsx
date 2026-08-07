import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { TournamentRegistrationForm } from "@/components/tournament-registration-form";
import { tournaments } from "@/lib/data";

export const metadata: Metadata = { title: "Реєстрація команди" };

export default async function RegisterTeamPage({ searchParams }: { searchParams: Promise<{ tournament?: string }> }) {
  const requested = (await searchParams).tournament;
  const tournament = tournaments.find((item) => item.id === requested || item.slug === requested) ?? tournaments.find((item) => item.largeFormat) ?? tournaments[0];
  return (
    <>
      <PageHero
        eyebrow="Team Registration"
        title="Зареєструйте команду"
        text="Створіть команду один раз, запросіть гравців і використовуйте підтверджений склад у всіх турнірах TaVi."
      />
      <section className="content-section">
        <div className="shell team-form-layout">
          <TournamentRegistrationForm tournamentId={tournament.id} />
          <aside className="surface team-form-note">
            <ShieldCheck />
            <h2>Перед відправленням</h2>
            <p className="selected-tournament">Турнір: <strong>{tournament.title}</strong></p>
            <p>Перевірте MLBB ID, ролі та Telegram капітана. Запрошення до складу має підтвердити кожен гравець.</p>
            <ul>
              <li>5 основних гравців</li>
              <li>До 2 запасних</li>
              <li>Один підтверджений капітан</li>
              <li>Унікальна назва та тег</li>
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
