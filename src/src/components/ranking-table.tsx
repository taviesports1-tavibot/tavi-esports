import { Crown, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Player } from "@/lib/types";

export function RankingTable({ items, compact = false }: { items: Player[]; compact?: boolean }) {
  return (
    <div className="ranking-panel">
      <div className="ranking-row ranking-head">
        <span>#</span>
        <span>Гравець</span>
        <span className="hide-small">Роль</span>
        <span className="hide-small">Перемоги</span>
        <span>Рейтинг</span>
      </div>
      {items.map((player) => (
        <Link className="ranking-row" href={`/players/${player.id}`} key={player.id}>
          <span className={`rank-place rank-${player.rank}`}>
            {player.rank === 1 ? <Crown size={16} /> : player.rank}
          </span>
          <span className="player-cell">
            <i>{player.avatar}</i>
            <span>
              <strong>{player.nickname}</strong>
              <small>{player.team}</small>
            </span>
          </span>
          <span className="hide-small">{player.role}</span>
          <span className="hide-small">{player.wins}</span>
          <strong className="rating-value">
            {player.rating} <TrendingUp size={14} />
          </strong>
        </Link>
      ))}
      {compact && (
        <Link className="ranking-more" href="/rating">
          Переглянути повний рейтинг
        </Link>
      )}
    </div>
  );
}

