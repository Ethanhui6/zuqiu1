CREATE TABLE IF NOT EXISTS run_sessions (
  id TEXT PRIMARY KEY,
  player_key TEXT NOT NULL,
  seed_hash TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  eligible INTEGER NOT NULL DEFAULT 0,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  last_evidence TEXT NOT NULL,
  last_evidence_hash TEXT NOT NULL,
  last_reason TEXT,
  last_checkpoint_at INTEGER NOT NULL,
  rejection_reason TEXT
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE,
  player_name TEXT NOT NULL,
  nation TEXT NOT NULL,
  position TEXT NOT NULL,
  club_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  seasons INTEGER NOT NULL,
  ending TEXT NOT NULL DEFAULT '',
  submitted_at INTEGER NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  evidence_hash TEXT NOT NULL,
  FOREIGN KEY(run_id) REFERENCES run_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_verified_score
ON leaderboard_entries(verified, score DESC, submitted_at ASC);

CREATE INDEX IF NOT EXISTS idx_run_sessions_status_checkpoint
ON run_sessions(status, last_checkpoint_at);
