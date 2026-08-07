"use client";

import { Menu, Moon, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";

const links = [
  { href: "/", label: "Головна" },
  { href: "/tournaments", label: "Турніри" },
  { href: "/rating", label: "Рейтинг" },
  { href: "/players", label: "Гравці" },
  { href: "/news", label: "Новини" },
  { href: "/streams", label: "Трансляції" }
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Logo />
        <nav className={open ? "primary-nav is-open" : "primary-nav"} aria-label="Головна навігація">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                className={active ? "nav-link active" : "nav-link"}
                href={link.href}
                key={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="mobile-auth">
            <Link className="button button-ghost" href="/login">
              Увійти
            </Link>
            <Link className="button button-primary" href="/register">
              Створити профіль
            </Link>
          </div>
        </nav>
        <div className="header-actions">
          <button className="icon-button theme-button" type="button" aria-label="Темна тема активна">
            <Moon size={17} />
          </button>
          <Link className="button button-ghost desktop-only" href="/login">
            Увійти
          </Link>
          <Link className="button button-primary desktop-only" href="/register">
            Реєстрація
          </Link>
          <button
            className="icon-button menu-button"
            type="button"
            aria-expanded={open}
            aria-label={open ? "Закрити меню" : "Відкрити меню"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
