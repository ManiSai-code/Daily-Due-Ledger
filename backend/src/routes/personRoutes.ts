import { Router } from 'express';
import {
  createPerson,
  getAllPeople,
  getPersonById,
  updateDailyAmount,
  getDailyAmountHistory,
  deletePersonHandler,
} from '../controllers/personController';

const router = Router();

router.post('/', createPerson);
router.get('/', getAllPeople);
router.get('/:id', getPersonById);
router.patch('/:id/daily-amount', updateDailyAmount);
router.get('/:id/daily-amount-history', getDailyAmountHistory);
router.delete('/:id', deletePersonHandler);

export default router;