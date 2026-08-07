import type { Metadata } from "next";
import { NewsCard } from "@/components/news-card";
import { PageHero } from "@/components/ui";
import { news } from "@/lib/data";

export const metadata: Metadata = {
  title: "Новини",
  description: "Новини турнірів, платформи та спільноти TaVi Esports."
};

export default function NewsPage() {
  return (
    <>
      <PageHero
        eyebrow="TaVi Newsroom"
        title="Новини та оновлення"
        text="Анонси турнірів, зміни правил, результати матчів і все важливе з життя спільноти TaVi."
      />
      <section className="content-section">
        <div className="shell news-grid">
          {news.map((item, index) => (
            <NewsCard item={item} featured={index === 0} key={item.id} />
          ))}
        </div>
      </section>
    </>
  );
}

