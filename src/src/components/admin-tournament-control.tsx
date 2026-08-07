"use client";

import { Check, Clock3, LoaderCircle, Play, ShieldCheck, Swords, X } from "lucide-react";
import { useState } from "react";

type Registration = { id: string; status: string; seed: number | null; team_name: string; tag: string; roster_snapshot: unknown[]; captain_nickname: string; telegram: string | null };
type Match = { id: string; match_code: string | null; stage_type: string | null; best_of: number; status: string; one_name: string | null; two_name: string | null; participant_one_score: number; participant_two_score: number; scheduled_at: string | null };

export function AdminTournamentControl({ tournamentId, registrations, matches }: { tournamentId: string; registrations: Registration[]; matches: Match[] }) {
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function call(key: string, url: string, method: string, body: unknown) {
    setBusy(key); setMessage("");
    const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => null);
    setBusy("");
    if (!response.ok) return setMessage(payload?.error?.message ?? "Операцію не виконано");
    window.location.reload();
  }

  return <div className="admin-tournament-workspace">
    <section className="surface admin-stage-controls">
      <div className="admin-card-head"><div><small>АВТОМАТИЗАЦІЯ</small><h2>Етапи турніру</h2></div><Swords /></div>
      <p>Створюйте наступний етап лише після завершення попереднього. Система сама розставить команди та маршрути переможців.</p>
      <div className="stage-actions">
        {[['qualification', '1. Створити кваліфікацію'], ['groups', '2. Створити 4 групи'], ['playoff', '3. Створити плей-оф']].map(([phase, label]) => <button className="button button-ghost" disabled={Boolean(busy)} key={phase} onClick={() => call(`stage-${phase}`, `/api/admin/tournaments/${tournamentId}/generate`, "POST", { phase })}>{busy === `stage-${phase}` ? <LoaderCircle className="spin" size={16} /> : <Play size={16} />}{label}</button>)}
      </div>
      {message && <p className="admin-notice error">{message}</p>}
    </section>

    <section className="surface admin-registration-list">
      <div className="admin-card-head"><div><small>ЗАЯВКИ</small><h2>Склади команд</h2></div><ShieldCheck /></div>
      {registrations.length === 0 ? <p className="admin-empty">Заявок поки немає.</p> : registrations.map((registration) => <div className="admin-registration" key={registration.id}>
        <div><strong>[{registration.tag}] {registration.team_name}</strong><span>{registration.captain_nickname} · {registration.telegram ?? "Telegram не вказано"} · {registration.roster_snapshot?.length ?? 0} гравців</span></div>
        <span className={`review-status ${registration.status}`}>{registration.status}</span>
        {registration.status === 'pending' && <div><button aria-label="Схвалити" className="review-approve" disabled={Boolean(busy)} onClick={() => call(`approve-${registration.id}`, `/api/admin/tournaments/${tournamentId}/registrations/${registration.id}`, "PATCH", { action: "approve" })}><Check size={16} /></button><button aria-label="Відхилити" className="review-reject" disabled={Boolean(busy)} onClick={() => call(`reject-${registration.id}`, `/api/admin/tournaments/${tournamentId}/registrations/${registration.id}`, "PATCH", { action: "reject" })}><X size={16} /></button></div>}
      </div>)}
    </section>

    <section className="surface admin-match-list">
      <div className="admin-card-head"><div><small>МАТЧІ</small><h2>Результати й розклад</h2></div><Clock3 /></div>
      {matches.length === 0 ? <p className="admin-empty">Матчі з’являться після створення етапу.</p> : matches.map((match) => <MatchEditor key={match.id} match={match} busy={busy} onSave={(body) => call(`match-${match.id}`, `/api/admin/matches/${match.id}`, "PATCH", body)} />)}
    </section>
  </div>;
}

function MatchEditor({ match, busy, onSave }: { match: Match; busy: string; onSave: (body: unknown) => void }) {
  const [one, setOne] = useState(match.participant_one_score);
  const [two, setTwo] = useState(match.participant_two_score);
  const [scheduledAt, setScheduledAt] = useState(match.scheduled_at ? new Date(match.scheduled_at).toISOString().slice(0, 16) : "");
  return <div className="admin-match-row"><div><small>{match.stage_type ?? "етап"} · {match.match_code ?? match.id.slice(0, 8)} · BO{match.best_of}</small><strong>{match.one_name ?? "Очікується"} <em>vs</em> {match.two_name ?? "Очікується"}</strong></div><input aria-label="Дата матчу" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><div className="score-inputs"><input aria-label="Рахунок першої команди" min={0} type="number" value={one} onChange={(event) => setOne(Number(event.target.value))} /><span>:</span><input aria-label="Рахунок другої команди" min={0} type="number" value={two} onChange={(event) => setTwo(Number(event.target.value))} /></div><button className="button button-ghost" disabled={busy === `match-${match.id}` || match.status === "completed"} onClick={() => onSave({ scoreOne: one, scoreTwo: two, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null, complete: true })}>{busy === `match-${match.id}` ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />} {match.status === "completed" ? "Завершено" : "Підтвердити"}</button></div>;
}
