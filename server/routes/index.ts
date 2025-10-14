import { Router } from 'express';
import chatRoutes from './chat.js';
import healthRoutes from './health.js';
import context7Routes from './context7.js';

const router = Router();

router.use('/chat', chatRoutes);
router.use('/health', healthRoutes);
router.use('/context7', context7Routes);

export default router;
