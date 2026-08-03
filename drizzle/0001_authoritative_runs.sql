CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  public_nickname TEXT NOT NULL DEFAULT '绿茵玩家',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS career_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  server_seed TEXT NOT NULL,
  session_token_hash TEXT NOT NULL,
  game_version TEXT NOT NULL,
  config_version TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  initial_ovr INTEGER NOT NULL,
  state_json TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'clear',
  started_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS run_events (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  nonce TEXT NOT NULL,
  action_json TEXT NOT NULL,
  result_json TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(run_id, sequence),
  UNIQUE(run_id, nonce),
  FOREIGN KEY(run_id) REFERENCES career_runs(id)
);

CREATE TABLE IF NOT EXISTS score_snapshots (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  state_hash TEXT NOT NULL,
  score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(run_id) REFERENCES career_runs(id)
);

CREATE TABLE IF NOT EXISTS anti_cheat_flags (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  code TEXT NOT NULL,
  severity TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  FOREIGN KEY(run_id) REFERENCES career_runs(id)
);

CREATE TABLE IF NOT EXISTS leaderboard_metadata (
  run_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  public_nickname TEXT NOT NULL,
  game_version TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  category TEXT NOT NULL,
  review_status TEXT NOT NULL,
  public_details INTEGER NOT NULL DEFAULT 1,
  withdrawn INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(run_id) REFERENCES career_runs(id)
);

CREATE TABLE IF NOT EXISTS leaderboard_reports (
  id TEXT PRIMARY KEY,
  target_run_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_career_runs_user_status ON career_runs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_run_events_run_sequence ON run_events(run_id, sequence);
CREATE INDEX IF NOT EXISTS idx_score_snapshots_run_sequence ON score_snapshots(run_id, sequence);
CREATE INDEX IF NOT EXISTS idx_flags_run_severity ON anti_cheat_flags(run_id, severity);
CREATE INDEX IF NOT EXISTS idx_metadata_filters ON leaderboard_metadata(category, game_version, difficulty, withdrawn);
