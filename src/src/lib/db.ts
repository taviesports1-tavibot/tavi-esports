import postgres, { type Sql } from "postgres";

let client: Sql | null = null;
let rosterSchemaPromise: Promise<void> | null = null;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!client) {
    client = postgres(process.env.DATABASE_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      ssl: "require"
    });
  }

  return client;
}

export function ensureTeamRosterSchema() {
  if (!rosterSchemaPromise) {
    rosterSchemaPromise = db().unsafe(`
      CREATE TABLE IF NOT EXISTS team_roster_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        nickname citext NOT NULL,
        mlbb_id text NOT NULL,
        mlbb_server text NOT NULL,
        game_role text NOT NULL CHECK (game_role IN ('Jungle', 'Mid Lane', 'Gold Lane', 'EXP Lane', 'Roam', 'Substitute')),
        roster_role text NOT NULL DEFAULT 'starter' CHECK (roster_role IN ('starter', 'substitute')),
        sort_order smallint NOT NULL CHECK (sort_order BETWEEN 1 AND 7),
        created_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (team_id, mlbb_id, mlbb_server),
        UNIQUE (team_id, sort_order)
      )
    `).then(() => undefined).catch((error) => {
      rosterSchemaPromise = null;
      throw error;
    });
  }
  return rosterSchemaPromise;
}
