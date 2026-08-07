import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function Eyebrow({ children, live = false }: { children: ReactNode; live?: boolean }) {
  return (
    <span className={live ? "eyebrow live" : "eyebrow"}>
      {live && <i />}
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  href,
  action
}: {
  eyebrow: string;
  title: string;
  text?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {href && action && (
        <Link className="text-link" href={href}>
          {action} <ArrowUpRight size={17} />
        </Link>
      )}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  text,
  children
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="shell">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p>{text}</p>
        {children}
      </div>
    </section>
  );
}

export function EmptyState({
  title,
  text,
  action,
  href
}: {
  title: string;
  text: string;
  action: string;
  href: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-mark">T</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <Link className="button button-primary" href={href}>
        {action}
      </Link>
    </div>
  );
}

