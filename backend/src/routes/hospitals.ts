import { Router } from 'express';
import { fetchHospitalsNearby } from '../services/osm.service';

const router = Router();

// GET /api/hospitals?lat=13.7563&lng=100.5018&radius=5000&type=all&status=all
router.get('/', async (req, res) => {
  const lat    = parseFloat(req.query.lat    as string);
  const lng    = parseFloat(req.query.lng    as string);
  const radius = parseFloat(req.query.radius as string) || 5000;
  const type   = (req.query.type   as string) || 'all';
  const status = (req.query.status as string) || 'all';

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  if (radius > 20000) {
    return res.status(400).json({ error: 'radius must be <= 20000 meters' });
  }

  try {
    let hospitals = await fetchHospitalsNearby(lat, lng, radius);

    if (type !== 'all')   hospitals = hospitals.filter(h => h.type === type);
    if (status !== 'all') hospitals = hospitals.filter(h => h.status === status);

    res.json({ success: true, count: hospitals.length, data: hospitals });
  } catch (err: any) {
    console.error('[hospitals]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch hospitals' });
  }
});

export default router;
