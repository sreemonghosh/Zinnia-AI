import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, MicOff, Volume2, VolumeX, PhoneOff, Settings2, ChevronDown, Sparkles } from 'lucide-react';
import { cn, getTemporalContext } from '../lib/utils';

interface LiveModeProps {
  isOpen: boolean;
  onClose: (transcript?: { role: 'user' | 'assistant', text: string }[]) => void;
}

const VOICES = [
  { id: 'Zephyr', name: 'Zephyr (Warm)', desc: 'Friendly, natural & engaging' },
  { id: 'Puck', name: 'Puck (Playful)', desc: 'Energetic, bright & lively' },
  { id: 'Charon', name: 'Charon (Deep)', desc: 'Calm, thoughtful & steady' },
  { id: 'Kore', name: 'Kore (Clear)', desc: 'Polished, clear & articulate' },
  { id: 'Fenrir', name: 'Fenrir (Crisp)', desc: 'Confident, sharp & resonant' },
];

export function LiveMode({ isOpen, onClose }: LiveModeProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [volume, setVolume] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [fullTranscript, setFullTranscript] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // References
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const greetingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const isSessionActiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isMutedRef = useRef(false);
  const isSpeakerMutedRef = useRef(false);
  const transcriptRef = useRef<{ role: 'user' | 'assistant', text: string }[]>([]);
  const hasGreetedRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const voicePickerRef = useRef<HTMLDivElement | null>(null);

  // Convert base64 audio to Blob URL for faster browser decoding and clean memory revocation
  const base64ToBlobUrl = useCallback((base64: string, mimeType = 'audio/wav'): string => {
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (e) {
      return `data:${mimeType};base64,${base64}`;
    }
  }, []);

  // Close voice picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (voicePickerRef.current && !voicePickerRef.current.contains(event.target as Node)) {
        setShowVoicePicker(false);
      }
    }
    if (showVoicePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVoicePicker]);

  // Keep refs synchronized
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
    if (isSpeakerMuted) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isSpeakerMuted]);

  useEffect(() => {
    transcriptRef.current = fullTranscript;
  }, [fullTranscript]);

  // Call timer
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to speak via client speech synthesis if TTS audio can't be played or as instant zero-delay fallback
  const fallbackSpeech = useCallback((text: string, onEnd?: () => void) => {
    if (!isSessionActiveRef.current || !('speechSynthesis' in window) || isSpeakerMutedRef.current) {
      if (isSessionActiveRef.current) onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`~]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.08;
      utterance.pitch = 1.0;

      // Pick high-quality natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        if (!isSessionActiveRef.current) {
          window.speechSynthesis.cancel();
          return;
        }
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        setIsThinking(false);
        setIsListening(false);
      };

      utterance.onend = () => {
        if (!isSessionActiveRef.current) return;
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        onEnd?.();
      };

      utterance.onerror = () => {
        if (!isSessionActiveRef.current) return;
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (isSessionActiveRef.current) onEnd?.();
    }
  }, []);

  // Resume microphone listening after AI finishes speaking
  const resumeListening = useCallback(() => {
    if (!isSessionActiveRef.current || isMutedRef.current) return;
    setIsThinking(false);
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    isProcessingRef.current = false;
    setIsListening(true);

    if (recognitionRef.current && isSessionActiveRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Recognition might already be running
      }
    }
  }, []);

  // Play voice response (WAV from Gemini TTS or fallback)
  const playVoiceResponse = useCallback((text: string, audioBase64?: string | null) => {
    if (!isSessionActiveRef.current) return;

    // If user muted speaker, don't output audio
    if (isSpeakerMutedRef.current) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setIsThinking(false);
      resumeListening();
      return;
    }

    // Stop previous audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
        currentAudioRef.current.onplay = null;
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if (currentAudioUrlRef.current) {
      try { URL.revokeObjectURL(currentAudioUrlRef.current); } catch (e) {}
      currentAudioUrlRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (audioBase64) {
      try {
        const audioUrl = base64ToBlobUrl(audioBase64, 'audio/wav');
        currentAudioUrlRef.current = audioUrl;
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onplay = () => {
          if (!isSessionActiveRef.current) {
            audio.pause();
            return;
          }
          setIsSpeaking(true);
          isSpeakingRef.current = true;
          setIsThinking(false);
          setIsListening(false);
        };

        audio.onended = () => {
          if (currentAudioUrlRef.current) {
            try { URL.revokeObjectURL(currentAudioUrlRef.current); } catch (e) {}
            currentAudioUrlRef.current = null;
          }
          currentAudioRef.current = null;
          if (!isSessionActiveRef.current) return;
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          resumeListening();
        };

        audio.onerror = (e) => {
          if (currentAudioUrlRef.current) {
            try { URL.revokeObjectURL(currentAudioUrlRef.current); } catch (e) {}
            currentAudioUrlRef.current = null;
          }
          currentAudioRef.current = null;
          if (!isSessionActiveRef.current) return;
          console.warn("WAV playback error, using instant browser speech synthesis:", e);
          fallbackSpeech(text, () => resumeListening());
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (!isSessionActiveRef.current) return;
            console.warn("Audio autoplay blocked or interrupted:", err);
            fallbackSpeech(text, () => resumeListening());
          });
        }
      } catch (err) {
        if (!isSessionActiveRef.current) return;
        console.warn("Audio init failed:", err);
        fallbackSpeech(text, () => resumeListening());
      }
    } else {
      fallbackSpeech(text, () => resumeListening());
    }
  }, [base64ToBlobUrl, fallbackSpeech, resumeListening]);

  // Send turn to server and get real voice reply
  const sendLiveVoiceTurn = useCallback(async (userSpeech: string) => {
    if (!isSessionActiveRef.current || !userSpeech || !userSpeech.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsThinking(true);
    setIsListening(false);

    // Stop recognition while processing to avoid hearing itself
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const currentMessage = userSpeech.trim();
    setTranscription(`You: ${currentMessage}`);
    
    // Add to ongoing transcript
    const updatedHistory = [...transcriptRef.current, { role: 'user' as const, text: currentMessage }];
    setFullTranscript(updatedHistory);

    // Cancel any previous in-flight turn request
    if (activeAbortControllerRef.current) {
      try { activeAbortControllerRef.current.abort(); } catch (e) {}
    }
    const abortCtrl = new AbortController();
    activeAbortControllerRef.current = abortCtrl;

    try {
      setError(null);
      const res = await fetch("/api/ai/live-turn", {
        method: "POST",
        signal: abortCtrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentMessage,
          voice: selectedVoice,
          history: updatedHistory.slice(-6),
          userContext: getTemporalContext()
        })
      });

      // User may have hung up while turn request was in-flight
      if (!isSessionActiveRef.current) return;

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        let rawError = errData.error || `Server responded with ${res.status}`;
        if (typeof rawError === 'string' && (rawError.includes('{') || rawError.includes('API_KEY') || rawError.includes('API key'))) {
          rawError = "Connecting voice stream...";
        }
        throw new Error(rawError);
      }

      const data = await res.json();
      if (!isSessionActiveRef.current) return;

      const replyText = data.text || "I heard you!";
      
      // Update transcript with assistant reply
      setFullTranscript(prev => [...prev, { role: 'assistant', text: replyText }]);
      setTranscription(replyText);

      // Speak back out loud in LIVE VOICE!
      playVoiceResponse(replyText, data.audio);
    } catch (err: any) {
      if (!isSessionActiveRef.current || err?.name === 'AbortError') {
        return; // Session ended or request was cancelled; exit cleanly
      }
      console.warn("Live voice turn notice:", err?.message || err);
      const fallbackMsg = "I'm right here with you! Could you say that once more?";
      setTranscription(fallbackMsg);
      let cleanErr = err?.message || "";
      if (typeof cleanErr === 'string' && (cleanErr.includes('{') || cleanErr.includes('API key') || cleanErr.includes('API_KEY') || cleanErr.includes('INVALID_ARGUMENT'))) {
        cleanErr = "";
      }
      if (cleanErr) setError(cleanErr);
      fallbackSpeech(fallbackMsg, () => resumeListening());
    } finally {
      if (activeAbortControllerRef.current === abortCtrl) {
        activeAbortControllerRef.current = null;
      }
    }
  }, [selectedVoice, playVoiceResponse, fallbackSpeech, resumeListening]);

  // Setup Web Audio Volume Analysis
  const setupAudioMetering = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!isSessionActiveRef.current || !audioContextRef.current || isMutedRef.current) {
          setVolume(0);
          if (isSessionActiveRef.current) {
            animFrameRef.current = requestAnimationFrame(checkVolume);
          }
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength / 255;
        setVolume(avg);

        if (isSessionActiveRef.current) {
          animFrameRef.current = requestAnimationFrame(checkVolume);
        }
      };

      checkVolume();
    } catch (e) {
      console.warn("Audio metering not supported:", e);
    }
  }, []);

  // Setup Speech Recognition with adaptive low-latency turn taking
  const setupSpeechRecognition = useCallback(() => {
    if (!isSessionActiveRef.current) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // Abort and clear any prior recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let accumulatedSpeech = '';

    recognition.onresult = (event: any) => {
      if (!isSessionActiveRef.current || isSpeakingRef.current || isProcessingRef.current || isMutedRef.current) {
        return;
      }

      let interim = '';
      let hasFinal = false;
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedSpeech += ' ' + transcriptPart;
          hasFinal = true;
        } else {
          interim += transcriptPart;
        }
      }

      const activeText = (accumulatedSpeech + ' ' + interim).trim();
      if (activeText) {
        setTranscription(`You: ${activeText}`);
        setIsListening(true);

        // Reset debounce timer on speech activity
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // Fast adaptive turn-taking latency:
        // When user reaches final punctuation/clause, trigger reply in 420ms.
        // For interim streaming speech, wait 600ms.
        const silenceDelay = hasFinal ? 420 : 600;

        silenceTimeoutRef.current = setTimeout(() => {
          if (isSessionActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current && activeText.length > 1) {
            const finalQuery = activeText;
            accumulatedSpeech = '';
            sendLiveVoiceTurn(finalQuery);
          }
        }, silenceDelay);
      }
    };

    recognition.onerror = (e: any) => {
      if (!isSessionActiveRef.current) return;
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn("Speech recognition event:", e.error);
      }
    };

    recognition.onend = () => {
      // Strictly verify session is still active before auto-restarting
      if (isSessionActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current && !isMutedRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.warn("Could not start recognition immediately:", e);
    }
  }, [sendLiveVoiceTurn]);

  // Initial greeting from Zinnia
  const triggerInitialGreeting = useCallback(async () => {
    if (!isSessionActiveRef.current || hasGreetedRef.current) return;
    hasGreetedRef.current = true;

    const greetings = [
      "Hey there! I'm Zinnia. What's on your mind today?",
      "Hello! Zinnia here. How can I help you right now?",
      "Hi! I'm ready to talk. What would you like to explore?"
    ];
    const greetingText = greetings[Math.floor(Math.random() * greetings.length)];

    setTranscription(greetingText);
    setFullTranscript([{ role: 'assistant', text: greetingText }]);
    setIsThinking(true);

    if (activeAbortControllerRef.current) {
      try { activeAbortControllerRef.current.abort(); } catch (e) {}
    }
    const abortCtrl = new AbortController();
    activeAbortControllerRef.current = abortCtrl;

    try {
      const res = await fetch("/api/ai/tts", {
        method: "POST",
        signal: abortCtrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: greetingText,
          voice: selectedVoice
        })
      });

      if (!isSessionActiveRef.current) return;

      if (res.ok) {
        const data = await res.json();
        if (!isSessionActiveRef.current) return;
        playVoiceResponse(greetingText, data.audio);
      } else {
        fallbackSpeech(greetingText, () => resumeListening());
      }
    } catch (e: any) {
      if (!isSessionActiveRef.current || e?.name === 'AbortError') return;
      fallbackSpeech(greetingText, () => resumeListening());
    } finally {
      if (activeAbortControllerRef.current === abortCtrl) {
        activeAbortControllerRef.current = null;
      }
    }
  }, [selectedVoice, playVoiceResponse, fallbackSpeech, resumeListening]);

  // Start live session
  const startSession = useCallback(async () => {
    try {
      setError(null);
      isSessionActiveRef.current = true;
      setIsConnected(false);
      hasGreetedRef.current = false;

      // Unlock AudioContext on user gesture
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        if (!isSessionActiveRef.current) {
          ctx.close().catch(() => {});
          return;
        }
        audioContextRef.current = ctx;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isSessionActiveRef.current) {
        stream.getTracks().forEach(t => {
          try {
            t.enabled = false;
            t.stop();
          } catch (e) {}
        });
        return;
      }
      streamRef.current = stream;

      setupAudioMetering(stream);
      setIsConnected(true);
      setupSpeechRecognition();

      // Greet the user out loud in live voice
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
      greetingTimeoutRef.current = setTimeout(() => {
        if (isSessionActiveRef.current) {
          triggerInitialGreeting();
        }
      }, 300);

    } catch (err: any) {
      if (!isSessionActiveRef.current) return;
      console.error("Failed to start live session:", err);
      setError(err.message || "Could not access microphone. Please check permissions.");
    }
  }, [setupAudioMetering, setupSpeechRecognition, triggerInitialGreeting]);

  // Stop session cleanly and tear down all listeners, audio, network requests, and media streams
  const stopSession = useCallback(() => {
    // 1. Invalidate session activity flag first
    isSessionActiveRef.current = false;
    isProcessingRef.current = false;
    isSpeakingRef.current = false;

    // 2. Abort any pending network turn / greeting
    if (activeAbortControllerRef.current) {
      try {
        activeAbortControllerRef.current.abort();
      } catch (e) {}
      activeAbortControllerRef.current = null;
    }

    // 3. Clear all timers & animation frames
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (greetingTimeoutRef.current) {
      clearTimeout(greetingTimeoutRef.current);
      greetingTimeoutRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 4. Immediately silence speech synthesis
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    // 5. Stop and destroy audio element
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
        currentAudioRef.current.onplay = null;
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if (currentAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      } catch (e) {}
      currentAudioUrlRef.current = null;
    }

    // 6. Abort and detach all handlers from SpeechRecognition
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.onstart = null;
        rec.onspeechstart = null;
        rec.onspeechend = null;
        rec.abort();
      } catch (e) {}
      try {
        rec.stop();
      } catch (e) {}
    }

    // 7. Stop and disable all media stream microphone tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.enabled = false;
            track.stop();
          } catch (e) {}
        });
      } catch (e) {}
      streamRef.current = null;
    }

    // 8. Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    // 9. Reset state
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsThinking(false);
    setVolume(0);
  }, []);

  // Handle open / close lifecycle
  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      stopSession();
    }
    return () => {
      stopSession();
    };
  }, [isOpen, startSession, stopSession]);

  // Handle Escape key to cut call cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleEndCall();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close call handler
  const handleEndCall = () => {
    stopSession();
    const finalTranscript = transcriptRef.current.length > 0 ? [...transcriptRef.current] : undefined;
    onClose(finalTranscript);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="live-mode-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            className="relative w-full max-w-lg bg-slate-950 text-white rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col items-center justify-between p-6 sm:p-10 aspect-[4/5] sm:aspect-square border border-slate-800"
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between z-40">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  isConnected 
                    ? (isSpeaking ? "bg-indigo-400 animate-ping" : "bg-emerald-400 animate-pulse") 
                    : "bg-amber-400"
                )} />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                    {isConnected ? `Live Voice Call • ${formatTime(callTime)}` : "Connecting..."}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {isSpeaking ? "Speaking" : isListening ? "Listening" : isThinking ? "Thinking" : "Active"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice Picker */}
                <div className="relative" ref={voicePickerRef}>
                  <button 
                    onClick={() => setShowVoicePicker(!showVoicePicker)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-full transition-all text-slate-100 border border-slate-700 shadow-md"
                    title="Change Zinnia Voice"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{selectedVoice}</span>
                    <ChevronDown className={cn("w-3 h-3 transition-transform text-slate-400", showVoicePicker && "rotate-180")} />
                  </button>
                  
                  <AnimatePresence>
                    {showVoicePicker && (
                      <motion.div
                        key="live-voice-picker-menu"
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute top-full mt-2 right-0 w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden p-2"
                      >
                        <div className="px-3 py-1.5 border-b border-slate-800 mb-1.5 flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-300">Select AI Voice</p>
                          <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">5 Voices</span>
                        </div>
                        <div className="space-y-1">
                          {VOICES.map((voice) => (
                            <button
                              key={`live-voice-${voice.id}`}
                              onClick={() => {
                                setSelectedVoice(voice.id);
                                setShowVoicePicker(false);
                              }}
                              className={cn(
                                "w-full text-left p-2.5 rounded-xl transition-all flex flex-col gap-0.5",
                                selectedVoice === voice.id 
                                  ? "bg-indigo-600 text-white shadow-md font-semibold" 
                                  : "hover:bg-slate-800 text-slate-200 hover:text-white"
                              )}
                            >
                              <p className="text-xs font-bold flex items-center justify-between">
                                {voice.name}
                                {selectedVoice === voice.id && <Sparkles className="w-3.5 h-3.5 text-indigo-200 fill-indigo-200" />}
                              </p>
                              <p className={cn(
                                "text-[10px]",
                                selectedVoice === voice.id ? "text-indigo-100" : "text-slate-400"
                              )}>
                                {voice.desc}
                              </p>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={handleEndCall}
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-full transition-colors text-slate-300 hover:text-white shadow-sm"
                  title="Close and save transcript"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Glowing Aura & Visualizer */}
            <div className="relative flex items-center justify-center w-full h-44 sm:h-56 my-auto">
              <AnimatePresence>
                {isSpeaking && (
                  <motion.div
                    key="aura-speaking-container"
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      key="aura-speaking-blob-1"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.45, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                      className="absolute w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none"
                    />
                    <motion.div
                      key="aura-speaking-blob-2"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: [0.9, 1.6, 0.9], opacity: [0.15, 0.4, 0.15] }}
                      transition={{ repeat: Infinity, duration: 3, delay: 0.4, ease: "easeInOut" }}
                      className="absolute w-52 h-52 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"
                    />
                  </motion.div>
                )}
                {isThinking && (
                  <motion.div
                    key="aura-thinking-container"
                    animate={{ rotate: 360, scale: [0.9, 1.1, 0.9] }}
                    transition={{ rotate: { repeat: Infinity, duration: 8, ease: "linear" }, scale: { repeat: Infinity, duration: 2 } }}
                    className="absolute w-52 h-52 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 rounded-full blur-2xl pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* 16 Audio Waveform Bars */}
              <div className="relative flex items-center gap-1.5 sm:gap-2 h-36 z-10">
                {[...Array(16)].map((_, i) => {
                  const centerDistance = Math.abs(i - 7.5);
                  const curveFactor = Math.cos((centerDistance / 8) * (Math.PI / 2.5));

                  return (
                    <motion.div
                      key={`visualizer-bar-${i}`}
                      animate={{
                        height: isSpeaking 
                          ? [14, (Math.random() * 90 + 20) * curveFactor, 14] 
                          : isThinking
                            ? [12, Math.sin((i / 2) + Date.now() / 200) * 20 + 25, 12]
                            : isListening 
                              ? [10, Math.min(100, (volume * 320 + 10) * curveFactor), 10]
                              : 8,
                        backgroundColor: isSpeaking 
                          ? ["#818cf8", "#a855f7", "#6366f1"] 
                          : isThinking
                            ? ["#f59e0b", "#6366f1", "#f59e0b"]
                            : isListening 
                              ? (volume > 0.05 ? "#10b981" : "#6366f1")
                              : "rgba(255, 255, 255, 0.15)"
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: isSpeaking ? 0.35 + (i % 4) * 0.1 : 0.6,
                        ease: "easeInOut"
                      }}
                      className={cn(
                        "w-2 sm:w-2.5 rounded-full shadow-lg transition-colors",
                        isSpeaking && "shadow-indigo-500/50"
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* Subtitle Transcription & Status */}
            <div className="w-full text-center space-y-5 px-3 z-10">
              <div className="min-h-[74px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {transcription ? (
                    <motion.div
                      key="live-transcription-box"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "rounded-2xl px-5 py-3 shadow-xl border transition-all max-w-md w-full",
                        transcription.startsWith("You:") 
                          ? "bg-slate-900 border-slate-700 text-slate-100" 
                          : "bg-slate-900 border-indigo-500/50 text-indigo-100 shadow-indigo-950/40"
                      )}
                    >
                      <p className="font-semibold text-xs sm:text-sm leading-relaxed line-clamp-3">
                        {transcription}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="live-transcription-placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-slate-400 font-medium text-xs sm:text-sm"
                    >
                      {isConnected 
                        ? (isListening ? "Listening to your voice..." : "Preparing voice link...") 
                        : "Connecting to Zinnia Live..."}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Header */}
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                  {isSpeaking 
                    ? "Zinnia is speaking..." 
                    : isThinking
                      ? "Zinnia is preparing reply..."
                      : isListening 
                        ? "I'm listening..." 
                        : "Connected"}
                </h3>
                {error && !error.includes('{') && (
                  <p className="text-amber-300 text-xs font-semibold px-3 py-1 bg-amber-500/15 rounded-full border border-amber-500/30 inline-block">
                    {error}
                  </p>
                )}
              </div>

              {/* In-Call Controls */}
              <div className="flex items-center justify-center gap-6 pt-2">
                {/* Mute Mic Button */}
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 border",
                    isMuted 
                      ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30" 
                      : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white shadow-md"
                  )}
                  title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* End Call Button */}
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={handleEndCall}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-950/50 hover:shadow-red-600/40 transition-all active:scale-95 group"
                    title="End Call"
                  >
                    <PhoneOff className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  </button>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">End Call</span>
                </div>

                {/* Speaker Mute Button */}
                <button 
                  onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                  className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 border",
                    isSpeakerMuted
                      ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                      : isSpeaking 
                        ? "bg-indigo-600/40 border-indigo-400/50 text-indigo-200 animate-pulse" 
                        : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white shadow-md"
                  )}
                  title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
                >
                  {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Live Indicator Footer */}
            <div className="w-full text-center opacity-40 select-none pt-2 z-10">
              <p className="text-[9px] uppercase font-bold tracking-[0.25em] text-slate-400">
                Live Bidirectional Voice Mode
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
