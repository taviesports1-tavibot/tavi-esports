import { ArrowLeft, CalendarDays, CheckCircle2, ShieldCheck, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui";
import { LargeTournamentView } from "@/components/large-tournament-view";
import { formatKyivDate, tournaments } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return tournaments.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tournament = tournaments.find((item) => item.slug === slug);
  return tournament
    ? { title: tournament.title, description: `${tournament.format}. Приз: ${tournament.prize}.` }
    : { title: "Турнір не знайдено" };
}

export default async function TournamentPage({ params }: Props) {
  const { slug } = await params;
  const tournament = tournaments.find((item) => item.slug === slug);
  if (!tournament) notFound();

  return (
    <section className="detail-page">
      <div className="shell">
        <Link className="back-link" href="/tournaments">
          <ArrowLeft size={16} /> Усі турніри
        </Link>
        <div className="tournament-detail-head">
          <div>
            <Eyebrow>Mobile Legends: Bang Bang</Eyebrow>
            <h1>{tournament.title}</h1>
            <p>{tournament.format}</p>
          </div>
          <div className="detail-prize">
            <small>ПРИЗОВИЙ ФОНД</small>
            <strong>{tournament.prize}</strong>
          </div>
        </div>
        <div className="detail-layout">
          <div className="detail-main">
            <div className="detail-metrics">
              <Metric icon={<CalendarDays />} label="Початок" value={formatKyivDate(tournament.startsAt, true)} />
              <Metric icon={<Users />} label="Учасники" value={`${tournament.registered} / ${tournament.slots}`} />
              <Metric icon={<Trophy />} label="Формат" value={tournament.format.split(" · ")[1] || tournament.format} />
            </div>
            <article className="surface detail-article">
              <Eyebrow>Про турнір</Eyebrow>
              <h2>Шлях до фіналу починається тут</h2>
              <p>
                Після підтвердження заявки команда отримує місце у сітці. Капітани надсилають результат і
                підтвердження матчу, адміністратор перевіряє спірні випадки, а переможець автоматично переходить
                у наступний раунд.
              </p>
              <div className="rule-list">
                <span>
                  <CheckCircle2 /> Повний склад із 5 основних гравців
                </span>
                <span>
                  <CheckCircle2 /> Один капітан і до 2 запасних
                </span>
                <span>
                  <CheckCircle2 /> Актуальні MLBB ID та зв’язок у Telegram
                </span>
                <span>
                  <CheckCircle2 /> Підтвердження результату скриншотом
                </span>
              </div>
            </article>
            {tournament.largeFormat && <LargeTournamentView />}
          </div>
          <aside className="surface registration-panel">
            <span className="status status-registration">
              <i /> Реєстрація відкрита
            </span>
            <h2>Зареєструвати команду</h2>
            <p>Капітан створює заявку, додає склад і підтверджує контакти гравців.</p>
            <div className="registration-progress">
              <div>
                <span>Зайнято місць</span>
                <strong>
                  {tournament.registered}/{tournament.slots}
                </strong>
              </div>
              <i>
                <b style={{ width: `${(tournament.registered / tournament.slots) * 100}%` }} />
              </i>
            </div>
            <Link className="button button-primary button-large" href={`/register-team?tournament=${tournament.id}`}>
              Подати заявку
            </Link>
            <Link className="button button-ghost" href="/rules">
              <ShieldCheck size={16} /> Переглянути правила
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric-card">
      {icon}
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}
