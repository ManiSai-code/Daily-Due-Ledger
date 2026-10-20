import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

router.get('/', getDashboardStats);

export default router;