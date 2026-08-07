"use client";

import { CheckCircle2, LoaderCircle, Plus, Send, Trash2 } from "lucide-react";
import { useState } from "react";

const roles = ["Jungle", "Mid Lane", "Gold Lane", "EXP Lane", "Roam", "Substitute"];
const initialPlayers = roles.slice(0, 5).map((role) => ({ nickname: "", mlbbId: "", role }));

export function TournamentRegistrationForm({ tournamentId }: { tournamentId: string }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [state, setState] = useState<{ loading: boolean; message: string; success: boolean }>({ loading: false, message: "", success: false });

  function updatePlayer(index: number, field: "nickname" | "mlbbId" | "role", value: string) {
    setPlayers((current) => current.map((player, playerIndex) => playerIndex === index ? { ...player, [field]: value } : player));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true, message: "", success: false });
    const response = await fetch(`/api/tournaments/${tournamentId}/registrations`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ teamName: form.get("teamName"), tag: form.get("tag"), captainTelegram: form.get("telegram"), roster: players })
    });
    const payload = await response.json().catch(() => null);
    setState({ loading: false, success: response.ok, message: response.ok ? "Заявку надіслано. Адміністратор перевірить склад." : payload?.error?.message ?? "Не вдалося надіслати заявку" });
  }

  return (
    <form className="surface team-form" onSubmit={submit}>
      <div className="form-title"><Send /><div><h2>Заявка на великий турнір</h2><p>Додайте від 5 до 7 гравців. Після перевірки команда отримає посів.</p></div></div>
      <div className="form-row"><label><span>Назва команди</span><input name="teamName" required placeholder="TaVi Academy" /></label><label><span>Тег</span><input name="tag" required maxLength={6} placeholder="TAVI" /></label></div>
      <label><span>Telegram капітана</span><input name="telegram" required placeholder="@username" /></label>
      <div className="roster-list">
        {players.map((player, index) => <div key={index}><strong>{index < 5 ? `Гравець ${index + 1}` : `Запасний ${index - 4}`}</strong><input required aria-label={`Нікнейм гравця ${index + 1}`} value={player.nickname} onChange={(event) => updatePlayer(index, "nickname", event.target.value)} placeholder="Нікнейм" /><input required aria-label={`MLBB ID гравця ${index + 1}`} value={player.mlbbId} onChange={(event) => updatePlayer(index, "mlbbId", event.target.value)} placeholder="MLBB ID" /><select aria-label={`Роль гравця ${index + 1}`} value={player.role} onChange={(event) => updatePlayer(index, "role", event.target.value)}>{roles.map((role) => <option key={role}>{role}</option>)}</select>{index >= 5 && <button aria-label="Видалити запасного" className="roster-remove" type="button" onClick={() => setPlayers((current) => current.filter((_, playerIndex) => playerIndex !== index))}><Trash2 size={15} /></button>}</div>)}
      </div>
      {players.length < 7 && <button className="button button-ghost" type="button" onClick={() => setPlayers((current) => [...current, { nickname: "", mlbbId: "", role: "Substitute" }])}><Plus size={16} /> Додати запасного</button>}
      {state.message && <p className={state.success ? "form-feedback success" : "form-feedback error"}>{state.success && <CheckCircle2 size={16} />}{state.message}</p>}
      <button className="button button-primary button-large" disabled={state.loading} type="submit">{state.loading ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />} Надіслати склад</button>
    </form>
  );
}
