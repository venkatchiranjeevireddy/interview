import { supabaseAdmin } from '../config/supabase.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Groq from 'groq-sdk';
import { runSimpleAts, generateResumeKey } from './resume.ats.js';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'resumes';
const DAILY_ATS_LIMIT = 5;
const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const ensureBucket = async () => {
  try {
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (error) return;
    const exists = (data || []).some((b) => b.name === BUCKET);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
    }
  } catch (err) {
    console.error('⚠️ [RESUME] Bucket check failed:', err.message);
  }
};

const parseResumeText = async (fileBuffer, mimeType) => {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(fileBuffer);
    return (data.text || '').trim();
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return (result.value || '').trim();
  }

  throw new Error('Unsupported file type. Use PDF or DOCX.');
};

const ensureDailyLimit = async (userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('daily_usage')
    .select('id, resume_scans_used')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error('Failed to check daily usage');
  }

  if (!existing) {
    const { error: insertError } = await supabaseAdmin
      .from('daily_usage')
      .insert({ user_id: userId, usage_date: today, resume_scans_used: 0 });
    if (insertError) {
      throw new Error('Failed to initialize daily usage');
    }
    return { remaining: DAILY_ATS_LIMIT };
  }

  if ((existing.resume_scans_used || 0) >= DAILY_ATS_LIMIT) {
    throw new Error('Daily ATS limit reached');
  }

  return { usageId: existing.id, current: existing.resume_scans_used };
};

const incrementDailyUsage = async (userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data: row, error } = await supabaseAdmin
    .from('daily_usage')
    .select('resume_scans_used')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .single();
  if (error) return;

  await supabaseAdmin
    .from('daily_usage')
    .update({ resume_scans_used: (row.resume_scans_used || 0) + 1 })
    .eq('user_id', userId)
    .eq('usage_date', today);
};

const runGroqAts = async (jobDescription, resumeText) => {
  if (!groqClient) return null;
  const prompt = `Evaluate the provided resume against the provided job description using a strict, enterprise-grade Applicant Tracking System (ATS) methodology.

Operate as a professional ATS analyst with 10+ years of experience in technical recruiting, resume parsing, and skills gap assessment. Your evaluation should reflect real-world hiring logic used by engineering organizations.

You must analyze:
- Skill and keyword alignment
- Tools, technologies, and platforms match
- Experience relevance and depth
- Presence or absence of mandatory job requirements

Scoring must be purely objective and keyword-driven. Do not infer skills that are not explicitly stated in the resume.

Return the results ONLY in the following JSON format, in the exact order:

{
  "score": <percentage 0-100>,
  "missing_keywords": ["List EVERY required or expected skill, tool, technology, platform, cloud service, methodology, or competency mentioned in the job description that does NOT explicitly appear in the resume. This list must NOT be empty unless score is 100."],
  "suggestions": ["Provide clear, ATS-focused, actionable steps to improve alignment with the job description. Avoid generic or motivational statements."]
}

Compliance Rules:
- Be strict, unbiased, and fully keyword-based.
- Do NOT assume skills; only evaluate what is explicitly written.
- Do NOT leave 'missing_skills' empty unless the resume genuinely matches 100%.
- Output ONLY valid JSON with no explanation or additional text.

`;

  const completion = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}` },
    ],
    temperature: 0.3,
    max_tokens: 400,
  });

  const raw = completion?.choices?.[0]?.message?.content || '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Number(parsed.score) || 0,
      missing_keywords: Array.isArray(parsed.missing_keywords) ? parsed.missing_keywords : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch (err) {
    console.error('⚠️ [ATS] Failed to parse Groq JSON:', err.message, 'raw:', raw);
    return null;
  }
};

export const uploadResume = async (userId, file) => {
  if (!file) {
    throw new Error('File is required');
  }
  if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'].includes(file.mimetype)) {
    throw new Error('Only PDF or DOCX files are allowed');
  }

  await ensureBucket();

  const storageKey = generateResumeKey(userId, file.originalname);
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storageKey, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  let parsedText = '';
  try {
    parsedText = await parseResumeText(file.buffer, file.mimetype);
  } catch (err) {
    console.error('⚠️ [RESUME] Parse failed:', err.message);
  }

  const { data, error } = await supabaseAdmin
    .from('resumes')
    .insert({ user_id: userId, file_path: storageKey, parsed_text: parsedText || null })
    .select('id, file_path, created_at')
    .single();

  if (error) {
    throw new Error(`Failed to save resume: ${error.message}`);
  }

  return data;
};

export const listResumes = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('id, file_path, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch resumes');
  }

  return data || [];
};

const fetchResumeText = async (resume) => {
  if (resume.parsed_text) return resume.parsed_text;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(resume.file_path);
  if (error) {
    throw new Error('Failed to download resume file');
  }
  const buffer = await data.arrayBuffer();
  const lowerPath = resume.file_path.toLowerCase();
  const mimeType = lowerPath.endsWith('.pdf')
    ? 'application/pdf'
    : lowerPath.endsWith('.doc')
    ? 'application/msword'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return parseResumeText(Buffer.from(buffer), mimeType);
};

export const runAtsForResume = async (userId, resumeId, jobDescription) => {
  if (!jobDescription || !jobDescription.trim()) {
    throw new Error('Job description is required');
  }

  // ownership check
  const { data: resume, error: fetchError } = await supabaseAdmin
    .from('resumes')
    .select('id, user_id, file_path, parsed_text, created_at')
    .eq('id', resumeId)
    .single();

  if (fetchError || !resume || resume.user_id !== userId) {
    throw new Error('Resume not found');
  }

  await ensureDailyLimit(userId);

  const resumeText = await fetchResumeText(resume);
  const atsFromGroq = await runGroqAts(jobDescription, resumeText || '');
  const ats = atsFromGroq || runSimpleAts(jobDescription, resumeText || '');

  const { data: result, error } = await supabaseAdmin
    .from('ats_results')
    .insert({
      resume_id: resumeId,
      job_description: jobDescription,
      score: ats.score,
      missing_keywords: ats.missing_keywords,
      suggestions: JSON.stringify(ats.suggestions),
    })
    .select('id, score, missing_keywords, suggestions, created_at')
    .single();

  if (error) {
    throw new Error(`Failed to save ATS result: ${error.message}`);
  }

  await incrementDailyUsage(userId);

  return {
    id: result.id,
    score: result.score,
    missing_keywords: result.missing_keywords || [],
    suggestions: (() => {
      try {
        return JSON.parse(result.suggestions || '[]');
      } catch (err) {
        return [];
      }
    })(),
    created_at: result.created_at,
  };
};

export const deleteResume = async (userId, resumeId) => {
  const { data: resume, error: fetchError } = await supabaseAdmin
    .from('resumes')
    .select('id, user_id, file_path')
    .eq('id', resumeId)
    .single();

  if (fetchError || !resume || resume.user_id !== userId) {
    throw new Error('Resume not found');
  }

  await supabaseAdmin.storage.from(BUCKET).remove([resume.file_path]);

  const { error: deleteError } = await supabaseAdmin
    .from('resumes')
    .delete()
    .eq('id', resumeId);

  if (deleteError) {
    throw new Error('Failed to delete resume');
  }
};

export const getAtsHistory = async (userId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ats_results')
      .select(`
        id,
        score,
        job_description,
        suggestions,
        missing_keywords,
        created_at,
        resume_id,
        resumes:resume_id (id, file_path)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map((result) => ({
      id: result.id,
      score: result.score,
      jobDescription: result.job_description,
      suggestions: (() => {
        try {
          return JSON.parse(result.suggestions || '[]');
        } catch {
          return [];
        }
      })(),
      missingKeywords: result.missing_keywords || [],
      createdAt: result.created_at,
      resumeId: result.resume_id,
      resumeName: result.resumes?.file_path ? `Resume #${result.resume_id}` : `Resume #${result.resume_id}`
    }));
  } catch (error) {
    console.error('Error fetching ATS history:', error);
    throw error;
  }
};
