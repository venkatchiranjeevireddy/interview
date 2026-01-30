import React, { useState, useEffect } from 'react';
import { DifficultyCard } from './DifficultyCard.jsx';
import { InterviewSession } from './InterviewSession.jsx';
import { interviewApi } from '../../services/interview.js';
import { resumeApi } from '../../api.js';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';

const LEVEL_CONFIG = {
  BASIC: {
    title: 'Level 1: Fundamentals',
    description: 'Core concepts, resume verification, and cultural fit.',
    minScore: 0,
    unlockScore: 60,
    color: 'emerald',
    durationMinutes: 15
  },
  MEDIUM: {
    title: 'Level 2: Core Competency',
    description: 'Technical scenarios, problem-solving, and role-specific skills.',
    minScore: 60,
    unlockScore: 60,
    color: 'blue',
    durationMinutes: 30
  },
  HARD: {
    title: 'Level 3: Mastery',
    description: 'Deep architectural discussions, edge cases, and leadership.',
    minScore: 60,
    unlockScore: 100,
    color: 'purple',
    durationMinutes: 45
  }
};

export const Interview = ({ resumeId, resume, jd, token, onBack }) => {
  const [step, setStep] = useState('setup');
  const [state, setState] = useState({
    resume: resume || '',
    jd: jd || '',
    currentLevel: null,
    scores: {
      BASIC: null,
      MEDIUM: null,
      HARD: null,
    }
  });
  
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [jdInput, setJdInput] = useState(jd || '');
  const [resumeInput, setResumeInput] = useState(resume || '');
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(resumeId || '');

  // Load existing resumes
  useEffect(() => {
    const loadResumes = async () => {
      try {
        const res = await resumeApi.list(token);
        setResumes(res.resumes || []);
      } catch (err) {
        console.error('Failed to load resumes:', err);
      }
    };
    if (token) loadResumes();
  }, [token]);

  const handleResumeUpload = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setIsProcessing(true);
    try {
      const uploaded = await resumeApi.upload(token, uploadedFile);
      setResumes(prev => [uploaded, ...prev]);
      setSelectedResumeId(String(uploaded.id));
      setResumeInput(uploaded.file_content || '');
    } catch (err) {
      alert('Failed to upload resume: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectResume = (resumeData) => {
    console.log('Selected resume:', resumeData);
    setSelectedResumeId(String(resumeData.id));
    // Use file_content or a placeholder if it doesn't exist
    const content = resumeData.file_content || resumeData.extracted_text || 'Resume selected';
    setResumeInput(content);
    console.log('Resume content set:', content ? 'Yes' : 'No');
  };

  const handleStartInterview = (level) => {
    if (!jdInput.trim()) {
      alert('Please enter the job description');
      return;
    }
    if (!selectedResumeId) {
      alert('Please select or upload a resume');
      return;
    }
    if (!resumeInput.trim()) {
      alert('Please provide a resume (upload or paste)');
      return;
    }
    setState(prev => ({ 
      ...prev, 
      currentLevel: level,
      jd: jdInput,
      resume: resumeInput
    }));
    setStep('interview');
  };

  const handleInterviewComplete = async (transcript) => {
    setStep('result');
    setLastTranscript(transcript);
    setIsEvaluating(true);
    setEvalError('');
    
    try {
      const evalResponse = await interviewApi.evaluateInterview(
        selectedResumeId || 'temp', 
        transcript, 
        token
      );
      
      const result = evalResponse.result;
      setLastResult(result);
      setState(prev => ({
        ...prev,
        scores: { ...prev.scores, [prev.currentLevel]: result }
      }));

      // Store result if we have a resume ID
      if (selectedResumeId) {
        await interviewApi.storeResult(
          selectedResumeId,
          state.currentLevel,
          transcript,
          result,
          token
        );
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      setEvalError('Evaluation failed. Showing transcript and a basic summary.');
      const fallbackResult = {
        score: 0,
        technical: 0,
        communication: 0,
        alignment: 0,
        suggestions: ['Evaluation failed. Please try again later.'],
        feedback: 'We could not generate a full evaluation for this interview.',
        questionBreakdown: []
      };
      setLastResult(fallbackResult);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getAggregatedData = () => {
    if (!lastResult) return [
      { subject: 'Technical', A: 0 },
      { subject: 'Comm.', A: 0 },
      { subject: 'Alignment', A: 0 }
    ];
    return [
      { subject: 'Technical', A: lastResult.technical },
      { subject: 'Comm.', A: lastResult.communication },
      { subject: 'Alignment', A: lastResult.alignment },
    ];
  };

  if (step === 'interview' && state.currentLevel) {
    return (
      <InterviewSession
        level={state.currentLevel}
        jd={state.jd}
        resume={state.resume}
        onComplete={handleInterviewComplete}
        onCancel={() => setStep('setup')}
      />
    );
  }

  if (step === 'result') {
    return (
      <div className="max-w-6xl mx-auto glass-morphism p-12 rounded-[2.5rem]">
        {isEvaluating ? (
          <div className="flex flex-col items-center py-24">
            <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-10"></div>
            <h2 className="text-4xl font-black mb-4">Generating Assessment</h2>
            <p className="text-gray-400 text-lg">The AI is reviewing your transcript...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              {evalError && (
                <div className="mb-6 p-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 text-orange-300 text-sm font-semibold">
                  {evalError}
                </div>
              )}
              <div className="flex items-center gap-4 mb-8">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${lastResult?.score >= 80 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {lastResult?.score >= 80 ? 'Qualified' : 'Requires Improvement'}
                </span>
                <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Level: {state.currentLevel}</span>
              </div>
              
              <h2 className="text-5xl font-black mb-8 tracking-tight">Interview <span className="text-blue-500">Report</span></h2>
              
              <div className="space-y-12">
                <section>
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Overall Feedback</h4>
                  <p className="text-gray-300 text-lg leading-relaxed">{lastResult?.feedback}</p>
                </section>

                {lastResult?.questionBreakdown && lastResult.questionBreakdown.length > 0 && (
                  <section>
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Question & Answer Performance</h4>
                    <div className="space-y-6">
                      {lastResult.questionBreakdown.map((item, idx) => (
                        <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <h5 className="text-sm font-black text-blue-400 uppercase tracking-tight pr-4">Q: {item.question}</h5>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${item.rating >= 80 ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-orange-500 border-orange-500/20 bg-orange-500/5'}`}>
                              {Math.round(item.rating)}%
                            </span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <span className="text-[10px] font-bold text-gray-600 uppercase mb-1 block">Your Answer Summary</span>
                              <p className="text-xs text-gray-400 italic leading-relaxed">{item.answerSummary}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-600 uppercase mb-1 block">AI Assessment</span>
                              <p className="text-xs text-gray-300 leading-relaxed">{item.assessment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {lastResult?.suggestions && lastResult.suggestions.length > 0 && (
                  <section>
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Actionable Feedback</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {lastResult.suggestions.map((s, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex-shrink-0 flex items-center justify-center text-blue-500 text-sm font-black">{i+1}</div>
                          <p className="text-sm text-gray-400 leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="glass-morphism p-8 rounded-[2rem] text-center border-blue-500/20 bg-blue-500/5 sticky top-8">
                <div className="relative w-48 h-48 mx-auto mb-8">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="42%" fill="none" stroke="#ffffff08" strokeWidth="14" />
                    <circle cx="50%" cy="50%" r="42%" fill="none" stroke="#3b82f6" strokeWidth="14" strokeDasharray={`${lastResult?.score} 100`} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black block leading-none">{Math.round(lastResult?.score)}</span>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Total Score</span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-8 text-left px-2">
                  <div className="p-3 rounded-xl bg-black/30 border border-blue-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Technical</span>
                      <span className="text-sm font-black text-blue-400">{Math.round(lastResult?.technical)}%</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-purple-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Communication</span>
                      <span className="text-sm font-black text-purple-400">{Math.round(lastResult?.communication)}%</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-emerald-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Alignment</span>
                      <span className="text-sm font-black text-emerald-400">{Math.round(lastResult?.alignment)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button onClick={() => setStep('setup')} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-all font-black">Back to Setup</button>
                  <button onClick={onBack} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black text-gray-400">Dashboard</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Setup/Configuration Step
  return (
    <div className="max-w-5xl mx-auto glass-morphism p-12 rounded-3xl">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-black mb-4 tracking-tight">Interview <span className="text-blue-500">Prep</span></h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">Prepare for your interviews with AI-powered practice sessions tailored to your resume.</p>
      </div>
      
      <div className="space-y-8 mb-12">
        {/* Main Job Description Section - EXTRA LARGE */}
        <div className="flex flex-col">
          <div className="mb-4">
            <label className="text-sm font-black text-white uppercase tracking-widest mb-2 block">📋 Job Description</label>
            <p className="text-xs text-gray-400 leading-relaxed">Paste the complete job description, requirements, and qualifications. This helps the AI understand the role and ask relevant technical and cultural fit questions.</p>
          </div>
          <textarea 
            value={jdInput}
            onChange={(e) => setJdInput(e.target.value)}
            placeholder="Paste the full job description here. Include: Job Title, Requirements, Responsibilities, Skills Needed, Experience Level, etc."
            style={{
              width: '100%',
              height: '500px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '2rem',
              fontSize: '0.875rem',
              color: 'rgb(209, 213, 219)',
              resize: 'none',
              lineHeight: '1.625'
            }}
          />
          <p className="text-[10px] text-gray-600 mt-2">💡 Tip: The more detail you provide, the better the AI can tailor the interview questions</p>
        </div>

        {/* Resume Section - COMPACT */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div>
            <div className="mb-3">
              <label className="text-sm font-black text-white uppercase tracking-widest mb-2 block">📄 Upload Resume</label>
              <p className="text-xs text-gray-400">Click to upload your resume in PDF or DOCX format</p>
            </div>
            <div className={`rounded-2xl border-2 border-dashed transition-all p-6 flex flex-col items-center justify-center ${resumeInput ? 'bg-emerald-500/5 border-emerald-500/40' : 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/3'}`}>
              <input 
                type="file" 
                onChange={handleResumeUpload} 
                accept=".pdf,.doc,.docx" 
                className="hidden" 
                id="resume-upload" 
                disabled={isProcessing} 
              />
              <label htmlFor="resume-upload" className="cursor-pointer text-center w-full">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-blue-400">Uploading...</span>
                  </div>
                ) : resumeInput ? (
                  <div>
                    <svg style={{width: '24px', height: '24px', margin: '0 auto 0.5rem', color: 'rgb(52, 211, 153)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span style={{fontSize: '0.875rem', fontWeight: '700', color: 'rgb(52, 211, 153)', display: 'block'}}>✓ Resume Loaded</span>
                    <span style={{fontSize: '0.625rem', color: 'rgb(107, 114, 128)', display: 'block', marginTop: '0.25rem'}}>Click to change</span>
                  </div>
                ) : (
                  <div>
                    <svg style={{width: '32px', height: '32px', margin: '0 auto 0.5rem', color: 'rgb(107, 114, 128)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    <span style={{fontSize: '0.875rem', fontWeight: '700', color: 'rgb(209, 213, 219)', display: 'block'}}>Click to Upload</span>
                    <span style={{fontSize: '0.625rem', color: 'rgb(107, 114, 128)'}}>PDF or DOCX</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Resume Selection */}
          <div>
            {resumes.length > 0 && (
              <div>
                <div className="mb-4">
                  <label className="text-sm font-black text-white uppercase tracking-widest mb-2 block">💾 Or Select Previous</label>
                  <p className="text-xs text-gray-400">Choose from your saved resumes</p>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  {resumes.map(r => {
                    const isSelected = String(selectedResumeId) === String(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleSelectResume(r)}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          textAlign: 'left',
                          border: isSelected ? '2px solid rgb(59, 130, 246)' : '2px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: isSelected ? 'rgb(37, 99, 235)' : 'rgba(255, 255, 255, 0.05)',
                          color: isSelected ? 'white' : 'rgb(209, 213, 219)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }
                        }}
                      >
                        {isSelected && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            display: 'inline-block',
                            boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)'
                          }}></span>
                        )}
                        <span style={{fontSize: '1rem'}}>📋</span>
                        <span>Resume #{r.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {resumes.length === 0 && (
              <div className="h-full rounded-2xl bg-white/3 border border-white/5 p-6 flex items-center justify-center text-center">
                <p className="text-sm text-gray-500">No previous resumes found. Upload one to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-black mb-6 text-white">Select Interview Difficulty</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(LEVEL_CONFIG).map(level => (
            <DifficultyCard
              key={level}
              level={level}
              isActive={state.currentLevel === level}
              isLocked={
                level === 'MEDIUM' ? !state.scores.BASIC || state.scores.BASIC.score < 80 : 
                level === 'HARD' ? !state.scores.MEDIUM || state.scores.MEDIUM.score < 80 : 
                false
              }
              score={state.scores[level]?.score}
              onSelect={() => handleStartInterview(level)}
              config={LEVEL_CONFIG[level]}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-bold"
        >
          Back to Dashboard
        </button>
        <button 
          onClick={() => {
            if (!jdInput.trim() || !resumeInput.trim()) {
              alert('Please enter job description and provide a resume');
              return;
            }
          }}
          disabled
          className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-600 font-bold cursor-not-allowed"
        >
          Select a Difficulty Above
        </button>
      </div>
    </div>
  );
};
