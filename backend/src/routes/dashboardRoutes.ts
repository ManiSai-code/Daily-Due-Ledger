import { Router } from 'express';
import { getCollectionReport, getDashboardStats } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getDashboardStats);
router.get('/report', authenticate, getCollectionReport);

export default router;