import {
  Award,
  BarChart3,
  Bell,
  Coins,
  Gamepad2,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Shield,
  Swords,
  Trophy,
  UserRound,
  UsersRound
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { Eyebrow } from "@/components/ui";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Особистий кабінет" };

const menu = [
  ["Огляд", "/dashboard", LayoutDashboard],
  ["Мій профіль", "/dashboard/profile", UserRound],
  ["Команда", "/dashboard/team", UsersRound],
  ["Турніри", "/dashboard/tournaments", Trophy],
  ["Матчі", "/dashboard/matches", Swords],
  ["Повідомлення", "/chat", MessageSquareText],
  ["Друзі", "/dashboard/friends", UserRound],
  ["Досягнення", "/dashboard/achievements", Award],
  ["Фінанси", "/dashboard/wallet", Coins],
  ["Налаштування", "/dashboard/settings", Settings]
] as const;

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className="auth-required">
        <div className="auth-required-card">
          <Shield size={34} />
          <Eyebrow>Захищений розділ</Eyebrow>
          <h1>Увійдіть до особистого кабінету</h1>
          <p>Ваші команди, матчі, друзі, повідомлення та TaVi Coins доступні після авторизації.</p>
          <div>
            <Link className="button button-primary button-large" href="/login">
              Увійти
            </Link>
            <Link className="button button-ghost button-large" href="/register">
              Створити профіль
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="shell dashboard-layout">
        <aside className="dashboard-sidebar surface">
          <div className="dashboard-user">
            <span>{session.nickname.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{session.nickname}</strong>
              <small>TaVi ID · {session.id.slice(0, 8)}</small>
            </div>
          </div>
          <nav>
            {menu.map(([label, href, Icon], index) => (
              <Link className={index === 0 ? "dashboard-link active" : "dashboard-link"} href={href} key={href}>
                <Icon size={17} /> {label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </aside>
        <div className="dashboard-main">
          <div className="dashboard-head">
            <div>
              <Eyebrow>Кабінет гравця</Eyebrow>
              <h1>Вітаємо, {session.nickname}</h1>
              <p>Ось що відбувається у вашому профілі сьогодні.</p>
            </div>
            <button className="icon-button" aria-label="Сповіщення" type="button">
              <Bell size={18} />
            </button>
          </div>
          <div className="dashboard-stat-grid">
            <DashboardStat icon={<Gamepad2 />} label="Матчі" value="48" change="+6 цього місяця" />
            <DashboardStat icon={<Trophy />} label="Перемоги" value="34" change="70.8% winrate" />
            <DashboardStat icon={<Award />} label="MVP" value="22" change="Топ 8% сезону" />
            <DashboardStat icon={<BarChart3 />} label="KDA" value="12/3/8" change="+4.2% до рейтингу" />
          </div>
          <div className="dashboard-columns">
            <article className="surface next-match-card">
              <Eyebrow>Наступний турнір</Eyebrow>
              <div className="match-emblem">T</div>
              <h2>TaVi Summer Clash</h2>
              <p>24 липня · 19:00 · 5×5 Single Elimination</p>
              <Link className="button button-primary" href="/tournaments/tavi-summer-clash">
                Відкрити турнір
              </Link>
            </article>
            <article className="surface wallet-card">
              <Coins size={26} />
              <small>БАЛАНС</small>
              <strong>0</strong>
              <span>TaVi Coins</span>
              <Link href="/rewards">Винагороди та промокоди →</Link>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardStat({
  icon,
  label,
  value,
  change
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="surface dashboard-stat">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <p>{change}</p>
    </div>
  );
}

