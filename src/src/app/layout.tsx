import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tavi-esports.com"),
  title: {
    default: "TaVi Esports — українська кіберспортивна платформа",
    template: "%s — TaVi Esports"
  },
  description:
    "Турніри Mobile Legends: Bang Bang, рейтинги гравців і команд, матчі, трансляції та кіберспортивна спільнота TaVi.",
  applicationName: "TaVi Esports",
  keywords: ["TaVi", "esports", "MLBB", "Mobile Legends", "турніри", "кіберспорт", "Україна"],
  openGraph: {
    title: "TaVi Esports",
    description: "Грай. Перемагай. Підіймайся вище.",
    type: "website",
    locale: "uk_UA",
    siteName: "TaVi Esports"
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  themeColor: "#08080d",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>
        <a className="skip-link" href="#main">
          Перейти до вмісту
        </a>
        <div className="app-frame">
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

