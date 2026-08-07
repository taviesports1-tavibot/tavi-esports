import {
  ArrowRight,
  BarChart3,
  CirclePlay,
  Gamepad2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { NewsCard } from "@/components/news-card";
import { RankingTable } from "@/components/ranking-table";
import { TournamentCard } from "@/components/tournament-card";
import { Eyebrow, SectionHeading } from "@/components/ui";
import { news, platformStats, players, tournaments } from "@/lib/data";

const features = [
  {
    icon: Swords,
    title: "Турніри без хаосу",
    text: "Реєстрація, підтвердження складу, сітка, результати та автоматичне просування переможців."
  },
  {
    icon: BarChart3,
    title: "Рейтинг, якому довіряють",
    text: "Очки за реальні матчі, історія змін, сезонні таблиці та окремі рейтинги команд і гравців."
  },
  {
    icon: MessageSquareText,
    title: "Команда та спільнота",
    text: "Пошук гравців, заявки до команди, друзі, приватні повідомлення та турнірні чати."
  },
  {
    icon: Trophy,
    title: "Нагороди TaVi",
    text: "Досягнення, TaVi Coins, квитки Колеса Фортуни, промокоди та прозора історія операцій."
  }
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orb orb-one" aria-hidden="true" />
        <div className="hero-orb orb-two" aria-hidden="true" />
        <div className="shell hero-layout">
          <div className="hero-copy">
            <Eyebrow live>Платформа онлайн · Сезон 2026</Eyebrow>
            <h1>
              Твоя гра.
              <br />
              Твоя команда.
              <br />
              <span>Твоя перемога.</span>
            </h1>
            <p>
              Українська MLBB-платформа для тих, хто хоче більше: чесні турніри, живий рейтинг,
              сильні команди та шлях від першого матчу до чемпіонства.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" href="/tournaments">
                Знайти турнір <ArrowRight size={18} />
              </Link>
              <Link className="button button-muted button-large" href="/register">
                Створити профіль
              </Link>
            </div>
            <div className="hero-trust">
              <span>
                <ShieldCheck size={16} /> Fair Play
              </span>
              <span>
                <UsersRound size={16} /> Українська спільнота
              </span>
            </div>
          </div>
          <div className="hero-arena" aria-label="Найближчий турнір">
            <div className="arena-hud">
              <span>UPCOMING EVENT</span>
              <span className="live-dot">LIVE SOON</span>
            </div>
            <div className="arena-core">
              <i className="ring ring-one" />
              <i className="ring ring-two" />
              <div className="hero-emblem">
                <span className="crown">▲</span>
                <strong>T</strong>
                <small>TaVi</small>
              </div>
            </div>
            <div className="arena-event">
              <div>
                <small>24 ЛИПНЯ · 19:00</small>
                <strong>SUMMER CLASH</strong>
                <span>32 КОМАНДИ · 5 000 ₴</span>
              </div>
              <Link href="/tournaments/tavi-summer-clash" aria-label="Відкрити Summer Clash">
                <CirclePlay size={27} />
              </Link>
            </div>
          </div>
        </div>
        <div className="shell stats-strip">
          {platformStats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Змагайся"
            title="Найближчі турніри"
            text="Обери формат, збери склад і доведи, що саме ваша команда варта фіналу."
            href="/tournaments"
            action="Усі турніри"
          />
          <div className="card-grid tournament-grid">
            {tournaments.map((tournament) => (
              <TournamentCard tournament={tournament} key={tournament.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="shell">
          <SectionHeading
            eyebrow="Єдина екосистема"
            title="Все для кіберспорту в одному місці"
            text="TaVi прибирає таблиці, загублені повідомлення та ручну плутанину — кожна дія має своє місце."
          />
          <div className="feature-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-number">0{index + 1}</span>
                <feature.icon size={25} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell split-section">
          <div>
            <SectionHeading
              eyebrow="Лідери сезону"
              title="Топ гравців"
              text="Рейтинг оновлюється після підтвердження результатів матчів."
            />
            <RankingTable items={players.slice(0, 5)} compact />
          </div>
          <aside className="community-panel">
            <div className="community-glow" />
            <Sparkles size={25} />
            <Eyebrow>TaVi Community</Eyebrow>
            <h2>Твій наступний тіммейт уже тут</h2>
            <p>Створи анкету, вкажи роль і прайм-тайм — система допоможе знайти команду або гравця.</p>
            <div className="community-pills">
              <span>
                <Gamepad2 size={15} /> 48 анкет
              </span>
              <span>
                <UsersRound size={15} /> 12 команд шукають гравців
              </span>
            </div>
            <Link className="button button-light" href="/players">
              Знайти команду <ArrowRight size={17} />
            </Link>
          </aside>
        </div>
      </section>

      <section className="section news-section">
        <div className="shell">
          <SectionHeading
            eyebrow="Останні оновлення"
            title="Новини TaVi"
            href="/news"
            action="Усі новини"
          />
          <div className="news-grid">
            {news.map((item, index) => (
              <NewsCard item={item} featured={index === 0} key={item.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="shell final-cta-inner">
          <div>
            <Eyebrow>RISE ABOVE</Eyebrow>
            <h2>Готовий увійти в гру?</h2>
            <p>Створи профіль, приєднуйся до команди та почни свій шлях у TaVi Esports.</p>
          </div>
          <Link className="button button-light button-large" href="/register">
            Почати зараз <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}

