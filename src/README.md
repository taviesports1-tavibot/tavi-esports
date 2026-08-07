# TaVi Esports

Нова швидка кіберспортивна платформа TaVi для турнірів Mobile Legends: Bang Bang.

## Локальний запуск

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Основні команди

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## База даних

1. Створіть PostgreSQL/Supabase базу.
2. Виконайте `database/schema.sql`.
3. Додайте `DATABASE_URL`, `AUTH_SECRET` та `NEXT_PUBLIC_APP_URL` у Vercel.
4. Створіть першого адміністратора запитом із `database/bootstrap-admin.sql`.

Сайт працює у демонстраційному режимі без бази даних, але реєстрація, вхід і всі операції запису потребують PostgreSQL.

