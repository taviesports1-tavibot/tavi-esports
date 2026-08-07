import { Award, Crown, GitBranch, Medal, Shield, Swords, UsersRound } from "lucide-react";
import { calculateStandings, createGroups, createPlayoff, type GroupResult, type TournamentSeed } from "@/lib/tournament-engine";

const demoTeams: TournamentSeed[] = [
  "TaVi", "Opertum", "Carpathian Wolves", "Nova Core", "Kyiv Titans", "Dnipro Force", "Lviv Phoenix", "Black Sea", "Valkyrie UA", "Night Raid", "Ruthless Five", "Iron Pulse", "Wild Hunt", "Atlas", "Thunderborn", "Cyber Sich"
].map((name, index) => ({ id: `demo-${index + 1}`, name, seed: index + 1 }));

function demoStandings() {
  return Object.fromEntries(createGroups(demoTeams).map((group) => {
    const results: GroupResult[] = [];
    group.matches.forEach((match, index) => {
      if (match.participantOne.type !== "registration" || match.participantTwo.type !== "registration") return;
      const oneWins = index % 3 !== 1;
      results.push({ registrationId: match.participantOne.registrationId, opponentRegistrationId: match.participantTwo.registrationId, score: oneWins ? 1 : 0, opponentScore: oneWins ? 0 : 1 });
      results.push({ registrationId: match.participantTwo.registrationId, opponentRegistrationId: match.participantOne.registrationId, score: oneWins ? 0 : 1, opponentScore: oneWins ? 1 : 0 });
    });
    return [group.name, calculateStandings(group.members, results)];
  }));
}

export function LargeTournamentView() {
  const groups = demoStandings();
  const playoff = createPlayoff(groups);
  return (
    <div className="major-sections">
      <article className="surface major-roadmap">
        <div className="major-section-head"><GitBranch /><div><small>ФОРМАТ ТУРНІРУ</small><h2>Від кваліфікації до шести призових місць</h2></div></div>
        <div className="stage-flow">
          <Stage icon={<UsersRound />} number="01" title="Кваліфікація" text="16–256 команд · BO1" />
          <Stage icon={<Shield />} number="02" title="4 групи" text="По 4 команди · 24 матчі" />
          <Stage icon={<Swords />} number="03" title="Плей-оф" text="8 найкращих · BO3" />
          <Stage icon={<Crown />} number="04" title="Фінали" text="Місця 1–6 · BO5" />
        </div>
      </article>

      <article className="surface major-groups">
        <div className="major-section-head"><UsersRound /><div><small>ГРУПОВИЙ ЕТАП</small><h2>Турнірні таблиці</h2></div></div>
        <div className="group-grid">
          {Object.entries(groups).map(([name, table]) => (
            <div className="group-table" key={name}>
              <h3>Група {name}</h3>
              <div className="group-table-head"><span># Команда</span><span>І</span><span>В</span><span>РК</span><span>О</span></div>
              {table.map((team, index) => (
                <div className={index < 2 ? "group-team qualified" : "group-team"} key={team.id}>
                  <span><b>{index + 1}</b>{team.name}</span><span>{team.played}</span><span>{team.wins}</span><span>{team.mapsWon - team.mapsLost > 0 ? "+" : ""}{team.mapsWon - team.mapsLost}</span><strong>{team.points}</strong>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="table-legend"><i /> Перші дві команди кожної групи виходять у плей-оф. Тай-брейки: очки, різниця карт, виграні карти, посів.</p>
      </article>

      <article className="surface playoff-board">
        <div className="major-section-head"><Swords /><div><small>ПЛЕЙ-ОФ</small><h2>Чемпіонська сітка та класифікація</h2></div></div>
        <div className="playoff-columns">
          <MatchColumn title="Чвертьфінали" matches={playoff.filter((match) => match.key.includes("QF"))} />
          <MatchColumn title="Півфінали" matches={playoff.filter((match) => match.key.includes("SF") && match.stage === "playoff")} />
          <MatchColumn title="Фінальні матчі" matches={playoff.filter((match) => ["PO-FINAL", "PO-BRONZE", "PO-FIFTH"].includes(match.key))} />
        </div>
      </article>

      <article className="surface prize-places">
        <div className="major-section-head"><Award /><div><small>ПІДСУМКОВА КЛАСИФІКАЦІЯ</small><h2>Шість призових місць</h2></div></div>
        <div className="places-grid">
          {[1, 2, 3, 4, 5, 6].map((place) => <div className={`place-card place-${place}`} key={place}>{place <= 3 ? <Medal /> : <span>{place}</span>}<small>{place} МІСЦЕ</small><strong>Визначиться у плей-оф</strong></div>)}
        </div>
      </article>
    </div>
  );
}

function Stage({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) {
  return <div className="stage-card"><span>{icon}</span><small>{number}</small><strong>{title}</strong><p>{text}</p></div>;
}

function MatchColumn({ title, matches }: { title: string; matches: ReturnType<typeof createPlayoff> }) {
  return <div className="match-column"><h3>{title}</h3>{matches.map((match) => <div className="bracket-match" key={match.key}><small>{match.key} · BO{match.bestOf}</small><span>{match.participantOne.label}</span><span>{match.participantTwo.label}</span></div>)}</div>;
}
