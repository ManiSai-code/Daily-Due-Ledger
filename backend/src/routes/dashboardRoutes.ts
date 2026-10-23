import { Router } from 'express';
import { getCollectionReport, getDashboardStats } from '../controllers/dashboardController';

const router = Router();

router.get('/', getDashboardStats);
router.get('/report', getCollectionReport);

export default router;