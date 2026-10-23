import { Router } from 'express';
import {
  createPerson,
  getAllPeople,
  getPersonById,
  updateDailyAmount,
  getDailyAmountHistory,
  deletePersonHandler,
} from '../controllers/personController';
import { authenticate, requireAdmin, requirePersonAccess } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, requireAdmin, createPerson);
router.get('/', authenticate, getAllPeople);
router.get('/:id', authenticate, requirePersonAccess, getPersonById);
router.patch('/:id/daily-amount', authenticate, requireAdmin, updateDailyAmount);
router.get('/:id/daily-amount-history', authenticate, requirePersonAccess, getDailyAmountHistory);
router.delete('/:id', authenticate, requireAdmin, deletePersonHandler);

export default router;