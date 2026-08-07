import type { NewsItem, Player, Tournament } from "@/lib/types";

export const platformStats = [
  { label: "Гравців", value: "1 248", detail: "+86 цього місяця" },
  { label: "Команд", value: "184", detail: "37 активних" },
  { label: "Турнірів", value: "32", detail: "4 найближчі" },
  { label: "Матчів", value: "2 917", detail: "98 сьогодні" }
];

export const tournaments: Tournament[] = [
  {
    id: "t1",
    slug: "tavi-summer-clash",
    title: "TaVi Summer Clash",
    game: "Mobile Legends: Bang Bang",
    format: "5×5 · Single Elimination",
    startsAt: "2026-07-24T19:00:00+03:00",
    registrationEndsAt: "2026-07-23T23:59:00+03:00",
    prize: "5 000 ₴",
    slots: 32,
    registered: 28,
    status: "registration",
    accent: "violet"
  },
  {
    id: "t2",
    slug: "solo-arena-1x1",
    title: "Solo Arena 1×1",
    game: "Mobile Legends: Bang Bang",
    format: "1×1 · Single Elimination",
    startsAt: "2026-08-08T19:00:00+03:00",
    registrationEndsAt: "2026-08-07T20:00:00+03:00",
    prize: "1 500 TaVi Coins",
    slots: 64,
    registered: 41,
    status: "upcoming",
    accent: "cyan"
  },
  {
    id: "t3",
    slug: "night-league-5x5",
    title: "Night League 5×5",
    game: "Mobile Legends: Bang Bang",
    format: "5×5 · Double Elimination",
    startsAt: "2026-08-15T20:00:00+03:00",
    registrationEndsAt: "2026-08-14T20:00:00+03:00",
    prize: "10 000 ₴",
    slots: 16,
    registered: 9,
    status: "upcoming",
    accent: "pink"
  }
];

export const players: Player[] = [
  { id: "p1", rank: 1, nickname: "Bazuka", role: "Jungle", team: "TaVi", rating: 2648, wins: 89, avatar: "BZ" },
  { id: "p2", rank: 2, nickname: "Vinks", role: "Mid Lane", team: "TaVi", rating: 2581, wins: 84, avatar: "VK" },
  { id: "p3", rank: 3, nickname: "Oxig", role: "Gold Lane", team: "TaVi", rating: 2494, wins: 76, avatar: "OX" },
  { id: "p4", rank: 4, nickname: "ïppø", role: "EXP Lane", team: "TaVi", rating: 2412, wins: 71, avatar: "IP" },
  { id: "p5", rank: 5, nickname: "[A]kusher", role: "Roam", team: "TaVi", rating: 2389, wins: 68, avatar: "AK" },
  { id: "p6", rank: 6, nickname: "Nexor", role: "Jungle", team: "Opertum", rating: 2321, wins: 64, avatar: "NX" }
];

export const news: NewsItem[] = [
  {
    id: "n1",
    slug: "nova-era-tavi",
    title: "Нова ера TaVi Esports: платформа стає швидшою",
    excerpt: "Оновлені турніри, особистий кабінет, рейтинг, друзі, чат і система винагород в одному просторі.",
    publishedAt: "2026-07-23T12:00:00+03:00",
    category: "Платформа",
    readTime: "4 хв"
  },
  {
    id: "n2",
    slug: "summer-clash-registration",
    title: "Реєстрація на TaVi Summer Clash відкрита",
    excerpt: "32 команди, сітка Single Elimination і призовий фонд 5 000 гривень.",
    publishedAt: "2026-07-21T15:30:00+03:00",
    category: "Турніри",
    readTime: "3 хв"
  },
  {
    id: "n3",
    slug: "fair-play-rules",
    title: "Оновлені правила Fair Play",
    excerpt: "Єдині прозорі вимоги до складів, результатів матчів, доказів і апеляцій.",
    publishedAt: "2026-07-18T18:00:00+03:00",
    category: "Правила",
    readTime: "6 хв"
  }
];

export function formatKyivDate(value: string, includeYear = false) {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "long",
    ...(includeYear ? { year: "numeric" as const } : {}),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

