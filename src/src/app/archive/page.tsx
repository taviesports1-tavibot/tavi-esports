import { CalendarCheck, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Архів турнірів" };

export default function ArchivePage() {
  return (
    <>
      <PageHero
        eyebrow="History"
        title="Архів TaVi"
        text="Завершені турніри, фінальні сітки, переможці та підтверджені результати матчів."
      />
      <section className="content-section">
        <div className="shell archive-grid">
          <article className="surface archive-card">
            <span>
              <Trophy />
            </span>
            <div>
              <small>СЕЗОН 2026</small>
              <h2>TaVi Spring Open</h2>
              <p>5×5 · 16 команд · Single Elimination</p>
            </div>
            <strong>TaVi</strong>
            <em>
              <CalendarCheck size={15} /> Завершено
            </em>
          </article>
          <article className="surface archive-card">
            <span>
              <Trophy />
            </span>
            <div>
              <small>СЕЗОН 2026</small>
              <h2>Solo Masters 1×1</h2>
              <p>1×1 · 32 гравці · Single Elimination</p>
            </div>
            <strong>Vinks</strong>
            <em>
              <CalendarCheck size={15} /> Завершено
            </em>
          </article>
        </div>
      </section>
    </>
  );
}

