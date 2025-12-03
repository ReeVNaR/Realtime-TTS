'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Volume2, Radio, MessageSquare, Send, Sparkles } from 'lucide-react';
import clsx from 'clsx';

// Define SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Home() {
  // --- State & Refs ---
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [botReply, setBotReply] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [voice, setVoice] = useState('en_us_006');
  const [textInput, setTextInput] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);

  const sessionActiveRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Viz
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationFrameRef = useRef<number>();

  // --- Logic: Speech Recognition ---
  useEffect(() => {
    if (typeof window !== 'undefined' && !recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
          setIsListening(false);
          if (sessionActiveRef.current) startListening();
        };
        recognition.onresult = async (event: any) => {
          const text = event.results[0][0].transcript;
          if (text.trim()) {
            stopAudio();
            setTranscript(text);
            await handleConversation(text);
          }
        };
        recognitionRef.current = recognition;
      }
    }

    initAudioContext();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startListening = () => {
    if (!sessionActiveRef.current) return;
    try {
      recognitionRef.current?.start();
    } catch (e: any) {
      if (e.message && e.message.includes('already started')) return;
      setTimeout(() => { if (sessionActiveRef.current) startListening(); }, 100);
    }
  };

  // --- Logic: Audio Context ---
  const initAudioContext = () => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    } catch (e) { console.error(e); }
  };

  const resumeAudioContext = () => {
    if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
  };

  // --- Logic: Animation Loop (Audio Level) ---
  useEffect(() => {
    const updateVisualizer = () => {
      if (status === 'speaking' && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(avg);
      } else {
        setAudioLevel(prev => Math.max(0, prev - 5));
      }
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    };
    updateVisualizer();
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [status]);






  // --- Logic: Chat & TTS (Same as before) ---
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const ttsQueueRef = useRef<string[]>([]);
  const isFetchingTTSRef = useRef(false);

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    audioQueueRef.current = []; ttsQueueRef.current = [];
    isPlayingRef.current = false; isFetchingTTSRef.current = false;
    setStatus(prev => prev === 'speaking' ? 'idle' : prev);
  };

  const processTTSQueue = async () => {
    if (isFetchingTTSRef.current || ttsQueueRef.current.length === 0) return;
    isFetchingTTSRef.current = true;
    const text = ttsQueueRef.current.shift();
    if (text) {
      try {
        const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice }) });
        if (res.ok) {
          const blob = await res.blob();
          audioQueueRef.current.push(URL.createObjectURL(blob));
          playNextAudio();
        }
      } catch (e) { console.error(e); }
    }
    isFetchingTTSRef.current = false;
    processTTSQueue();
  };

  const playNextAudio = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    const audioUrl = audioQueueRef.current.shift();
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = 1.25;
      setStatus('speaking');
      audioRef.current.play();
      audioRef.current.onended = () => {
        isPlayingRef.current = false;
        playNextAudio();
        if (audioQueueRef.current.length === 0 && ttsQueueRef.current.length === 0 && !isFetchingTTSRef.current) {
          setStatus(isSessionActive ? 'listening' : 'idle');
          if (isSessionActive) startListening();
        }
      };
    }
  };

  const handleConversation = async (userText: string) => {
    setStatus('thinking'); setBotReply(''); stopAudio();
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userText }) });
      if (!response.ok) throw new Error('API failed');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false; let sentenceBuffer = '';
      while (!done && reader) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          sentenceBuffer += chunk;
          setBotReply(prev => prev + chunk);
          const match = sentenceBuffer.match(/([^\.!\?]+[\.!\?]+)(\s+|$)/);
          if (match) {
            const s = match[1].trim();
            if (s) { ttsQueueRef.current.push(s); processTTSQueue(); }
            sentenceBuffer = sentenceBuffer.substring(match[0].length);
          }
        }
      }
      if (sentenceBuffer.trim()) { ttsQueueRef.current.push(sentenceBuffer.trim()); processTTSQueue(); }
    } catch (error: any) { setStatus('idle'); setBotReply(`Error: ${error.message}`); }
  };

  const toggleListening = () => {
    resumeAudioContext();
    if (isSessionActive) {
      setIsSessionActive(false); sessionActiveRef.current = false;
      recognitionRef.current?.stop(); stopAudio();
      setStatus('idle');
    } else {
      setIsSessionActive(true); sessionActiveRef.current = true;
      setTranscript(''); setBotReply('');
      try { recognitionRef.current?.start(); } catch (e) { console.error(e); }
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || (status !== 'idle' && !isSessionActive)) return;
    const msg = textInput.trim();
    setTextInput(''); setTranscript(msg);
    await handleConversation(msg);
  };

  return (
    <main className="min-h-screen bg-[#020205] text-white overflow-hidden relative font-sans flex flex-col">

      {/* Tailwind Background Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h1 className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
            AETHER
          </h1>
        </div>
        <div className="flex items-center space-x-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
          <Radio className="w-3 h-3 text-purple-400" />
          <select value={voice} onChange={(e) => setVoice(e.target.value)} className="bg-transparent text-xs text-gray-300 focus:outline-none uppercase">
            <option value="en_us_001">TikTok Lady</option>
            <option value="en_us_006">Male Voice</option>
            <option value="en_us_ghostface">Ghostface</option>
            <option value="en_us_chewbacca">Chewbacca</option>
            <option value="en_us_c3po">C3PO</option>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-4">

        {/* Central Reactive Core (SVG) */}
        <div className="relative mb-16 cursor-pointer group" onClick={toggleListening}>
          <div className="relative w-[200px] h-[200px] flex items-center justify-center">
            {/* Outer Rings */}
            <div className={clsx(
              "absolute inset-0 rounded-full border border-purple-900/50 transition-all duration-500",
              status === 'listening' && "animate-pulse-ring opacity-50",
              status === 'thinking' && "animate-spin border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent opacity-80",
              status === 'idle' && "scale-100 opacity-30"
            )} />

            <div className={clsx(
              "absolute inset-4 rounded-full border border-dashed border-purple-500/30 transition-all duration-500",
              status === 'thinking' && "animate-spin direction-reverse duration-[3000ms]",
              status === 'listening' && "scale-110 opacity-60"
            )} />

            {/* Inner Core */}
            <div className={clsx(
              "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(139,92,246,0.3)]",
              isSessionActive ? "bg-purple-600" : "bg-gray-800",
              status === 'speaking' && "animate-speak-bounce bg-pink-500 shadow-[0_0_50px_rgba(236,72,153,0.6)]"
            )}>
              {status === 'listening' ? <Mic className="w-8 h-8 text-white" /> :
                status === 'thinking' ? <Loader2 className="w-8 h-8 text-white animate-spin" /> :
                  status === 'speaking' ? <Volume2 className="w-8 h-8 text-white" /> :
                    <Mic className="w-8 h-8 text-white/50" />}
            </div>
          </div>

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs font-mono text-purple-300/70 tracking-[0.3em] uppercase">
              {status === 'idle' && !isSessionActive ? 'Initialize' : status}
            </span>
          </div>
        </div>

        {/* Text Display */}
        <div className="w-full max-w-2xl text-center min-h-[120px] flex flex-col justify-center space-y-4">
          {transcript && (
            <p className="text-xl md:text-3xl font-light text-white/80 leading-tight tracking-tight">
              "{transcript}"
            </p>
          )}
          {botReply && (
            <div key={botReply} className="text-lg md:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-blue-200 leading-relaxed animate-fade-in-up">
              {botReply}
            </div>
          )}
        </div>

      </div>

      {/* Footer Input */}
      <div className="relative z-10 p-6 w-full max-w-xl mx-auto">
        <form onSubmit={handleTextSubmit} className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full opacity-20 blur-md"></div>
          <div className="relative flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl">
            <MessageSquare className="w-4 h-4 text-gray-500 mr-4" />
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Transmit message..."
              disabled={status !== 'idle' && !isSessionActive}
              className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm font-mono"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="ml-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>
      </div>

      <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />
    </main>
  );
}
