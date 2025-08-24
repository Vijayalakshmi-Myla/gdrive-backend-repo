import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { createShareLink, resolveShareToken, revokeShareLink } from '../controllers/shareController';
const router = Router();
router.get('/:token', resolveShareToken); // public
router.use(authMiddleware);
router.post('/', createShareLink);
router.post('/:id/revoke', revokeShareLink);
export default router;
