import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkSubscriptionLimits, trackInterviewUsage } from '../middleware/subscription.js';
import {
  generateAiQuestions,
  evaluateInterview,
  extractTextFromPdf,
  storeInterviewResult,
  getInterviewHistory,
  getInterviewDetail,
} from './interview.service.js';

const router = express.Router();

// Generate interview questions for a given level
router.post('/:resumeId/questions', authenticate, checkSubscriptionLimits, trackInterviewUsage, async (req, res) => {
  try {
    const { level, jd, resume } = req.body;

    if (!level || !jd || !resume) {
      return res.status(400).json({ error: 'Missing required fields: level, jd, resume' });
    }

    console.log(`📋 [INTERVIEW] Generating questions for ${level}`);
    const questions = await generateAiQuestions(level, jd, resume);

    res.json({ success: true, questions });
  } catch (error) {
    console.error('❌ [INTERVIEW] Question generation error:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// Evaluate interview transcript
router.post('/:resumeId/evaluate', authenticate, async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Missing transcript' });
    }

    console.log('🎤 [INTERVIEW] Evaluating transcript');
    const result = await evaluateInterview(transcript);

    res.json({ success: true, result });
  } catch (error) {
    console.error('❌ [INTERVIEW] Evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate interview' });
  }
});

// Store interview result
router.post('/:resumeId/store', authenticate, async (req, res) => {
  try {
    const { level, transcript, result } = req.body;
    const { resumeId } = req.params;

    if (!level || !transcript || !result) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`💾 [INTERVIEW] Storing ${level} interview result`);
    await storeInterviewResult(req.user.id, resumeId, level, transcript, result);

    res.json({ success: true, message: 'Interview result stored' });
  } catch (error) {
    console.error('❌ [INTERVIEW] Storage error:', error);
    res.status(500).json({ error: 'Failed to store interview result' });
  }
});

// Get interview history
router.get('/history', authenticate, async (req, res) => {
  try {
    console.log('📚 [INTERVIEW] Fetching interview history');
    const interviews = await getInterviewHistory(req.user.id);

    res.json({ success: true, interviews });
  } catch (error) {
    console.error('❌ [INTERVIEW] History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch interview history' });
  }
});

// Get specific interview detail
router.get('/:interviewId', authenticate, async (req, res) => {
  try {
    const { interviewId } = req.params;

    console.log(`🔍 [INTERVIEW] Fetching interview ${interviewId}`);
    const interview = await getInterviewDetail(interviewId);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Check ownership
    if (interview.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ success: true, interview });
  } catch (error) {
    console.error('❌ [INTERVIEW] Detail fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch interview detail' });
  }
});

// Extract PDF text
router.post('/pdf/extract', authenticate, async (req, res) => {
  try {
    const { base64Data } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'Missing base64Data' });
    }

    console.log('📄 [INTERVIEW] Extracting PDF text');
    const text = await extractTextFromPdf(base64Data);

    res.json({ success: true, text });
  } catch (error) {
    console.error('❌ [INTERVIEW] PDF extraction error:', error);
    res.status(500).json({ error: 'Failed to extract PDF text' });
  }
});

export default router;
