import { ArrowLeft, Award, Gamepad2, Swords, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui";
import { players } from "@/lib/data";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return players.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const player = players.find((item) => item.id === id);
  return { title: player ? `Гравець ${player.nickname}` : "Гравця не знайдено" };
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params;
  const player = players.find((item) => item.id === id);
  if (!player) notFound();

  return (
    <section className="detail-page">
      <div className="shell">
        <Link className="back-link" href="/players">
          <ArrowLeft size={16} /> Усі гравці
        </Link>
        <div className="profile-hero surface">
          <span className="profile-avatar">{player.avatar}</span>
          <div>
            <Eyebrow>TaVi ID #{player.id.toUpperCase()}2026</Eyebrow>
            <h1>{player.nickname}</h1>
            <p>
              {player.team} · {player.role}
            </p>
          </div>
          <button className="button button-primary" type="button">
            Додати в друзі
          </button>
        </div>
        <div className="profile-stat-grid">
          <ProfileStat icon={<Trophy />} label="Рейтинг" value={String(player.rating)} />
          <ProfileStat icon={<Swords />} label="Перемоги" value={String(player.wins)} />
          <ProfileStat icon={<Gamepad2 />} label="Основна роль" value={player.role} />
          <ProfileStat icon={<Award />} label="Досягнення" value="12" />
        </div>
        <div className="surface profile-about">
          <Eyebrow>Профіль гравця</Eyebrow>
          <h2>Статистика та історія матчів</h2>
          <p>
            Тут з’являються підтверджені турнірні матчі, сезонна статистика, досягнення, склад команди й
            відкриті анкети пошуку. Приватні дані та контакти бачать лише авторизовані користувачі.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfileStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="surface profile-stat">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
