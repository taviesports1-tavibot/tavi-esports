import { Coins, Gift, Sparkles, Ticket, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PromoRedeem } from "@/components/promo-redeem";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Винагороди" };

export default function RewardsPage() {
  return (
    <>
      <PageHero
        eyebrow="TaVi Rewards"
        title="Грай та отримуй винагороди"
        text="TaVi Coins, квитки Колеса Фортуни, досягнення та ексклюзивні нагороди за активність у спільноті."
      />
      <section className="content-section">
        <div className="shell rewards-layout">
          <div className="reward-card-grid">
            <RewardCard icon={<Coins />} title="TaVi Coins" text="За матчі, турніри, досягнення та спеціальні події." />
            <RewardCard icon={<Ticket />} title="Квитки" text="Спроби у Колесі Фортуни з чесним журналом результатів." />
            <RewardCard icon={<Trophy />} title="Досягнення" text="Колекційні відзнаки, що показуються у профілі." />
          </div>
          <div className="wheel-panel surface">
            <div className="wheel" aria-hidden="true">
              <span>50</span>
              <span>100</span>
              <span>×2</span>
              <span>250</span>
              <i>TaVi</i>
            </div>
            <div>
              <Sparkles size={24} />
              <h2>Колесо Фортуни</h2>
              <p>Використовуйте квиток і вигравайте TaVi Coins або спеціальні нагороди.</p>
              <Link className="button button-primary" href="/dashboard">
                Відкрити в кабінеті
              </Link>
            </div>
          </div>
          <PromoRedeem />
        </div>
      </section>
    </>
  );
}

function RewardCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="surface reward-card">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Gift size={16} />
    </article>
  );
}

