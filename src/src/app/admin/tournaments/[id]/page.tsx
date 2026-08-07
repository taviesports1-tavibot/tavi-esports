import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminTournamentControl } from "@/components/admin-tournament-control";
import { Eyebrow } from "@/components/ui";
import { getSession, isAdmin } from "@/lib/auth";
import { db, hasDatabase } from "@/lib/db";

export const metadata: Metadata = { title: "Керування турніром" };

type ManagedTournament = { id: string; title: string; status: string };
type ManagedRegistration = { id: string; status: string; seed: number | null; team_name: string; tag: string; roster_snapshot: unknown[]; captain_nickname: string; telegram: string | null };
type ManagedMatch = { id: string; match_code: string | null; stage_type: string | null; best_of: number; status: string; one_name: string | null; two_name: string | null; participant_one_score: number; participant_two_score: number; scheduled_at: string | null };

export default async function AdminTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!isAdmin(user)) return <section className="auth-required"><div className="auth-required-card"><ShieldCheck /><h1>Доступ лише для адміністраторів</h1><Link className="button button-primary" href="/login">Увійти</Link></div></section>;
  const { id } = await params;
  let tournament: ManagedTournament = { id, title: "TaVi Major 5×5", status: "demo" };
  let registrations: ManagedRegistration[] = [];
  let matches: ManagedMatch[] = [];
  if (hasDatabase()) {
    const tournamentRows = await db()`SELECT id, title, status FROM tournaments WHERE id = ${id}`;
    if (tournamentRows.length) tournament = { id: String(tournamentRows[0].id), title: String(tournamentRows[0].title), status: String(tournamentRows[0].status) };
    const registrationRows = await db()`SELECT tr.id, tr.status, tr.seed, tr.roster_snapshot, t.name AS team_name, t.tag, u.nickname AS captain_nickname, up.telegram FROM tournament_registrations tr JOIN teams t ON t.id = tr.team_id JOIN users u ON u.id = tr.captain_id LEFT JOIN user_profiles up ON up.user_id = tr.captain_id WHERE tr.tournament_id = ${id} ORDER BY tr.created_at`;
    registrations = registrationRows.map((row) => ({ id: String(row.id), status: String(row.status), seed: row.seed == null ? null : Number(row.seed), team_name: String(row.team_name), tag: String(row.tag), roster_snapshot: Array.isArray(row.roster_snapshot) ? row.roster_snapshot : [], captain_nickname: String(row.captain_nickname), telegram: row.telegram == null ? null : String(row.telegram) }));
    const matchRows = await db()`SELECT m.id, m.match_code, ts.stage_type, m.best_of, m.status, m.participant_one_score, m.participant_two_score, m.scheduled_at, t1.name AS one_name, t2.name AS two_name FROM matches m LEFT JOIN tournament_stages ts ON ts.id = m.stage_id LEFT JOIN tournament_registrations r1 ON r1.id = m.participant_one_registration_id LEFT JOIN teams t1 ON t1.id = r1.team_id LEFT JOIN tournament_registrations r2 ON r2.id = m.participant_two_registration_id LEFT JOIN teams t2 ON t2.id = r2.team_id WHERE m.tournament_id = ${id} ORDER BY COALESCE(ts.stage_order, 0), m.round_number, m.match_number`;
    matches = matchRows.map((row) => ({ id: String(row.id), match_code: row.match_code == null ? null : String(row.match_code), stage_type: row.stage_type == null ? null : String(row.stage_type), best_of: Number(row.best_of), status: String(row.status), one_name: row.one_name == null ? null : String(row.one_name), two_name: row.two_name == null ? null : String(row.two_name), participant_one_score: Number(row.participant_one_score), participant_two_score: Number(row.participant_two_score), scheduled_at: row.scheduled_at == null ? null : String(row.scheduled_at) }));
  }
  return <section className="admin-tournament-page"><div className="shell"><Link className="back-link" href="/admin"><ArrowLeft size={16} /> Адмін-панель</Link><div className="admin-tournament-head"><div><Eyebrow>Tournament Control</Eyebrow><h1>{tournament.title}</h1><p>Кваліфікація, групи, плей-оф, результати та місця 1–6.</p></div><span className="status status-registration">{tournament.status}</span></div><AdminTournamentControl tournamentId={id} registrations={registrations} matches={matches} /></div></section>;
}
