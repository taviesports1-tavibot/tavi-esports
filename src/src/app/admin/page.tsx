import {
  Activity,
  BarChart3,
  Coins,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Settings,
  ShieldCheck,
  Swords,
  UsersRound
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPromoForm } from "@/components/admin-promo-form";
import { Eyebrow } from "@/components/ui";
import { getSession, isAdmin } from "@/lib/auth";
import { db, hasDatabase } from "@/lib/db";

export const metadata: Metadata = { title: "Адмін-панель" };

const adminMenu = [
  ["Огляд", LayoutDashboard],
  ["Турніри", Swords],
  ["Користувачі", UsersRound],
  ["Новини", FileText],
  ["Трансляції", Megaphone],
  ["Промокоди", Coins],
  ["Підтримка", LifeBuoy],
  ["Аналітика", BarChart3],
  ["Налаштування", Settings]
] as const;

export default async function AdminPage() {
  const user = await getSession();
  if (!isAdmin(user)) {
    return (
      <section className="auth-required">
        <div className="auth-required-card">
          <ShieldCheck size={34} />
          <Eyebrow>Admin Security</Eyebrow>
          <h1>Доступ лише для адміністраторів</h1>
          <p>Увійдіть через профіль із роллю admin або super_admin.</p>
          <Link className="button button-primary button-large" href="/login">
            Увійти
          </Link>
        </div>
      </section>
    );
  }
  const managedTournaments = hasDatabase()
    ? await db()`SELECT id, title, status FROM tournaments WHERE team_size = 5 ORDER BY starts_at DESC LIMIT 8`
    : [{ id: "t4", title: "TaVi Major 5×5", status: "demo" }];

  return (
    <section className="admin-page">
      <aside className="admin-sidebar">
        <strong>TaVi <span>/ ADMIN</span></strong>
        <nav>
          {adminMenu.map(([label, Icon], index) => (
            <button className={index === 0 ? "active" : ""} key={label} type="button">
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>
        <Link href="/">← На сайт</Link>
      </aside>
      <div className="admin-main">
        <div className="admin-head">
          <div>
            <Eyebrow>Control Center</Eyebrow>
            <h1>Панель керування</h1>
            <p>Вітаємо, {user!.nickname}. Всі важливі зміни записуються в audit log.</p>
          </div>
          <span className="admin-online">
            <i /> SYSTEM ONLINE
          </span>
        </div>
        <div className="admin-stat-grid">
          <AdminStat icon={<UsersRound />} label="Гравці" value="1 248" trend="+86" />
          <AdminStat icon={<Swords />} label="Активні турніри" value="3" trend="+1" />
          <AdminStat icon={<LifeBuoy />} label="Нові звернення" value="7" trend="2 термінові" />
          <AdminStat icon={<Activity />} label="Матчі сьогодні" value="98" trend="Live" />
        </div>
        <div className="admin-columns">
          <AdminPromoForm />
          <article className="surface admin-activity">
            <div className="admin-card-head">
              <div>
                <small>AUDIT LOG</small>
                <h2>Останні дії</h2>
              </div>
              <Activity />
            </div>
            <ul>
              <li>
                <i /> Турнірну заявку схвалено <span>2 хв тому</span>
              </li>
              <li>
                <i /> Результат матчу підтверджено <span>8 хв тому</span>
              </li>
              <li>
                <i /> Нове звернення підтримки <span>12 хв тому</span>
              </li>
            </ul>
          </article>
        </div>
        <article className="surface admin-tournament-links">
          <div className="admin-card-head"><div><small>TOURNAMENT CONTROL</small><h2>Великі турніри 5×5</h2></div><Swords /></div>
          {managedTournaments.map((tournament) => <Link href={`/admin/tournaments/${tournament.id}`} key={String(tournament.id)}><span>{String(tournament.title)}</span><small>{String(tournament.status)}</small>→</Link>)}
        </article>
      </div>
    </section>
  );
}

function AdminStat({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <div className="surface admin-stat">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <em>{trend}</em>
    </div>
  );
}
