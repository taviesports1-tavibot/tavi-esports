import { ArrowUpRight, Clock3 } from "lucide-react";
import Link from "next/link";
import { formatKyivDate } from "@/lib/data";
import type { NewsItem } from "@/lib/types";

export function NewsCard({ item, featured = false }: { item: NewsItem; featured?: boolean }) {
  return (
    <article className={featured ? "news-card featured" : "news-card"}>
      <div className="news-art" aria-hidden="true">
        <span>TaVi</span>
        <i />
      </div>
      <div className="news-body">
        <div className="news-meta">
          <span>{item.category}</span>
          <span>
            <Clock3 size={14} /> {item.readTime}
          </span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
        <div className="news-bottom">
          <time>{formatKyivDate(item.publishedAt, true)}</time>
          <Link href={`/news/${item.slug}`} aria-label={`Читати: ${item.title}`}>
            <ArrowUpRight size={19} />
          </Link>
        </div>
      </div>
    </article>
  );
}

