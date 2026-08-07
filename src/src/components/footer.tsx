import { Send } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

const platform = [
  ["Турніри", "/tournaments"],
  ["Рейтинг", "/rating"],
  ["Гравці", "/players"],
  ["Винагороди", "/rewards"]
];

const info = [
  ["Правила", "/rules"],
  ["Підтримка", "/support"],
  ["Спонсорам", "/sponsors"],
  ["Архів", "/archive"]
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>Українська кіберспортивна платформа, де гравці стають командами, а команди — чемпіонами.</p>
          <a className="telegram-link" href="https://t.me/taviesports" target="_blank" rel="noreferrer">
            <Send size={16} /> Telegram TaVi
          </a>
        </div>
        <FooterColumn title="Платформа" links={platform} />
        <FooterColumn title="Інформація" links={info} />
        <div>
          <p className="footer-heading">Адміністратори</p>
          <div className="admin-links">
            <a href="https://t.me/bazuka_ml" target="_blank" rel="noreferrer">
              @bazuka_ml <span>головний адміністратор</span>
            </a>
            <a href="https://t.me/vinks_03" target="_blank" rel="noreferrer">
              @vinks_03 <span>турнірний адміністратор</span>
            </a>
          </div>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 TaVi Esports. Всі права захищені.</span>
        <span className="system-status">
          <i /> PLATFORM v2.0
        </span>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <p className="footer-heading">{title}</p>
      <div className="footer-links">
        {links.map(([label, href]) => (
          <Link href={href} key={href}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

