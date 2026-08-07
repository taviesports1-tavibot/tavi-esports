import { Clock3, Gamepad2, Search, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";
import { players } from "@/lib/data";

export const metadata: Metadata = {
  title: "Гравці та пошук команди",
  description: "Знайдіть гравця, команду або створіть анкету для пошуку складу."
};

export default function PlayersPage() {
  return (
    <>
      <PageHero
        eyebrow="Team Finder"
        title="Знайди команду. Збери склад."
        text="Фільтруй гравців за роллю, рейтингом і часом гри. Відкриті анкети допомагають одразу знайти тих, хто підходить вашій команді."
      >
        <div className="page-actions">
          <Link className="button button-primary" href="/dashboard/team-search">
            Створити анкету
          </Link>
          <Link className="button button-ghost" href="/teams">
            Переглянути команди
          </Link>
        </div>
      </PageHero>
      <section className="content-section">
        <div className="shell">
          <div className="search-bar surface">
            <Search size={18} />
            <input aria-label="Пошук гравця" placeholder="Нікнейм, команда або роль…" />
            <button className="button button-primary" type="button">
              Знайти
            </button>
          </div>
          <div className="player-card-grid">
            {players.map((player, index) => (
              <article className="surface player-card" key={player.id}>
                <div className="player-card-top">
                  <span className="big-avatar">{player.avatar}</span>
                  <span className={index < 4 ? "availability online" : "availability"}>
                    <i /> {index < 4 ? "Шукає команду" : "У складі"}
                  </span>
                </div>
                <h2>{player.nickname}</h2>
                <p>{player.team}</p>
                <div className="player-tags">
                  <span>
                    <Gamepad2 size={14} /> {player.role}
                  </span>
                  <span>
                    <Clock3 size={14} /> 19:00–23:00
                  </span>
                </div>
                <div className="player-card-stats">
                  <span>
                    <small>Рейтинг</small>
                    <strong>{player.rating}</strong>
                  </span>
                  <span>
                    <small>Перемоги</small>
                    <strong>{player.wins}</strong>
                  </span>
                </div>
                <Link className="button button-ghost" href={`/players/${player.id}`}>
                  <UsersRound size={15} /> Відкрити профіль
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

