import { ArrowRight, CalendarDays, Shield, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { formatKyivDate } from "@/lib/data";
import type { Tournament } from "@/lib/types";

const statuses = {
  registration: "Реєстрація",
  upcoming: "Незабаром",
  live: "Наживо",
  completed: "Завершено"
};

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const percent = Math.round((tournament.registered / tournament.slots) * 100);

  return (
    <article className={`tournament-card accent-${tournament.accent}`}>
      <div className="card-topline">
        <span className={`status status-${tournament.status}`}>
          <i /> {statuses[tournament.status]}
        </span>
        <span className="game-label">MLBB</span>
      </div>
      <div className="tournament-emblem" aria-hidden="true">
        <Shield />
        <span>T</span>
      </div>
      <h3>{tournament.title}</h3>
      <p className="muted">{tournament.format}</p>
      <div className="tournament-meta">
        <span>
          <CalendarDays size={16} /> {formatKyivDate(tournament.startsAt)}
        </span>
        <span>
          <Trophy size={16} /> {tournament.prize}
        </span>
      </div>
      <div className="slots">
        <div>
          <span>
            <Users size={15} /> Учасники
          </span>
          <strong>
            {tournament.registered}/{tournament.slots}
          </strong>
        </div>
        <div className="progress">
          <i style={{ width: `${percent}%` }} />
        </div>
      </div>
      <Link className="card-link" href={`/tournaments/${tournament.slug}`}>
        Деталі турніру <ArrowRight size={17} />
      </Link>
    </article>
  );
}

