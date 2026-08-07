BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tournament_status AS ENUM ('draft', 'registration', 'upcoming', 'live', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE match_status AS ENUM ('pending', 'ready', 'live', 'reported', 'disputed', 'completed', 'bye', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE team_member_role AS ENUM ('captain', 'player', 'substitute', 'coach');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE promo_reward_type AS ENUM ('coins', 'wheel_tickets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('new', 'in_progress', 'waiting_user', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  nickname citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'active',
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_url text,
  country_code char(2) NOT NULL DEFAULT 'UA',
  timezone text NOT NULL DEFAULT 'Europe/Kyiv',
  locale text NOT NULL DEFAULT 'uk',
  mlbb_id text,
  discord text,
  telegram text,
  primary_role text,
  bio text,
  level integer NOT NULL DEFAULT 1 CHECK (level > 0),
  experience integer NOT NULL DEFAULT 0 CHECK (experience >= 0),
  profile_visibility text NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'members', 'private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_wallets (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  coins bigint NOT NULL DEFAULT 0 CHECK (coins >= 0),
  wheel_tickets integer NOT NULL DEFAULT 0 CHECK (wheel_tickets >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE,
  tag citext NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  logo_url text,
  captain_id uuid NOT NULL REFERENCES users(id),
  description text,
  rating integer NOT NULL DEFAULT 1000,
  verified boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role team_member_role NOT NULL DEFAULT 'player',
  game_role text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'left', 'removed')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  game text NOT NULL DEFAULT 'Mobile Legends: Bang Bang',
  description text,
  format text NOT NULL,
  bracket_type text NOT NULL DEFAULT 'single_elimination'
    CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin', 'groups_playoff')),
  team_size integer NOT NULL DEFAULT 5 CHECK (team_size BETWEEN 1 AND 10),
  slots integer NOT NULL CHECK (slots > 1),
  prize_label text NOT NULL DEFAULT '—',
  rules_markdown text,
  registration_starts_at timestamptz,
  registration_ends_at timestamptz NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status tournament_status NOT NULL DEFAULT 'draft',
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  stream_url text,
  qualification_target integer NOT NULL DEFAULT 16 CHECK (qualification_target = 16),
  group_count integer NOT NULL DEFAULT 4 CHECK (group_count = 4),
  group_size integer NOT NULL DEFAULT 4 CHECK (group_size = 4),
  playoff_slots integer NOT NULL DEFAULT 8 CHECK (playoff_slots = 8),
  prize_places integer NOT NULL DEFAULT 6 CHECK (prize_places = 6),
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (registration_ends_at <= starts_at)
);

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS qualification_target integer NOT NULL DEFAULT 16;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS group_count integer NOT NULL DEFAULT 4;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS group_size integer NOT NULL DEFAULT 4;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS playoff_slots integer NOT NULL DEFAULT 8;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prize_places integer NOT NULL DEFAULT 6;

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  player_id uuid REFERENCES users(id) ON DELETE CASCADE,
  captain_id uuid NOT NULL REFERENCES users(id),
  roster_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  status registration_status NOT NULL DEFAULT 'pending',
  admin_note text,
  seed integer,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((team_id IS NOT NULL) <> (player_id IS NOT NULL)),
  UNIQUE NULLS NOT DISTINCT (tournament_id, team_id, player_id)
);

CREATE TABLE IF NOT EXISTS brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  bracket_stage text NOT NULL DEFAULT 'winners',
  published boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, name)
);

CREATE TABLE IF NOT EXISTS tournament_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  stage_type text NOT NULL CHECK (stage_type IN ('qualification', 'groups', 'playoff', 'placement')),
  name text NOT NULL,
  stage_order integer NOT NULL CHECK (stage_order > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'live', 'completed')),
  best_of integer NOT NULL DEFAULT 1 CHECK (best_of IN (1, 3, 5)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, stage_type)
);

CREATE TABLE IF NOT EXISTS tournament_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES tournament_stages(id) ON DELETE CASCADE,
  name text NOT NULL,
  group_order integer NOT NULL CHECK (group_order > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, name)
);

CREATE TABLE IF NOT EXISTS tournament_group_members (
  group_id uuid NOT NULL REFERENCES tournament_groups(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  group_seed integer NOT NULL CHECK (group_seed BETWEEN 1 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, registration_id),
  UNIQUE (group_id, group_seed)
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  bracket_id uuid REFERENCES brackets(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES tournament_stages(id) ON DELETE CASCADE,
  group_id uuid REFERENCES tournament_groups(id) ON DELETE CASCADE,
  match_code text,
  round_number integer NOT NULL CHECK (round_number > 0),
  match_number integer NOT NULL CHECK (match_number > 0),
  best_of integer NOT NULL DEFAULT 3 CHECK (best_of IN (1, 3, 5, 7)),
  participant_one_registration_id uuid REFERENCES tournament_registrations(id),
  participant_two_registration_id uuid REFERENCES tournament_registrations(id),
  participant_one_score integer NOT NULL DEFAULT 0 CHECK (participant_one_score >= 0),
  participant_two_score integer NOT NULL DEFAULT 0 CHECK (participant_two_score >= 0),
  winner_registration_id uuid REFERENCES tournament_registrations(id),
  status match_status NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  next_match_id uuid REFERENCES matches(id),
  next_match_slot smallint CHECK (next_match_slot IN (1, 2)),
  loser_next_match_id uuid REFERENCES matches(id),
  loser_next_match_slot smallint CHECK (loser_next_match_slot IN (1, 2)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bracket_id, round_number, match_number)
);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS stage_id uuid REFERENCES tournament_stages(id) ON DELETE CASCADE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES tournament_groups(id) ON DELETE CASCADE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_code text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS loser_next_match_id uuid REFERENCES matches(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS loser_next_match_slot smallint;

CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_tournament_code
  ON matches(tournament_id, match_code) WHERE match_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS tournament_stage_advancements (
  stage_id uuid NOT NULL REFERENCES tournament_stages(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  advancement_order integer NOT NULL CHECK (advancement_order > 0),
  source_match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (stage_id, registration_id),
  UNIQUE (stage_id, advancement_order)
);

CREATE TABLE IF NOT EXISTS tournament_placements (
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  place integer NOT NULL CHECK (place BETWEEN 1 AND 6),
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  source_match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, place),
  UNIQUE (tournament_id, registration_id)
);

CREATE TABLE IF NOT EXISTS match_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES users(id),
  participant_one_score integer NOT NULL CHECK (participant_one_score >= 0),
  participant_two_score integer NOT NULL CHECK (participant_two_score >= 0),
  evidence_urls text[] NOT NULL DEFAULT '{}',
  comment text,
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, reporter_id)
);

CREATE TABLE IF NOT EXISTS rating_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  season text NOT NULL,
  points_delta integer NOT NULL,
  rating_after integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((user_id IS NOT NULL) <> (team_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL,
  content_markdown text NOT NULL,
  cover_url text,
  category text NOT NULL DEFAULT 'Платформа',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id uuid REFERENCES users(id),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  title text NOT NULL,
  provider text NOT NULL DEFAULT 'youtube',
  url text NOT NULL,
  scheduled_at timestamptz,
  live boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS friendships (
  requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type text NOT NULL CHECK (room_type IN ('direct', 'team', 'tournament', 'support')),
  name text,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_room_members (
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_until timestamptz,
  last_read_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  reply_to_id bigint REFERENCES messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status ticket_status NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body text NOT NULL,
  internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code citext NOT NULL UNIQUE,
  reward_type promo_reward_type NOT NULL,
  reward_amount integer NOT NULL CHECK (reward_amount > 0),
  max_uses integer NOT NULL CHECK (max_uses > 0),
  uses_count integer NOT NULL DEFAULT 0 CHECK (uses_count >= 0 AND uses_count <= max_uses),
  max_uses_per_user integer NOT NULL DEFAULT 1 CHECK (max_uses_per_user > 0),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > starts_at)
);

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type promo_reward_type NOT NULL,
  reward_amount integer NOT NULL CHECK (reward_amount > 0),
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency text NOT NULL CHECK (currency IN ('coins', 'wheel_tickets')),
  amount integer NOT NULL CHECK (amount <> 0),
  balance_after bigint NOT NULL CHECK (balance_after >= 0),
  transaction_type text NOT NULL,
  reference_type text,
  reference_id uuid,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wheel_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type text NOT NULL,
  reward_amount integer NOT NULL CHECK (reward_amount >= 0),
  random_value numeric(12, 10) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status_starts ON tournaments(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_status ON tournament_registrations(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_round ON matches(tournament_id, round_number, match_number);
CREATE INDEX IF NOT EXISTS idx_matches_stage_status ON matches(stage_id, status, round_number, match_number);
CREATE INDEX IF NOT EXISTS idx_group_members_registration ON tournament_group_members(registration_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rating_user_season ON rating_events(user_id, season, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_redemptions(user_id, promo_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id, created_at DESC);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS profiles_set_updated_at ON user_profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS teams_set_updated_at ON teams;
CREATE TRIGGER teams_set_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS tournaments_set_updated_at ON tournaments;
CREATE TRIGGER tournaments_set_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS registrations_set_updated_at ON tournament_registrations;
CREATE TRIGGER registrations_set_updated_at BEFORE UPDATE ON tournament_registrations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS matches_set_updated_at ON matches;
CREATE TRIGGER matches_set_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS promo_codes_set_updated_at ON promo_codes;
CREATE TRIGGER promo_codes_set_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION redeem_promo(p_user_id uuid, p_code text)
RETURNS TABLE (
  promo_id uuid,
  reward_type promo_reward_type,
  reward_amount integer,
  coins_balance bigint,
  wheel_tickets_balance integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_user_uses integer;
BEGIN
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'PROMO_NOT_FOUND'; END IF;
  IF NOT v_promo.active THEN RAISE EXCEPTION 'PROMO_INACTIVE'; END IF;
  IF now() < v_promo.starts_at THEN RAISE EXCEPTION 'PROMO_NOT_STARTED'; END IF;
  IF now() >= v_promo.expires_at THEN RAISE EXCEPTION 'PROMO_EXPIRED'; END IF;
  IF v_promo.uses_count >= v_promo.max_uses THEN RAISE EXCEPTION 'PROMO_LIMIT_REACHED'; END IF;

  SELECT count(*)::integer INTO v_user_uses
  FROM promo_redemptions
  WHERE promo_redemptions.promo_id = v_promo.id
    AND promo_redemptions.user_id = p_user_id;

  IF v_user_uses >= v_promo.max_uses_per_user THEN
    RAISE EXCEPTION 'PROMO_USER_LIMIT_REACHED';
  END IF;

  INSERT INTO user_wallets (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF v_promo.reward_type = 'coins' THEN
    UPDATE user_wallets
    SET coins = coins + v_promo.reward_amount, updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_wallets
    SET wheel_tickets = wheel_tickets + v_promo.reward_amount, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = v_promo.id;

  INSERT INTO promo_redemptions (promo_id, user_id, reward_type, reward_amount)
  VALUES (v_promo.id, p_user_id, v_promo.reward_type, v_promo.reward_amount);

  INSERT INTO wallet_transactions (
    user_id, currency, amount, balance_after, transaction_type,
    reference_type, reference_id, description
  )
  SELECT
    p_user_id,
    v_promo.reward_type::text,
    v_promo.reward_amount,
    CASE WHEN v_promo.reward_type = 'coins' THEN coins ELSE wheel_tickets END,
    'promo_redemption',
    'promo_code',
    v_promo.id,
    'Промокод ' || v_promo.code
  FROM user_wallets WHERE user_id = p_user_id;

  RETURN QUERY
  SELECT v_promo.id, v_promo.reward_type, v_promo.reward_amount, w.coins, w.wheel_tickets
  FROM user_wallets w WHERE w.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION spin_wheel(p_user_id uuid)
RETURNS TABLE (
  spin_id uuid,
  reward_type text,
  reward_amount integer,
  coins_balance bigint,
  wheel_tickets_balance integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_random numeric(12, 10);
  v_reward integer;
  v_spin_id uuid;
BEGIN
  UPDATE user_wallets
  SET wheel_tickets = wheel_tickets - 1, updated_at = now()
  WHERE user_id = p_user_id AND wheel_tickets > 0;
  IF NOT FOUND THEN RAISE EXCEPTION 'NO_WHEEL_TICKETS'; END IF;

  v_random := random();
  v_reward := CASE
    WHEN v_random < 0.50 THEN 25
    WHEN v_random < 0.80 THEN 50
    WHEN v_random < 0.95 THEN 100
    WHEN v_random < 0.995 THEN 250
    ELSE 1000
  END;

  UPDATE user_wallets SET coins = coins + v_reward WHERE user_id = p_user_id;

  INSERT INTO wheel_spins (user_id, reward_type, reward_amount, random_value)
  VALUES (p_user_id, 'coins', v_reward, v_random)
  RETURNING id INTO v_spin_id;

  INSERT INTO wallet_transactions (
    user_id, currency, amount, balance_after, transaction_type,
    reference_type, reference_id, description
  )
  SELECT p_user_id, 'wheel_tickets', -1, wheel_tickets, 'wheel_spin', 'wheel_spin', v_spin_id, 'Квиток Колеса Фортуни'
  FROM user_wallets WHERE user_id = p_user_id;

  INSERT INTO wallet_transactions (
    user_id, currency, amount, balance_after, transaction_type,
    reference_type, reference_id, description
  )
  SELECT p_user_id, 'coins', v_reward, coins, 'wheel_reward', 'wheel_spin', v_spin_id, 'Виграш Колеса Фортуни'
  FROM user_wallets WHERE user_id = p_user_id;

  RETURN QUERY
  SELECT v_spin_id, 'coins', v_reward, w.coins, w.wheel_tickets
  FROM user_wallets w WHERE w.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION advance_match_winner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('completed', 'bye')
     AND NEW.winner_registration_id IS NOT NULL
     AND NEW.next_match_id IS NOT NULL
     AND (
       OLD.status IS DISTINCT FROM NEW.status
       OR OLD.winner_registration_id IS DISTINCT FROM NEW.winner_registration_id
     )
  THEN
    IF NEW.next_match_slot = 1 THEN
      UPDATE matches
      SET participant_one_registration_id = NEW.winner_registration_id
      WHERE id = NEW.next_match_id;
    ELSIF NEW.next_match_slot = 2 THEN
      UPDATE matches
      SET participant_two_registration_id = NEW.winner_registration_id
      WHERE id = NEW.next_match_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS matches_advance_winner ON matches;
CREATE TRIGGER matches_advance_winner
AFTER UPDATE OF status, winner_registration_id ON matches
FOR EACH ROW EXECUTE FUNCTION advance_match_winner();

CREATE OR REPLACE FUNCTION advance_match_loser()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_loser uuid;
BEGIN
  IF NEW.status = 'completed'
     AND NEW.winner_registration_id IS NOT NULL
     AND NEW.loser_next_match_id IS NOT NULL
     AND (
       OLD.status IS DISTINCT FROM NEW.status
       OR OLD.winner_registration_id IS DISTINCT FROM NEW.winner_registration_id
     )
  THEN
    v_loser := CASE
      WHEN NEW.winner_registration_id = NEW.participant_one_registration_id THEN NEW.participant_two_registration_id
      ELSE NEW.participant_one_registration_id
    END;
    IF NEW.loser_next_match_slot = 1 THEN
      UPDATE matches SET participant_one_registration_id = v_loser WHERE id = NEW.loser_next_match_id;
    ELSIF NEW.loser_next_match_slot = 2 THEN
      UPDATE matches SET participant_two_registration_id = v_loser WHERE id = NEW.loser_next_match_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS matches_advance_loser ON matches;
CREATE TRIGGER matches_advance_loser
AFTER UPDATE OF status, winner_registration_id ON matches
FOR EACH ROW EXECUTE FUNCTION advance_match_loser();

CREATE OR REPLACE FUNCTION award_prize_places()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_loser uuid;
  v_winner_place integer;
  v_loser_place integer;
BEGIN
  IF NEW.status <> 'completed' OR NEW.winner_registration_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.match_code = 'PO-FINAL' THEN v_winner_place := 1; v_loser_place := 2;
  ELSIF NEW.match_code = 'PO-BRONZE' THEN v_winner_place := 3; v_loser_place := 4;
  ELSIF NEW.match_code = 'PO-FIFTH' THEN v_winner_place := 5; v_loser_place := 6;
  ELSE RETURN NEW;
  END IF;

  v_loser := CASE
    WHEN NEW.winner_registration_id = NEW.participant_one_registration_id THEN NEW.participant_two_registration_id
    ELSE NEW.participant_one_registration_id
  END;
  INSERT INTO tournament_placements (tournament_id, place, registration_id, source_match_id)
  VALUES (NEW.tournament_id, v_winner_place, NEW.winner_registration_id, NEW.id)
  ON CONFLICT (tournament_id, place) DO UPDATE SET registration_id = excluded.registration_id, source_match_id = excluded.source_match_id, awarded_at = now();
  INSERT INTO tournament_placements (tournament_id, place, registration_id, source_match_id)
  VALUES (NEW.tournament_id, v_loser_place, v_loser, NEW.id)
  ON CONFLICT (tournament_id, place) DO UPDATE SET registration_id = excluded.registration_id, source_match_id = excluded.source_match_id, awarded_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS matches_award_places ON matches;
CREATE TRIGGER matches_award_places
AFTER UPDATE OF status, winner_registration_id ON matches
FOR EACH ROW EXECUTE FUNCTION award_prize_places();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_stage_advancements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

COMMIT;
