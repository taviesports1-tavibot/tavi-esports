"use client";

import { CheckCircle2, LoaderCircle, Plus, Send, ShieldCheck, Trash2, UserRoundPlus, UsersRound } from "lucide-react";
import { useRef, useState } from "react";

const starterRoles = ["Jungle", "Mid Lane", "Gold Lane", "EXP Lane", "Roam"] as const;
const roles = [...starterRoles, "Substitute"] as const;

export type RosterPlayer = {
  nickname: string;
  mlbbId: string;
  mlbbServer: string;
  role: (typeof roles)[number];
};

export type CaptainTeam = {
  id: string;
  name: string;
  tag: string;
  description: string;
  captainTelegram: string;
  roster: RosterPlayer[];
};

const makeInitialPlayers = (): RosterPlayer[] => starterRoles.map((role) => ({ nickname: "", mlbbId: "", mlbbServer: "", role }));
const emptyDraft = { name: "", tag: "", description: "", captainTelegram: "" };

type RequestState = { loading: boolean; message: string; success: boolean };
const emptyState: RequestState = { loading: false, message: "", success: false };

export function TeamRegistrationManager({
  tournamentId,
  tournamentTitle,
  initialTeams
}: {
  tournamentId: string;
  tournamentTitle: string;
  initialTeams: CaptainTeam[];
}) {
  const createForm = useRef<HTMLFormElement>(null);
  const [players, setPlayers] = useState(makeInitialPlayers);
  const [teams, setTeams] = useState(initialTeams);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeams[0]?.id ?? "");
  const [createState, setCreateState] = useState<RequestState>(emptyState);
  const [registrationState, setRegistrationState] = useState<RequestState>(emptyState);
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  function updatePlayer(index: number, field: keyof RosterPlayer, value: string) {
    setPlayers((current) => current.map((player, playerIndex) => (
      playerIndex === index ? { ...player, [field]: value } as RosterPlayer : player
    )));
  }

  function editTeam(team: CaptainTeam) {
    setEditingTeamId(team.id);
    setDraft({ name: team.name, tag: team.tag, description: team.description, captainTelegram: team.captainTelegram });
    setPlayers(team.roster.length ? team.roster : makeInitialPlayers());
    setCreateState(emptyState);
    createForm.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetEditor() {
    setEditingTeamId(null);
    setDraft(emptyDraft);
    setPlayers(makeInitialPlayers());
    setCreateState(emptyState);
  }

  async function createTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateState({ loading: true, message: "", success: false });
    const response = await fetch(editingTeamId ? `/api/teams/${editingTeamId}` : "/api/teams", {
      method: editingTeamId ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        tag: draft.tag,
        description: draft.description,
        captainTelegram: draft.captainTelegram,
        roster: players
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setCreateState({ loading: false, success: false, message: payload?.error?.message ?? "Не вдалося створити команду" });
      return;
    }

    const team = payload.data.team as CaptainTeam;
    setTeams((current) => editingTeamId ? current.map((item) => item.id === team.id ? team : item) : [...current, team]);
    setSelectedTeamId(team.id);
    const wasEditing = Boolean(editingTeamId);
    setEditingTeamId(null);
    setDraft(emptyDraft);
    setPlayers(makeInitialPlayers());
    setRegistrationState(emptyState);
    setCreateState({ loading: false, success: true, message: wasEditing ? `Склад команди «${team.name}» оновлено.` : `Команду «${team.name}» створено. Тепер її можна подати на турнір.` });
  }

  async function registerTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTeamId) return;
    setRegistrationState({ loading: true, message: "", success: false });
    const response = await fetch(`/api/tournaments/${tournamentId}/registrations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ teamId: selectedTeamId })
    });
    const payload = await response.json().catch(() => null);
    setRegistrationState({
      loading: false,
      success: response.ok,
      message: response.ok
        ? `Команду «${selectedTeam?.name}» подано на турнір. Адміністратор перевірить заявку.`
        : payload?.error?.message ?? "Не вдалося надіслати заявку"
    });
  }

  return (
    <div className="captain-team-flow">
      <form className="surface team-form" onSubmit={createTeam} ref={createForm}>
        <div className="form-title">
          <UserRoundPlus />
          <div>
            <span className="flow-step">Крок 1</span>
            <h2>{editingTeamId ? "Оновити команду" : "Створити команду"}</h2>
            <p>{editingTeamId ? "Перевірте дані та збережіть актуальний склад." : "Капітан сам додає весь склад. Реєстрація окремих акаунтів гравців не потрібна."}</p>
          </div>
        </div>
        {editingTeamId && <button className="button button-ghost editor-cancel" type="button" onClick={resetEditor}>Скасувати редагування</button>}
        <div className="form-row">
          <label><span>Назва команди</span><input name="teamName" required minLength={3} maxLength={40} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="TaVi Academy" /></label>
          <label><span>Короткий тег</span><input name="tag" required minLength={2} maxLength={6} value={draft.tag} onChange={(event) => setDraft((current) => ({ ...current, tag: event.target.value }))} placeholder="TAVI" /></label>
        </div>
        <label><span>Опис команди</span><textarea name="description" maxLength={500} rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Коротко про склад і досвід команди" /></label>
        <label><span>Telegram капітана</span><input name="telegram" required value={draft.captainTelegram} onChange={(event) => setDraft((current) => ({ ...current, captainTelegram: event.target.value }))} placeholder="@username" autoCapitalize="none" /></label>

        <div className="roster-heading">
          <div><UsersRound /><span><strong>Склад команди</strong><small>5 основних + до 2 запасних</small></span></div>
          <b>{players.length}/7</b>
        </div>
        <div className="roster-list">
          {players.map((player, index) => (
            <div className="roster-player" key={`${index}-${index < 5 ? "starter" : "substitute"}`}>
              <strong>{index < 5 ? `Гравець ${index + 1}` : `Запасний ${index - 4}`}</strong>
              <input required aria-label={`Нікнейм гравця ${index + 1}`} value={player.nickname} onChange={(event) => updatePlayer(index, "nickname", event.target.value)} placeholder="Ігровий нік" />
              <div className="mlbb-fields">
                <input required inputMode="numeric" pattern="[0-9]+" aria-label={`MLBB ID гравця ${index + 1}`} value={player.mlbbId} onChange={(event) => updatePlayer(index, "mlbbId", event.target.value.replace(/\D/g, ""))} placeholder="MLBB ID" />
                <input required inputMode="numeric" pattern="[0-9]+" aria-label={`Сервер MLBB гравця ${index + 1}`} value={player.mlbbServer} onChange={(event) => updatePlayer(index, "mlbbServer", event.target.value.replace(/\D/g, ""))} placeholder="Сервер" />
              </div>
              <select aria-label={`Роль гравця ${index + 1}`} value={player.role} onChange={(event) => updatePlayer(index, "role", event.target.value)}>
                {roles.map((role) => <option key={role}>{role}</option>)}
              </select>
              {index >= 5 && (
                <button aria-label="Видалити запасного" className="roster-remove" type="button" onClick={() => setPlayers((current) => current.filter((_, playerIndex) => playerIndex !== index))}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {players.length < 7 && (
          <button className="button button-ghost" type="button" onClick={() => setPlayers((current) => [...current, { nickname: "", mlbbId: "", mlbbServer: "", role: "Substitute" }])}>
            <Plus size={16} /> Додати запасного
          </button>
        )}
        {createState.message && <Feedback state={createState} />}
        <button className="button button-primary button-large" disabled={createState.loading} type="submit">
          {createState.loading ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />} {editingTeamId ? "Зберегти склад" : "Створити команду зі складом"}
        </button>
      </form>

      <form className="surface team-form tournament-team-form" onSubmit={registerTeam}>
        <div className="form-title">
          <Send />
          <div>
            <span className="flow-step">Крок 2</span>
            <h2>Заявка на турнір</h2>
            <p>Оберіть готову команду — весь склад буде додано до заявки автоматично.</p>
          </div>
        </div>
        <div className="selected-tournament-box"><small>ОБРАНИЙ ТУРНІР</small><strong>{tournamentTitle}</strong></div>
        {teams.length ? (
          <>
            <label>
              <span>Команда капітана</span>
              <select value={selectedTeamId} onChange={(event) => { setSelectedTeamId(event.target.value); setRegistrationState(emptyState); }}>
                {teams.map((team) => <option value={team.id} key={team.id}>[{team.tag}] {team.name} · {team.roster.length} гравців</option>)}
              </select>
            </label>
            {selectedTeam && (
              <div className="selected-roster">
                <div><strong>Склад заявки</strong><span>{selectedTeam.roster.length} гравців</span><button type="button" onClick={() => editTeam(selectedTeam)}>Редагувати склад</button></div>
                {selectedTeam.roster.length ? <ul>{selectedTeam.roster.map((player) => <li key={`${player.mlbbId}-${player.mlbbServer}`}><b>{player.nickname}</b><span>{player.role}</span><small>{player.mlbbId} ({player.mlbbServer})</small></li>)}</ul> : <p className="roster-missing">Склад ще не заповнений. Натисніть «Редагувати склад».</p>}
              </div>
            )}
            {registrationState.message && <Feedback state={registrationState} />}
            <button className="button button-primary button-large" disabled={registrationState.loading || !selectedTeamId || !selectedTeam || selectedTeam.roster.length < 5} type="submit">
              {registrationState.loading ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} Подати команду на турнір
            </button>
          </>
        ) : (
          <div className="form-empty-note"><UsersRound /><div><strong>Спочатку створіть команду</strong><p>Заповніть склад у першому кроці, і команда одразу з’явиться тут.</p></div></div>
        )}
      </form>
    </div>
  );
}

function Feedback({ state }: { state: RequestState }) {
  return <p className={state.success ? "form-feedback success" : "form-feedback error"}>{state.success && <CheckCircle2 size={16} />}{state.message}</p>;
}
