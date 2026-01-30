import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkResumeUploadLimit, checkSubscriptionLimits, trackAtsUsage } from '../middleware/subscription.js';
import { handleListResumes, handleRunAts, handleUploadResume, handleDeleteResume } from './resume.controller.js';
import { getAtsHistory } from './resume.service.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.get('/', authenticate, handleListResumes);
router.get('/history/ats', authenticate, async (req, res) => {
  try {
    const history = await getAtsHistory(req.user.id);
    res.json({ history });
  } catch (error) {
    console.error('ATS history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch ATS history' });
  }
});
router.post('/', authenticate, checkResumeUploadLimit, upload.single('file'), handleUploadResume);
router.post('/:resumeId/ats', authenticate, checkSubscriptionLimits, trackAtsUsage, handleRunAts);
router.delete('/:resumeId', authenticate, handleDeleteResume);

export default router;
