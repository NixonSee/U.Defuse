-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL,
  game_mode ENUM('survivor', 'score') DEFAULT 'survivor',
  status ENUM('setup', 'in_progress', 'completed') DEFAULT 'setup',
  current_turn_player_id INT,
  deck_state JSON, -- Stores remaining cards in deck
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  winner_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_code (room_code),
  INDEX idx_status (status)
);

-- Player Scores Table
CREATE TABLE IF NOT EXISTS player_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_session_id INT NOT NULL,
  user_id INT NOT NULL,
  username VARCHAR(50) NOT NULL,
  role VARCHAR(20), -- hacker, spy, saboteur, trickster, gambler, timekeeper
  hand_cards JSON, -- Current cards in hand
  score INT DEFAULT 0,
  bombs_defused INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  defuse_cards_used INT DEFAULT 0,
  safe_cards_collected INT DEFAULT 0,
  is_eliminated BOOLEAN DEFAULT FALSE,
  turn_order INT NOT NULL,
  eliminated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_game_user (game_session_id, user_id)
);

-- Game Events Log (for replays and analytics)
CREATE TABLE IF NOT EXISTS game_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_session_id INT NOT NULL,
  user_id INT,
  event_type ENUM('turn_start', 'card_drawn', 'card_played', 'bomb_triggered', 'bomb_defused', 'bomb_failed', 'role_used', 'player_eliminated', 'game_ended') NOT NULL,
  event_data JSON, -- Stores specific event details
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  INDEX idx_game_events (game_session_id, timestamp)
);

-- Quiz Questions Table (Python MCQs)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT NOT NULL,
  code_snippet TEXT,
  option_a VARCHAR(255) NOT NULL,
  option_b VARCHAR(255) NOT NULL,
  option_c VARCHAR(255) NOT NULL,
  option_d VARCHAR(255) NOT NULL,
  correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  topic VARCHAR(50), -- e.g., 'if-else', 'loops', 'functions'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Attempts (for tracking performance)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_session_id INT NOT NULL,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INT NOT NULL, -- seconds
  bonus_time INT DEFAULT 0, -- extra time from Timekeeper role
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
  INDEX idx_attempts (game_session_id, user_id)
);
