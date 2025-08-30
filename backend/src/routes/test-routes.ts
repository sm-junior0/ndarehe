// Create test-routes.ts
import { Router } from 'express';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Test routes working!' });
});

router.post('/stripe/test', (req, res) => {
  res.json({ message: 'Stripe test POST working!' });
});

export default router;