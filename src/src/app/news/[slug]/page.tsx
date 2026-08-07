import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui";
import { formatKyivDate, news } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return news.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = news.find((entry) => entry.slug === slug);
  return { title: item?.title || "Новину не знайдено", description: item?.excerpt };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = news.find((entry) => entry.slug === slug);
  if (!item) notFound();

  return (
    <article className="article-page">
      <div className="article-shell">
        <Link className="back-link" href="/news">
          <ArrowLeft size={16} /> Усі новини
        </Link>
        <Eyebrow>{item.category}</Eyebrow>
        <h1>{item.title}</h1>
        <div className="article-meta">
          <span>{formatKyivDate(item.publishedAt, true)}</span>
          <span>{item.readTime} читання</span>
        </div>
        <div className="article-cover">
          <span>TaVi</span>
        </div>
        <div className="article-copy">
          <p className="lead">{item.excerpt}</p>
          <h2>Що змінюється</h2>
          <p>
            TaVi переходить на нову архітектуру платформи. Публічні сторінки відкриваються миттєво, а турніри,
            профілі та рейтинги мають чіткі стани навіть під час технічних робіт. Дані користувачів і матчів
            зберігаються у PostgreSQL із журналом важливих дій.
          </p>
          <p>
            Особистий кабінет об’єднує команду, матчі, друзів, повідомлення, досягнення, TaVi Coins та
            сповіщення. Адміністратори отримують окремий захищений простір для керування заявками, сітками,
            новинами й підтримкою.
          </p>
          <h2>Що далі</h2>
          <p>
            Ми будемо додавати функції поступово, не жертвуючи стабільністю. Кожне оновлення проходить
            перевірку мобільної версії, продуктивності й безпеки перед публікацією.
          </p>
        </div>
      </div>
    </article>
  );
}
