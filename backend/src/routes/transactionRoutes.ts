import { Router } from 'express';
import { recordPayment, getPersonTransactions } from '../controllers/transactionController';

const router = Router();

router.post('/', recordPayment);
router.get('/person/:personId', getPersonTransactions);

export default router;