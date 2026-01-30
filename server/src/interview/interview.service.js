import { GoogleGenAI, Type } from '@google/genai';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '../config/supabase.js';

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

export const generateAiQuestions = async (level, jd, resume) => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const questionCount = level === 'BASIC' ? 5 : level === 'MEDIUM' ? 8 : 10;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview',
    contents: `Generate ${questionCount} interview questions for a ${level} level interview.
    
Job Description: ${jd}
Candidate Resume: ${resume}
Level: ${level}

Return as JSON array with structure: [{ "question": "...", "category": "technical|behavioral|alignment" }]`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ['question', 'category'],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error('Failed to parse questions', e);
    return [];
  }
};

export const evaluateInterview = async (transcript) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  try {
    console.log('[EVAL] Using Groq model: llama-3.3-70b-versatile');
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `You are an interview evaluator. Analyze this interview transcript and provide scores.
        
Transcript:
${transcript}

Provide a JSON response with:
- score: Overall score (0-100)
- technical: Technical skills score (0-100)
- communication: Communication score (0-100)
- alignment: Alignment with role score (0-100)
- suggestions: Array of 3-5 actionable improvement suggestions
- feedback: Overall feedback string
- questionBreakdown: Array of objects with {question, answerSummary, assessment, rating}

Return ONLY valid JSON, no markdown.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content || '{}';
    console.log('[EVAL] Raw response:', text.substring(0, 100));
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.log('[EVAL] Parsing JSON from response...');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw e;
      }
    }
    
    console.log('[EVAL] Success:', result.score);
    
    // Ensure all fields exist
    return {
      score: result.score || 0,
      technical: result.technical || 0,
      communication: result.communication || 0,
      alignment: result.alignment || 0,
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      feedback: result.feedback || 'Evaluation complete',
      questionBreakdown: Array.isArray(result.questionBreakdown) ? result.questionBreakdown : []
    };
  } catch (err) {
    console.error('[EVAL] Groq evaluation failed:', err);
    throw err;
  }
};

export const extractTextFromPdf = async (base64Data) => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        },
        { text: 'Extract all textual information from this resume. Provide only the plain text content without any formatting.' },
      ],
    },
  });

  return response.text || '';
};

export const storeInterviewResult = async (userId, resumeId, level, transcript, result) => {
  try {
    const { error } = await supabaseAdmin.from('interviews').insert({
      user_id: userId,
      resume_id: resumeId,
      level,
      transcript,
      technical_score: result.technical,
      communication_score: result.communication,
      alignment_score: result.alignment,
      overall_score: result.score,
      feedback: result.feedback,
      suggestions: result.suggestions,
      question_breakdown: result.questionBreakdown,
      status: 'completed',
    });

    if (error) {
      console.error('Failed to store interview result:', error);
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.error('Error storing interview result:', err);
    throw err;
  }
};

export const getInterviewHistory = async (userId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching interview history:', err);
    return [];
  }
};

export const getInterviewDetail = async (interviewId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching interview detail:', err);
    return null;
  }
};
