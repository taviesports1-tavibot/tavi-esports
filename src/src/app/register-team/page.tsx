import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";
import { TeamRegistrationManager, type CaptainTeam } from "@/components/tournament-registration-form";
import { getSession } from "@/lib/auth";
import { tournaments } from "@/lib/data";
import { db, ensureTeamRosterSchema, hasDatabase } from "@/lib/db";

export const metadata: Metadata = { title: "Реєстрація команди" };

export default async function RegisterTeamPage({ searchParams }: { searchParams: Promise<{ tournament?: string }> }) {
  const [{ tournament: requested }, user] = await Promise.all([searchParams, getSession()]);
  const tournament = tournaments.find((item) => item.id === requested || item.slug === requested) ?? tournaments.find((item) => item.largeFormat) ?? tournaments[0];
  if (!user) {
    return (
      <section className="auth-required">
        <div className="auth-required-card">
          <ShieldCheck size={34} />
          <h1>Увійдіть як капітан</h1>
          <p>Після входу ви зможете створити команду, додати весь MLBB-склад і подати одну заявку на турнір.</p>
          <div><Link className="button button-primary button-large" href="/login">Увійти</Link><Link className="button button-ghost button-large" href="/register">Створити профіль</Link></div>
        </div>
      </section>
    );
  }

  let initialTeams: CaptainTeam[] = [];
  if (hasDatabase()) {
    try {
      await ensureTeamRosterSchema();
      const rows = await db()`
        SELECT t.id, t.name, t.tag, t.description, up.telegram,
          COALESCE(jsonb_agg(jsonb_build_object(
            'nickname', trm.nickname,
            'mlbbId', trm.mlbb_id,
            'mlbbServer', trm.mlbb_server,
            'role', trm.game_role
          ) ORDER BY trm.sort_order) FILTER (WHERE trm.id IS NOT NULL), '[]'::jsonb) AS roster
        FROM teams t
        LEFT JOIN team_roster_members trm ON trm.team_id = t.id
        LEFT JOIN user_profiles up ON up.user_id = t.captain_id
        WHERE t.captain_id = ${user.id} AND t.active
        GROUP BY t.id, t.name, t.tag, t.description, up.telegram, t.created_at
        ORDER BY t.created_at DESC
      `;
      initialTeams = rows.map((team) => ({
        id: String(team.id),
        name: String(team.name),
        tag: String(team.tag),
        description: team.description == null ? "" : String(team.description),
        captainTelegram: team.telegram == null ? "" : String(team.telegram),
        roster: Array.isArray(team.roster) ? team.roster as CaptainTeam["roster"] : []
      }));
    } catch (error) {
      console.error("captain_teams_load_failed", error);
    }
  }
  return (
    <>
      <PageHero
        eyebrow="Team Registration"
        title="Створіть команду"
        text="Капітан сам формує повний MLBB-склад, а потім подає одну заявку за всю команду."
      />
      <section className="content-section">
        <div className="shell team-form-layout">
          <TeamRegistrationManager tournamentId={tournament.id} tournamentTitle={tournament.title} initialTeams={initialTeams} />
          <aside className="surface team-form-note">
            <ShieldCheck />
            <h2>Як це працює</h2>
            <p>Капітан додає гравців сам — їм не потрібно окремо реєструватися або підтверджувати запрошення.</p>
            <ul>
              <li>Вкажіть нік, MLBB ID і сервер</li>
              <li>Призначте 5 основних ролей</li>
              <li>За бажанням додайте до 2 запасних</li>
              <li>Оберіть команду та подайте її на турнір</li>
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
