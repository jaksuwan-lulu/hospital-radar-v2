import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import db from '../services/db.service';

const router = Router();

// All favorites routes require login
router.use(authMiddleware);

// GET /api/favorites
router.get('/', async (req, res) => {
  const userId = (req as any).user.sub;
  try {
    const favs = await db.query(
      'SELECT hospital_osm_id FROM favorites WHERE user_id = $1',
      [userId]
    );
    res.json({ success: true, favorites: favs.rows.map((r: any) => r.hospital_osm_id) });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/favorites/:osmId — toggle
router.post('/:osmId', async (req, res) => {
  const userId = (req as any).user.sub;
  const osmId  = req.params.osmId;
  try {
    const existing = await db.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND hospital_osm_id = $2',
      [userId, osmId]
    );
    if (existing.rows.length > 0) {
      await db.query('DELETE FROM favorites WHERE user_id = $1 AND hospital_osm_id = $2', [userId, osmId]);
      res.json({ success: true, action: 'removed' });
    } else {
      await db.query('INSERT INTO favorites (user_id, hospital_osm_id) VALUES ($1, $2)', [userId, osmId]);
      res.json({ success: true, action: 'added' });
    }
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

export default router;
