import { Shield, Trophy, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Команди" };

const teams = [
  { name: "TaVi", tag: "TAVI", rating: 2810, members: 7, wins: 92 },
  { name: "Opertum Academy II", tag: "OP2", rating: 2470, members: 6, wins: 74 },
  { name: "Night Ravens", tag: "NRV", rating: 2318, members: 7, wins: 61 }
];

export default function TeamsPage() {
  return (
    <>
      <PageHero
        eyebrow="Teams"
        title="Команди TaVi"
        text="Підтверджені склади, сезонний рейтинг, історія турнірів та відкриті позиції."
      >
        <div className="page-actions">
          <Link className="button button-primary" href="/register-team">
            Створити команду
          </Link>
        </div>
      </PageHero>
      <section className="content-section">
        <div className="shell team-card-grid">
          {teams.map((team, index) => (
            <article className="surface team-card" key={team.tag}>
              <span className="team-logo">
                <Shield />
                <b>{team.tag.slice(0, 1)}</b>
              </span>
              <small>#{index + 1} У РЕЙТИНГУ</small>
              <h2>{team.name}</h2>
              <p>{team.tag}</p>
              <div>
                <span>
                  <Trophy size={15} /> {team.wins} перемог
                </span>
                <span>
                  <UsersRound size={15} /> {team.members} гравців
                </span>
              </div>
              <strong>{team.rating} RP</strong>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

