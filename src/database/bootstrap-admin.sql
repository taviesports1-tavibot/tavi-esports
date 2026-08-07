-- Після реєстрації замініть email і виконайте цей запит один раз.
UPDATE users
SET role = 'super_admin'
WHERE email = 'admin@example.com';

