import { Router } from 'express';
import {
  assignBorrowers,
  createUser,
  listUsers,
  login,
  me,
} from '../controllers/authController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/users', authenticate, requireAdmin, createUser);
router.get('/users', authenticate, requireAdmin, listUsers);
router.patch('/users/:userId/assignments', authenticate, requireAdmin, assignBorrowers);
export default router;
