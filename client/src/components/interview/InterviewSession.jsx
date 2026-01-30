import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createPcmBlob } from '../../services/audio.js';

const LEVEL_CONFIG = {
  BASIC: { durationMinutes: 15 },
  MEDIUM: { durationMinutes: 30 },
  HARD: { durationMinutes: 45 }
};

const SYSTEM_PROMPT = (level, jd, resume) => {
  const duration = LEVEL_CONFIG[level].durationMinutes;
  return `
You are a world-class senior interviewer. You are conducting a voice interview.

CONTEXT:
Job Description: ${jd}
Candidate Resume: ${resume}
Current Round: ${level}
STRICT TIME LIMIT: ${duration} minutes.

YOUR GOAL:
Conduct a natural, communicative, and professional interview. 
- Pace yourself! This is a ${duration}-minute session. 
- Spread your questions out to cover the background, technical skills, and behavioral aspects within this timeframe.
- Refer to specific points in their resume and compare them to the JD.
- BASIC: Focus on background, core skills, and "Why this role?".
- MEDIUM: Deep dive into technical tools mentioned in the JD. Ask "How would you handle..." scenarios.
- HARD: Challenge their architectural decisions and leadership approach.

BEHAVIOR:
1. Introduce yourself briefly and start with a welcoming question.
2. Ask only ONE question at a time.
3. Listen carefully. If the user's answer is short, ask for more detail before moving on.
4. Aim to wrap up naturally as the ${duration}-minute mark approaches.
5. When finished (or if the user asks to end), say: "Thank you for your time. I am now generating your evaluation. Please wait a moment." 
6. Do NOT mention scores or numbers during the conversation.
`;
};

export const InterviewSession = ({ level, jd, resume, onComplete, onCancel }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [history, setHistory] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const durationInSeconds = LEVEL_CONFIG[level].durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(durationInSeconds);
  const timerRef = useRef(null);

  const audioContextRef = useRef(null);
  const outputAudioContextRef = useRef(null);
  const sessionRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set());
  const isEndingRef = useRef(false);
  
  const currentAiPart = useRef('');
  const currentUserPart = useRef('');

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const handleEndInterview = useCallback(() => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.error('Error closing session:', e);
      }
    }
    stopAllAudio();
    if (timerRef.current) clearInterval(timerRef.current);
    
    const pending = [];
    if (currentUserPart.current.trim()) {
      pending.push({ role: 'User', text: currentUserPart.current.trim() });
      currentUserPart.current = '';
    }
    if (currentAiPart.current.trim()) {
      pending.push({ role: 'AI', text: currentAiPart.current.trim() });
      currentAiPart.current = '';
    }
    const finalTranscript = [...history, ...pending].map(h => `${h.role}: ${h.text}`).join('\n');
    console.log('Ending interview with transcript:', finalTranscript);
    onComplete(finalTranscript);
  }, [history, onComplete, stopAllAudio]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleEndInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, handleEndInterview]);

  const handleStartInterview = async () => {
    setIsConnecting(true);
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    console.log('🎤 Starting interview with API key:', apiKey ? 'Present' : 'MISSING');
    const ai = new GoogleGenAI({ apiKey });

    try {
      const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      console.log('🎧 Audio contexts created');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 Microphone access granted');
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('✅ Live session connected');
            setIsActive(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session) => {
                try {
                  session.sendRealtimeInput({ media: pcmBlob });
                } catch (err) {
                  console.error('❌ Error sending audio:', err);
                }
              }).catch(err => console.error('❌ Session promise error:', err));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            console.log('🎙️ Audio input pipeline started');
          },
          onmessage: async (message) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsAiThinking(false);
              setIsAiSpeaking(true);
              const ctx = outputCtx;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsAiSpeaking(false);
                }
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.outputTranscription) {
               currentAiPart.current += message.serverContent.outputTranscription.text;
            } 
            else if (message.serverContent?.inputTranscription) {
               setIsAiThinking(true);
               setIsAiSpeaking(false);
               currentUserPart.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
               const updates = [];
               if (currentUserPart.current.trim()) {
                  updates.push({ role: 'User', text: currentUserPart.current.trim() });
                  currentUserPart.current = '';
               }
               if (currentAiPart.current.trim()) {
                  updates.push({ role: 'AI', text: currentAiPart.current.trim() });
                  currentAiPart.current = '';
               }
               if (updates.length > 0) {
                 setHistory(prev => [...prev, ...updates]);
               }
            }

            if (message.serverContent?.interrupted) {
              stopAllAudio();
              currentAiPart.current = ''; 
            }
          },
          onerror: (e) => {
            console.error('❌ WebSocket error:', e);
            if (!isEndingRef.current) {
              alert('❌ Connection error: ' + (e?.message || 'Unknown error'));
            }
          },
          onclose: () => {
            console.log('Connection closed');
            if (!isEndingRef.current) {
              console.warn('❌ Connection closed unexpectedly');
              alert('Interview connection lost. Your progress has been saved.');
              handleEndInterview();
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: SYSTEM_PROMPT(level, jd, resume),
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          turnDetectionConfig: {
            type: 'END_OF_SPEECH_DETECTION',
            speechEndThresholdMs: 4000
          }
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      alert('Failed to start interview: ' + err.message);
      setIsConnecting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeLeft / durationInSeconds) * 100;
  const timerColor = timeLeft < 60 ? 'text-red-500' : timeLeft < 300 ? 'text-orange-400' : 'text-blue-400';

  return (
    <div className="w-full">
      {!isActive && !isConnecting ? (
        <div className="max-w-4xl mx-auto glass-morphism p-12 rounded-3xl text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-blue-600/20 rounded-3xl flex items-center justify-center mb-8 mx-auto ring-1 ring-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </div>
          <h2 className="text-4xl font-black mb-4 uppercase">Round {level}</h2>
          <p className="text-gray-400 max-w-md mb-4 text-lg mx-auto">
            This is a natural voice interview. Please respond clearly and thoughtfully.
          </p>
          <div className="mb-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-gray-500">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             Duration: {LEVEL_CONFIG[level].durationMinutes} Minutes
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button onClick={onCancel} className="px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-bold text-center">Back to Setup</button>
            <button onClick={handleStartInterview} className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-all font-bold text-center">Start Interview</button>
          </div>
        </div>
      ) : isConnecting ? (
        <div className="max-w-4xl mx-auto glass-morphism p-12 rounded-3xl text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to interview...</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto glass-morphism p-8 rounded-3xl">
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold">Interview in Progress</h3>
              {isAiSpeaking && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                  <div className="flex gap-1">
                    <span className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></span>
                    <span className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '150ms'}}></span>
                    <span className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '300ms'}}></span>
                  </div>
                  <span className="text-xs font-bold text-blue-400">AI Speaking...</span>
                </div>
              )}
            </div>
            <div className={`text-3xl font-bold ${timerColor}`}>{formatTime(timeLeft)}</div>
          </div>
          
          <div className="w-full bg-black/30 rounded-2xl p-6 mb-6 h-80 overflow-y-auto border border-white/10">
            {history.length === 0 ? (
              <p className="text-gray-500 text-center mt-20">Listening for interview to start...</p>
            ) : (
              history.map((entry, idx) => (
                <div key={idx} className="mb-4">
                  <span className={`font-bold text-sm ${entry.role === 'AI' ? 'text-blue-400' : 'text-green-400'}`}>
                    {entry.role === 'AI' ? '🤖 AI' : '👤 You'}:
                  </span>
                  <p className="text-gray-300 mt-1 text-sm">{entry.text}</p>
                </div>
              ))
            )}
            {isAiThinking && <p className="text-yellow-400 animate-pulse text-sm">⏳ AI is thinking...</p>}
          </div>

          <div className="w-full bg-blue-500/20 rounded-full h-3 overflow-hidden mb-6 border border-blue-500/30">
            <div 
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onCancel} className="px-8 py-4 rounded-2xl border border-red-500/30 hover:bg-red-500/10 transition-all font-bold">Exit Interview</button>
            <button onClick={handleEndInterview} className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 transition-all font-bold">Finish Interview</button>
          </div>
        </div>
      )}
    </div>
  );
};
