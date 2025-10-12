import { Router } from 'express';
import chatRoutes from './chat.js';
import healthRoutes from './health.js';

const router = Router();

router.use('/chat', chatRoutes);
router.use('/health', healthRoutes);

export default router;
