import { AlertTriangle, CheckCircle2, Scale, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Правила" };

const sections = [
  {
    icon: ShieldCheck,
    title: "Реєстрація та склад",
    items: [
      "Кожен гравець використовує один підтверджений профіль TaVi.",
      "Капітан відповідає за правильність MLBB ID та контактів складу.",
      "Заміна після закриття реєстрації можлива лише з дозволу адміністратора."
    ]
  },
  {
    icon: Scale,
    title: "Матч і результат",
    items: [
      "Команди з’являються у лобі не пізніше ніж за 10 хвилин до старту.",
      "Результат надсилають обидва капітани зі скриншотом підсумкового екрана.",
      "При розбіжності результат переходить на ручну перевірку."
    ]
  },
  {
    icon: AlertTriangle,
    title: "Fair Play",
    items: [
      "Заборонені чіти, скрипти, підміна гравця та передача акаунта.",
      "Образи, погрози й дискримінація ведуть до попередження або дискваліфікації.",
      "Рішення про санкцію зберігається в журналі та може бути оскаржене."
    ]
  }
];

export default function RulesPage() {
  return (
    <>
      <PageHero
        eyebrow="Fair Play"
        title="Єдині правила для чесної гри"
        text="Прозорі вимоги до учасників, матчів, результатів та апеляцій. Реєструючись на турнір, команда погоджується з цими правилами."
      />
      <section className="content-section">
        <div className="shell rules-grid">
          {sections.map(({ icon: Icon, title, items }, index) => (
            <article className="surface rule-section" key={title}>
              <div className="rule-section-head">
                <span>
                  <Icon />
                </span>
                <div>
                  <small>0{index + 1}</small>
                  <h2>{title}</h2>
                </div>
              </div>
              <div className="rule-list">
                {items.map((item) => (
                  <span key={item}>
                    <CheckCircle2 /> {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

