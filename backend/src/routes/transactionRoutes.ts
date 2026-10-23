import { Router } from 'express';
import { recordPayment, getPersonTransactions } from '../controllers/transactionController';
import { authenticate, requireAdmin, requirePersonAccess } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, requireAdmin, recordPayment);
router.get('/person/:personId', authenticate, requirePersonAccess, getPersonTransactions);

export default router;