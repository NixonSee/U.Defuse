import express from 'express';
import gameService from '../services/gameService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/game/history
 * Get game history for the authenticated user
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Set by authenticateToken middleware
    const gameHistory = await gameService.getGameHistory(userId);
    
    res.json({
      success: true,
      games: gameHistory
    });
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game history'
    });
  }
});

export default router;
