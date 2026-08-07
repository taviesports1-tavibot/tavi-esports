import { Plus, ShieldCheck, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Реєстрація команди" };

export default function RegisterTeamPage() {
  return (
    <>
      <PageHero
        eyebrow="Team Registration"
        title="Зареєструйте команду"
        text="Створіть команду один раз, запросіть гравців і використовуйте підтверджений склад у всіх турнірах TaVi."
      />
      <section className="content-section">
        <div className="shell team-form-layout">
          <form className="surface team-form">
            <div className="form-title">
              <UsersRound />
              <div>
                <h2>Основні дані</h2>
                <p>Капітан зможе змінити склад у кабінеті.</p>
              </div>
            </div>
            <div className="form-row">
              <label>
                <span>Назва команди</span>
                <input placeholder="TaVi Academy" />
              </label>
              <label>
                <span>Короткий тег</span>
                <input maxLength={6} placeholder="TAVI" />
              </label>
            </div>
            <label>
              <span>Telegram капітана</span>
              <input placeholder="@username" />
            </label>
            <div className="roster-list">
              {[1, 2, 3, 4, 5].map((slot) => (
                <div key={slot}>
                  <strong>Гравець {slot}</strong>
                  <input aria-label={`Нікнейм гравця ${slot}`} placeholder="Нікнейм" />
                  <input aria-label={`MLBB ID гравця ${slot}`} placeholder="MLBB ID" />
                  <select aria-label={`Роль гравця ${slot}`} defaultValue="">
                    <option value="" disabled>
                      Роль
                    </option>
                    <option>Jungle</option>
                    <option>Mid Lane</option>
                    <option>Gold Lane</option>
                    <option>EXP Lane</option>
                    <option>Roam</option>
                  </select>
                </div>
              ))}
            </div>
            <button className="button button-ghost" type="button">
              <Plus size={16} /> Додати запасного
            </button>
            <button className="button button-primary button-large" type="button">
              Надіслати склад на підтвердження
            </button>
          </form>
          <aside className="surface team-form-note">
            <ShieldCheck />
            <h2>Перед відправленням</h2>
            <p>Перевірте MLBB ID, ролі та Telegram капітана. Запрошення до складу має підтвердити кожен гравець.</p>
            <ul>
              <li>5 основних гравців</li>
              <li>До 2 запасних</li>
              <li>Один підтверджений капітан</li>
              <li>Унікальна назва та тег</li>
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}

