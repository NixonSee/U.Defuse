import db from '../db.js';

// Card types and counts
const CARD_DECK = {
  BOMB: { count: 10, symbol: '💣' },
  DEFUSE: { count: 6, symbol: '💻' },
  ATTACK: { count: 10, symbol: '⚔️' },
  SKIP: { count: 5, symbol: '⏭️' },
  SHUFFLE: { count: 5, symbol: '🔀' },
  SWAP: { count: 5, symbol: '🔄' },
  SHIELD: { count: 5, symbol: '🛡️' },
  PEEK: { count: 4, symbol: '👀' },
  SAFE: { count: 10, symbol: '✅' }
};

// Roles
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
   * Initialize a new game session
   */
  async createGameSession(roomCode, playerIds, gameMode = 'survivor') {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO game_sessions (room_code, game_mode, status, deck_state)
        VALUES (?, ?, 'setup', ?)
      `;
      
      // Create initial deck
      const deck = this.createDeck(playerIds.length);
      
      db.query(query, [roomCode, gameMode, JSON.stringify(deck)], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  /**
   * Create and shuffle the initial deck
   */
  createDeck(playerCount) {
    let deck = [];
    
    // Add all non-bomb cards
    Object.entries(CARD_DECK).forEach(([type, data]) => {
      if (type !== 'BOMB') {
        for (let i = 0; i < data.count; i++) {
          deck.push({ type, symbol: data.symbol });
        }
      }
    });
    
    // Shuffle non-bomb cards
    deck = this.shuffleArray(deck);
    
    // Add bombs = (playerCount - 1)
    const bombCount = Math.max(1, playerCount - 1);
    for (let i = 0; i < bombCount; i++) {
      // Insert bombs randomly throughout the deck (not all at top)
      const randomIndex = Math.floor(Math.random() * (deck.length + 1));
      deck.splice(randomIndex, 0, { type: 'BOMB', symbol: CARD_DECK.BOMB.symbol });
    }
    
    return deck;
  }

  /**
   * Assign roles to players and deal initial hands
   */
  async setupPlayers(gameSessionId, players) {
    // Shuffle and assign roles
    const shuffledRoles = this.shuffleArray([...ROLES]).slice(0, players.length);
    
    // Each player gets 1 guaranteed Defuse + 4 random cards
    const playerPromises = players.map(async (player, index) => {
      const hand = [
        { type: 'DEFUSE', symbol: CARD_DECK.DEFUSE.symbol }
      ];
      
      // Deal 4 more random cards (will be drawn from deck)
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO player_scores 
          (game_session_id, user_id, username, role, hand_cards, turn_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.query(
          query,
          [gameSessionId, player.id, player.username, shuffledRoles[index], JSON.stringify(hand), index],
          (err, result) => {
            if (err) return reject(err);
            resolve({
              playerId: result.insertId,
              userId: player.id,
              username: player.username,
              role: shuffledRoles[index],
              roleIcon: ROLE_ICONS[shuffledRoles[index]],
              hand,
              turnOrder: index
            });
          }
        );
      });
    });
    
    return Promise.all(playerPromises);
  }

  /**
   * Draw initial 4 cards for each player from deck
   */
  async dealInitialCards(gameSessionId) {
    return new Promise((resolve, reject) => {
      // Get current deck
      db.query(
        'SELECT deck_state FROM game_sessions WHERE id = ?',
        [gameSessionId],
        async (err, results) => {
          if (err) return reject(err);
          
          let deck = JSON.parse(results[0].deck_state);
          
          // Get all players
          db.query(
            'SELECT id, hand_cards FROM player_scores WHERE game_session_id = ? ORDER BY turn_order',
            [gameSessionId],
            async (err, players) => {
              if (err) return reject(err);
              
              // Deal 4 cards to each player
              for (const player of players) {
                const hand = JSON.parse(player.hand_cards);
                for (let i = 0; i < 4; i++) {
                  if (deck.length > 0) {
                    hand.push(deck.pop());
                  }
                }
                
                // Update player hand
                await new Promise((res, rej) => {
                  db.query(
                    'UPDATE player_scores SET hand_cards = ? WHERE id = ?',
                    [JSON.stringify(hand), player.id],
                    (err) => err ? rej(err) : res()
                  );
                });
              }
              
              // Update deck
              db.query(
                'UPDATE game_sessions SET deck_state = ? WHERE id = ?',
                [JSON.stringify(deck), gameSessionId],
                (err) => err ? reject(err) : resolve(deck)
              );
            }
          );
        }
      );
    });
  }

  /**
   * Start the game
   */
  async startGame(gameSessionId, firstPlayerId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE game_sessions 
        SET status = 'in_progress', current_turn_player_id = ?, started_at = NOW()
        WHERE id = ?
      `;
      
      db.query(query, [firstPlayerId, gameSessionId], (err) => {
        if (err) return reject(err);
        
        // Log event
        this.logEvent(gameSessionId, null, 'turn_start', { playerId: firstPlayerId });
        resolve();
      });
    });
  }

  /**
   * Draw a card from deck
   */
  async drawCard(gameSessionId, playerId) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT deck_state FROM game_sessions WHERE id = ?',
        [gameSessionId],
        (err, results) => {
          if (err) return reject(err);
          
          const deck = JSON.parse(results[0].deck_state);
          if (deck.length === 0) {
            return reject(new Error('Deck is empty'));
          }
          
          const drawnCard = deck.pop();
          
          // Update deck
          db.query(
            'UPDATE game_sessions SET deck_state = ? WHERE id = ?',
            [JSON.stringify(deck), gameSessionId],
            (err) => {
              if (err) return reject(err);
              
              // Log event
              this.logEvent(gameSessionId, playerId, 'card_drawn', { card: drawnCard });
              resolve(drawnCard);
            }
          );
        }
      );
    });
  }

  /**
   * Add card to player's hand
   */
  async addCardToHand(playerId, card) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT hand_cards FROM player_scores WHERE id = ?',
        [playerId],
        (err, results) => {
          if (err) return reject(err);
          
          const hand = JSON.parse(results[0].hand_cards);
          hand.push(card);
          
          db.query(
            'UPDATE player_scores SET hand_cards = ? WHERE id = ?',
            [JSON.stringify(hand), playerId],
            (err) => err ? reject(err) : resolve(hand)
          );
        }
      );
    });
  }

  /**
   * Get random quiz question
   */
  async getRandomQuizQuestion(difficulty = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM quiz_questions';
      const params = [];
      
      if (difficulty) {
        query += ' WHERE difficulty = ?';
        params.push(difficulty);
      }
      
      query += ' ORDER BY RAND() LIMIT 1';
      
      db.query(query, params, (err, results) => {
        if (err) return reject(err);
        resolve(results[0] || null);
      });
    });
  }

  /**
   * Record quiz attempt
   */
  async recordQuizAttempt(gameSessionId, userId, questionId, selectedAnswer, timeTaken, bonusTime = 0) {
    return new Promise((resolve, reject) => {
      // Get correct answer
      db.query(
        'SELECT correct_answer FROM quiz_questions WHERE id = ?',
        [questionId],
        (err, results) => {
          if (err) return reject(err);
          
          const isCorrect = results[0].correct_answer === selectedAnswer;
          
          const query = `
            INSERT INTO quiz_attempts 
            (game_session_id, user_id, question_id, selected_answer, is_correct, time_taken, bonus_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          
          db.query(
            query,
            [gameSessionId, userId, questionId, selectedAnswer, isCorrect, timeTaken, bonusTime],
            (err) => {
              if (err) return reject(err);
              resolve(isCorrect);
            }
          );
        }
      );
    });
  }

  /**
   * Update player score after bomb defusal
   */
  async updateScoreAfterBomb(playerId, isCorrect, usedDefuseCard, timeTaken) {
    return new Promise((resolve, reject) => {
      let scoreIncrease = 0;
      let updateFields = [];
      
      if (isCorrect) {
        scoreIncrease += 10; // Correct defuse
        updateFields.push('bombs_defused = bombs_defused + 1');
        updateFields.push('correct_answers = correct_answers + 1');
        
        // Speed bonus: under 10s = +5, under 20s = +3, under 30s = +1
        if (timeTaken < 10) scoreIncrease += 5;
        else if (timeTaken < 20) scoreIncrease += 3;
        else if (timeTaken < 30) scoreIncrease += 1;
      } else if (usedDefuseCard) {
        scoreIncrease += 5; // Used Defuse card
        updateFields.push('defuse_cards_used = defuse_cards_used + 1');
      }
      
      updateFields.push(`score = score + ${scoreIncrease}`);
      
      const query = `UPDATE player_scores SET ${updateFields.join(', ')} WHERE id = ?`;
      
      db.query(query, [playerId], (err) => {
        if (err) return reject(err);
        resolve(scoreIncrease);
      });
    });
  }

  /**
   * Eliminate a player
   */
  async eliminatePlayer(playerId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE player_scores 
        SET is_eliminated = TRUE, eliminated_at = NOW()
        WHERE id = ?
      `;
      
      db.query(query, [playerId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Log game event
   */
  async logEvent(gameSessionId, userId, eventType, eventData = {}) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO game_events (game_session_id, user_id, event_type, event_data)
        VALUES (?, ?, ?, ?)
      `;
      
      db.query(
        query,
        [gameSessionId, userId, eventType, JSON.stringify(eventData)],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  /**
   * Fisher-Yates shuffle
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Handle bomb trigger (player scans QR)
   */
  async triggerBomb(gameSessionId, playerId) {
    return new Promise((resolve, reject) => {
      // Get player role to check for Timekeeper bonus
      db.query(
        'SELECT role FROM player_scores WHERE id = ?',
        [playerId],
        async (err, results) => {
          if (err) return reject(err);
          
          const role = results[0].role;
          const bonusTime = role === 'timekeeper' ? 15 : 0;
          const totalTime = 30 + bonusTime;
          
          // Get random quiz question
          const question = await this.getRandomQuizQuestion();
          
          // Log event
          await this.logEvent(gameSessionId, playerId, 'bomb_triggered', { 
            questionId: question.id,
            timerSeconds: totalTime
          });
          
          resolve({
            question,
            timerSeconds: totalTime,
            bonusTime
          });
        }
      );
    });
  }

  /**
   * Handle bomb defusal attempt
   */
  async defuseBomb(gameSessionId, playerId, questionId, selectedAnswer, timeTaken, usedHackerAbility = false) {
    return new Promise(async (resolve, reject) => {
      try {
        // If Hacker ability used, auto-pass
        if (usedHackerAbility) {
          await this.updateScoreAfterBomb(playerId, true, false, 0);
          await this.logEvent(gameSessionId, playerId, 'bomb_defused', { 
            method: 'hacker_ability',
            scoreGained: 10
          });
          return resolve({ success: true, method: 'hacker', scoreGained: 10 });
        }
        
        // Get player role for bonus time tracking
        const playerData = await new Promise((res, rej) => {
          db.query(
            'SELECT role FROM player_scores WHERE id = ?',
            [playerId],
            (err, results) => err ? rej(err) : res(results[0])
          );
        });
        
        const bonusTime = playerData.role === 'timekeeper' ? 15 : 0;
        
        // Record quiz attempt
        const isCorrect = await this.recordQuizAttempt(
          gameSessionId,
          playerId,
          questionId,
          selectedAnswer,
          timeTaken,
          bonusTime
        );
        
        if (isCorrect) {
          // Correct answer - calculate score
          const scoreGained = await this.updateScoreAfterBomb(playerId, true, false, timeTaken);
          
          await this.logEvent(gameSessionId, playerId, 'bomb_defused', {
            timeTaken,
            scoreGained,
            speedBonus: timeTaken < 10 ? 5 : timeTaken < 20 ? 3 : timeTaken < 30 ? 1 : 0
          });
          
          resolve({ success: true, scoreGained, timeTaken });
        } else {
          // Wrong answer - check for Defuse card or eliminate
          await this.logEvent(gameSessionId, playerId, 'bomb_failed', { timeTaken });
          resolve({ success: false, eliminated: false }); // UI will handle Defuse card check
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Use Defuse card to survive bomb
   */
  async useDefuseCard(playerId) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT hand_cards FROM player_scores WHERE id = ?',
        [playerId],
        (err, results) => {
          if (err) return reject(err);
          
          const hand = JSON.parse(results[0].hand_cards);
          const defuseIndex = hand.findIndex(card => card.type === 'DEFUSE');
          
          if (defuseIndex === -1) {
            return reject(new Error('No Defuse card in hand'));
          }
          
          // Remove Defuse card
          hand.splice(defuseIndex, 1);
          
          db.query(
            'UPDATE player_scores SET hand_cards = ? WHERE id = ?',
            [JSON.stringify(hand), playerId],
            async (err) => {
              if (err) return reject(err);
              
              // Award points for using Defuse
              await this.updateScoreAfterBomb(playerId, false, true, 0);
              resolve({ scoreGained: 5 });
            }
          );
        }
      );
    });
  }

  /**
   * Check game end condition
   */
  async checkGameEnd(gameSessionId) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT COUNT(*) as alive FROM player_scores WHERE game_session_id = ? AND is_eliminated = FALSE',
        [gameSessionId],
        async (err, results) => {
          if (err) return reject(err);
          
          const aliveCount = results[0].alive;
          
          // Game ends if only 1 player left or deck is empty
          if (aliveCount <= 1) {
            await this.endGame(gameSessionId);
            resolve({ ended: true, reason: 'last_survivor' });
          } else {
            // Check if deck is empty
            const gameState = await this.getGameState(gameSessionId);
            const deck = JSON.parse(gameState.game.deck_state);
            
            if (deck.length === 0) {
              await this.endGame(gameSessionId);
              resolve({ ended: true, reason: 'deck_empty' });
            } else {
              resolve({ ended: false });
            }
          }
        }
      );
    });
  }

  /**
   * End game and determine winner
   */
  async endGame(gameSessionId) {
    return new Promise((resolve, reject) => {
      // Get winner (highest score or last survivor)
      db.query(
        `SELECT id, user_id, username, score, is_eliminated 
         FROM player_scores 
         WHERE game_session_id = ? 
         ORDER BY is_eliminated ASC, score DESC, bombs_defused DESC
         LIMIT 1`,
        [gameSessionId],
        (err, results) => {
          if (err) return reject(err);
          
          const winner = results[0];
          
          db.query(
            'UPDATE game_sessions SET status = ?, winner_id = ?, ended_at = NOW() WHERE id = ?',
            ['completed', winner.user_id, gameSessionId],
            async (err) => {
              if (err) return reject(err);
              
              await this.logEvent(gameSessionId, winner.user_id, 'game_ended', {
                winner: winner.username,
                score: winner.score
              });
              
              resolve(winner);
            }
          );
        }
      );
    });
  }

  /**
   * Get game state
   */
  async getGameState(gameSessionId) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM game_sessions WHERE id = ?',
        [gameSessionId],
        (err, gameResults) => {
          if (err) return reject(err);
          
          db.query(
            'SELECT * FROM player_scores WHERE game_session_id = ? ORDER BY turn_order',
            [gameSessionId],
            (err, playerResults) => {
              if (err) return reject(err);
              
              resolve({
                game: gameResults[0],
                players: playerResults.map(p => ({
                  ...p,
                  hand_cards: JSON.parse(p.hand_cards),
                  roleIcon: ROLE_ICONS[p.role]
                }))
              });
            }
          );
        }
      );
    });
  }
}

export default new GameService();
