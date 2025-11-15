import db from '../db.js';

// Helper to safely parse JSON (handles both string and already-parsed object)
const safeJsonParse = (data) => {
  if (typeof data === 'string') {
    return JSON.parse(data);
  }
  return data; // Already parsed by mysql2
};

// Roles (for assigning special abilities)
const ROLES = ['hacker', 'spy', 'saboteur', 'trickster', 'gambler', 'timekeeper'];
const ROLE_ICONS = {
  hacker: '💻',
  spy: '🕵️‍♂️',
  saboteur: '💣',
  trickster: '🎭',
  gambler: '🎲',
  timekeeper: '⏱️'
};

class GameService {
  /**
   * Initialize a new game session (digital tracking only - physical cards handled separately)
   */
  async createGameSession(roomCode, gameMode = 'survivor', playerCount) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO game_rounds (room_code, game_mode, status)
        VALUES (?, ?, 'setup')
      `;
      
      db.query(query, [roomCode, gameMode], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  /**
   * Assign roles to players (no card dealing - physical cards handled by players)
   */
  async setupPlayers(gameSessionId, players) {
    console.log('🎲 Setting up players:', JSON.stringify(players, null, 2));
    
    // Shuffle and assign roles
    const shuffledRoles = this.shuffleArray([...ROLES]).slice(0, players.length);
    
    const playerPromises = players.map(async (player, index) => {
      console.log(`👤 Processing player ${index}:`, { id: player.id, username: player.username });
      
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO player_scores 
          (game_round_id, user_id, username, role, score, turn_order)
          VALUES (?, ?, ?, ?, 0, ?)
        `;
        
        const userId = player.id || player.user_id || player.userId;
        
        if (!userId) {
          console.error('❌ Missing user_id for player:', player);
          return reject(new Error('Player missing user_id'));
        }
        
        db.query(
          query,
          [gameSessionId, userId, player.username, shuffledRoles[index], index],
          (err, result) => {
            if (err) return reject(err);
            resolve({
              playerId: result.insertId,
              userId: userId,
              username: player.username,
              role: shuffledRoles[index],
              roleIcon: ROLE_ICONS[shuffledRoles[index]],
              turnOrder: index
            });
          }
        );
      });
    });

    return Promise.all(playerPromises);
  }

  /**
   * Start the game
   */
  async startGame(gameSessionId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE game_rounds 
        SET status = 'in_progress', started_at = NOW()
        WHERE id = ?
      `;
      
      db.query(query, [gameSessionId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Get a random quiz question from database
   */
  async getRandomQuizQuestion(difficulty = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM quiz_questions';
      let params = [];
      
      if (difficulty) {
        query += ' WHERE difficulty = ?';
        params.push(difficulty);
      }
      
      query += ' ORDER BY RAND() LIMIT 1';
      
      db.query(query, params, (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return reject(new Error('No questions found'));
        resolve(results[0]);
      });
    });
  }

  /**
   * Trigger bomb - get quiz question for player
   */
  async triggerBomb(gameSessionId, userId) {
    return new Promise(async (resolve, reject) => {
      try {
        // Get player info for role-based bonuses
        const [players] = await new Promise((res, rej) => {
          db.query(
            'SELECT * FROM player_scores WHERE game_round_id = ? AND user_id = ?',
            [gameSessionId, userId],
            (err, results) => err ? rej(err) : res([results])
          );
        });
        
        if (!players || players.length === 0) {
          return reject(new Error('Player not found'));
        }
        
        const player = players[0];
        
        // Get quiz question
        const question = await this.getRandomQuizQuestion();
        
        // Base timer: 30 seconds
        let timerSeconds = 30;
        let bonusTime = 0;
        
        // Timekeeper gets +10 seconds
        if (player.role === 'timekeeper') {
          bonusTime = 10;
          timerSeconds += bonusTime;
        }
        
        // Log bomb trigger event
        await this.logEvent(gameSessionId, userId, 'bomb_triggered', { questionId: question.id });
        
        resolve({
          question,
          timerSeconds,
          bonusTime
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Handle quiz answer and calculate score
   */
  async defuseBomb(gameSessionId, userId, questionId, selectedAnswer, timeTaken, usedHackerAbility = false) {
    return new Promise(async (resolve, reject) => {
      try {
        // Get question to check correct answer
        const [questions] = await new Promise((res, rej) => {
          db.query(
            'SELECT * FROM quiz_questions WHERE id = ?',
            [questionId],
            (err, results) => err ? rej(err) : res([results])
          );
        });
        
        if (!questions || questions.length === 0) {
          return reject(new Error('Question not found'));
        }
        
        const question = questions[0];
        console.log('🔍 Answer validation:', {
          questionId,
          selectedAnswer,
          selectedAnswerType: typeof selectedAnswer,
          correctAnswer: question.correct_answer,
          correctAnswerType: typeof question.correct_answer,
          match: selectedAnswer === question.correct_answer,
          strictMatch: selectedAnswer === question.correct_answer,
          looseMatch: selectedAnswer == question.correct_answer,
          usedHackerAbility,
          fullQuestion: question
        });
        const isCorrect = selectedAnswer === question.correct_answer || usedHackerAbility;
        
        // Calculate score
        let scoreGained = 0;
        if (isCorrect && !usedHackerAbility) {
          // Only award points if NOT using hacker ability
          scoreGained = 10; // Base score for correct answer
          
          // Speed bonus (if answered in < 10 seconds)
          if (timeTaken < 10) {
            scoreGained += 5;
          }
        }
        
        // Update player score
        // If hacker ability used: no score, no correct_answers increment, but still count as defused
        await new Promise((res, rej) => {
          db.query(
            'UPDATE player_scores SET score = score + ?, bombs_defused = bombs_defused + ?, bombs_failed = bombs_failed + ?, correct_answers = correct_answers + ? WHERE game_round_id = ? AND user_id = ?',
            [scoreGained, isCorrect ? 1 : 0, isCorrect ? 0 : 1, (isCorrect && !usedHackerAbility) ? 1 : 0, gameSessionId, userId],
            (err) => err ? rej(err) : res()
          );
        });
        
        // Record quiz attempt
        await new Promise((res, rej) => {
          db.query(
            'INSERT INTO quiz_attempts (game_round_id, user_id, question_id, selected_answer, is_correct, time_taken) VALUES (?, ?, ?, ?, ?, ?)',
            [gameSessionId, userId, questionId, selectedAnswer, isCorrect, timeTaken],
            (err) => err ? rej(err) : res()
          );
        });
        
        // Log event
        await this.logEvent(gameSessionId, userId, isCorrect ? 'bomb_defused' : 'bomb_failed', {
          questionId,
          scoreGained,
          timeTaken,
          usedHackerAbility
        });
        
        resolve({
          success: isCorrect,
          scoreGained,
          correctAnswer: question.correct_answer,
          method: usedHackerAbility ? 'hacker' : 'quiz'
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Eliminate player from game
   */
  async eliminatePlayer(userId, gameSessionId) {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE player_scores SET is_eliminated = TRUE, eliminated_at = NOW() WHERE user_id = ? AND game_round_id = ?',
        [userId, gameSessionId],
        (err) => {
          if (err) return reject(err);
          this.logEvent(gameSessionId, userId, 'player_eliminated', {});
          resolve();
        }
      );
    });
  }

  /**
   * Check if game should end
   */
  async checkGameEnd(gameSessionId) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT COUNT(*) as alive FROM player_scores WHERE game_round_id = ? AND is_eliminated = FALSE',
        [gameSessionId],
        (err, results) => {
          if (err) return reject(err);
          
          const aliveCount = results[0].alive;
          
          // Game ends if only 1 player left
          if (aliveCount <= 1) {
            this.endGame(gameSessionId);
            resolve({ ended: true, reason: 'last_survivor' });
          } else {
            resolve({ ended: false });
          }
        }
      );
    });
  }

  /**
   * End the game and determine winner
   */
  async endGame(gameSessionId) {
    return new Promise((resolve, reject) => {
      // Get winner (highest score or last survivor)
      db.query(
        `SELECT user_id, username, score, is_eliminated 
         FROM player_scores 
         WHERE game_round_id = ? 
         ORDER BY is_eliminated ASC, score DESC, bombs_defused DESC 
         LIMIT 1`,
        [gameSessionId],
        (err, results) => {
          if (err) return reject(err);
          
          const winner = results[0];
          
          db.query(
            'UPDATE game_rounds SET status = ?, winner_id = ?, ended_at = NOW() WHERE id = ?',
            ['completed', winner.user_id, gameSessionId],
            (err) => {
              if (err) return reject(err);
              this.logEvent(gameSessionId, null, 'game_ended', { winner: winner.username });
              resolve(winner);
            }
          );
        }
      );
    });
  }

  /**
   * Log game event
   */
  async logEvent(gameSessionId, userId, eventType, eventData) {
    return new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO game_events (game_round_id, user_id, event_type, event_data) VALUES (?, ?, ?, ?)',
        [gameSessionId, userId, eventType, JSON.stringify(eventData)],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  /**
   * Get current game state
   */
  async getGameState(gameSessionId) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM game_rounds WHERE id = ?',
        [gameSessionId],
        (err, gameResults) => {
          if (err) return reject(err);
          
          db.query(
            'SELECT * FROM player_scores WHERE game_round_id = ? ORDER BY turn_order',
            [gameSessionId],
            (err, playerResults) => {
              if (err) return reject(err);
              
              resolve({
                game: gameResults[0],
                players: playerResults.map(p => ({
                  ...p,
                  roleIcon: ROLE_ICONS[p.role]
                }))
              });
            }
          );
        }
      );
    });
  }

  /**
   * Shuffle array helper
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Empty placeholder to match server.js call
  async dealInitialCards(gameSessionId) {
    // Physical cards - no digital dealing needed
    return Promise.resolve();
  }

  /**
   * Complete game and mark winner
   */
  async completeGame(gameSessionId, winnerId) {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE game_rounds SET status = ?, ended_at = NOW(), winner_id = ? WHERE id = ?',
        ['completed', winnerId, gameSessionId],
        (err, result) => {
          if (err) return reject(err);
          console.log(`✅ Game ${gameSessionId} marked as completed. Winner: ${winnerId}`);
          resolve(result);
        }
      );
    });
  }

  /**
   * Get game history for a user
   */
  async getGameHistory(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          gr.id,
          gr.room_code,
          gr.game_mode,
          gr.started_at,
          gr.ended_at,
          gr.winner_id,
          winner.username as winner_username,
          TIMESTAMPDIFF(SECOND, gr.started_at, gr.ended_at) as duration_seconds
        FROM game_rounds gr
        LEFT JOIN users winner ON gr.winner_id = winner.user_id
        WHERE gr.status = 'completed'
          AND gr.id IN (
            SELECT DISTINCT game_round_id 
            FROM player_scores 
            WHERE user_id = ?
          )
        ORDER BY gr.ended_at DESC
        LIMIT 50
      `;

      db.query(query, [userId], (err, gameResults) => {
        if (err) return reject(err);

        if (gameResults.length === 0) {
          return resolve([]);
        }

        // Get player scores for each game
        const gameIds = gameResults.map(g => g.id);
        db.query(
          `SELECT ps.*, u.username 
           FROM player_scores ps
           JOIN users u ON ps.user_id = u.user_id
           WHERE ps.game_round_id IN (?)
           ORDER BY ps.game_round_id, ps.score DESC`,
          [gameIds],
          (err, playerScores) => {
            if (err) return reject(err);

            // Get quiz attempts for each game
            db.query(
              `SELECT qa.*, qq.question, qq.code_snippet, qq.option_a, qq.option_b, qq.option_c, qq.option_d, qq.correct_answer, u.username
               FROM quiz_attempts qa
               JOIN quiz_questions qq ON qa.question_id = qq.id
               JOIN users u ON qa.user_id = u.user_id
               WHERE qa.game_round_id IN (?)
               ORDER BY qa.timestamp`,
              [gameIds],
              (err, quizAttempts) => {
                if (err) return reject(err);

                // Group data by game
                const games = gameResults.map(game => {
                  const players = playerScores.filter(p => p.game_round_id === game.id);
                  const attempts = quizAttempts.filter(q => q.game_round_id === game.id);

                  return {
                    id: game.id,
                    roomCode: game.room_code,
                    gameMode: game.game_mode,
                    startedAt: game.started_at,
                    endedAt: game.ended_at,
                    durationSeconds: game.duration_seconds,
                    winner: {
                      id: game.winner_id,
                      username: game.winner_username
                    },
                    players: players.map(p => ({
                      userId: p.user_id,
                      username: p.username,
                      role: p.role,
                      score: p.score,
                      bombsDefused: p.bombs_defused,
                      bombsFailed: p.bombs_failed,
                      isEliminated: p.is_eliminated
                    })),
                    quizAttempts: attempts.map(q => ({
                      questionId: q.question_id,
                      userId: q.user_id,
                      username: q.username,
                      question: q.question,
                      codeSnippet: q.code_snippet,
                      optionA: q.option_a,
                      optionB: q.option_b,
                      optionC: q.option_c,
                      optionD: q.option_d,
                      selectedAnswer: q.selected_answer,
                      correctAnswer: q.correct_answer,
                      isCorrect: q.is_correct,
                      timeTaken: q.time_taken
                    }))
                  };
                });

                resolve(games);
              }
            );
          }
        );
      });
    });
  }
}

export default new GameService();
