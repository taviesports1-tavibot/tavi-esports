export type TournamentStatus = "registration" | "upcoming" | "live" | "completed";

export type Tournament = {
  id: string;
  slug: string;
  title: string;
  game: string;
  format: string;
  startsAt: string;
  registrationEndsAt: string;
  prize: string;
  slots: number;
  registered: number;
  status: TournamentStatus;
  accent: "violet" | "cyan" | "pink";
};

export type Player = {
  id: string;
  rank: number;
  nickname: string;
  role: string;
  team: string;
  rating: number;
  wins: number;
  avatar: string;
};

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: string;
  readTime: string;
};

