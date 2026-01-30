import { uploadResume, listResumes, runAtsForResume, deleteResume } from './resume.service.js';

export const handleUploadResume = async (req, res) => {
  try {
    const resume = await uploadResume(req.user.id, req.file);
    return res.status(201).json(resume);
  } catch (err) {
    console.error('❌ [RESUME] Upload error:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

export const handleListResumes = async (req, res) => {
  try {
    const resumes = await listResumes(req.user.id);
    return res.status(200).json({ resumes });
  } catch (err) {
    console.error('❌ [RESUME] List error:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

export const handleRunAts = async (req, res) => {
  const { resumeId } = req.params;
  const { jobDescription } = req.body || {};

  try {
    const result = await runAtsForResume(req.user.id, resumeId, jobDescription);
    return res.status(200).json(result);
  } catch (err) {
    console.error('❌ [RESUME] ATS error:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

export const handleDeleteResume = async (req, res) => {
  const { resumeId } = req.params;

  try {
    await deleteResume(req.user.id, resumeId);
    return res.status(200).json({ message: 'Resume deleted' });
  } catch (err) {
    console.error('❌ [RESUME] Delete error:', err.message);
    return res.status(400).json({ message: err.message });
  }
};
