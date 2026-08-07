-- Safe additive migration for existing TaVi Esports databases.
-- The canonical definitions and triggers live in schema.sql; running the full
-- schema is idempotent and applies these additions without removing data.
\ir schema.sql
