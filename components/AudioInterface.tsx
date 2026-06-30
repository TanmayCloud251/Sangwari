import React, { useEffect, useRef, useState } from 'react';
import { Mic, PhoneOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { getGeminiResponse, getGeminiTTS } from '../services/geminiUtils';
import { ChatSession, Message, AppSettings } from '../types';

interface AudioInterfaceProps {
  session: ChatSession;
  onUpdateSession: (session: ChatSession) => void;
  onEndCall: () => void;
  settings: AppSettings;
}

const AudioInterface: React.FC<AudioInterfaceProps> = ({ session, onUpdateSession, onEndCall, settings }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>(settings.voiceName || 'Aoede');
  const recognitionRef = useRef<any>(null);
  const isMounted = useRef(true);
  const audioStarted = useRef(false);
  const audioObjRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Speech Recognition
  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported in this browser.");
      setStatus('error');
      setErrorMessage('Aapke browser me speech recognition support nahi he.');
      return;
    }

    if (recognitionRef.current) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; 
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'hi-IN';

    recognitionRef.current.onstart = () => {
      if (isMounted.current) {
        setStatus('listening');
        setErrorMessage('');
      }
    };

    recognitionRef.current.onresult = async (event: any) => {
      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      if (currentInterim && isMounted.current) {
        setInterimTranscript(currentInterim);
      }

      if (finalTranscript && isMounted.current) {
        setInterimTranscript(finalTranscript);
        handleConversation(finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      if (!isMounted.current) return;
      if (event.error === 'no-speech') {
        if (status === 'listening') startListening();
      } else {
        setStatus('error');
        setErrorMessage(`Error: ${event.error}`);
      }
    };

    recognitionRef.current.onend = () => {
      if (isMounted.current && status === 'listening' && !isMuted) {
        setTimeout(() => startListening(), 200);
      }
    };
  };

  const handleConversation = async (text: string) => {
    setStatus('thinking');
    
    // 1. Create User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    // 2. Prepare history for Gemini
    const history = session.messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      const response = await getGeminiResponse(history, text, selectedVoice, true);
      
      // 3. Create Model Message
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: Date.now()
      };

      // 4. Update Global Session
      onUpdateSession({
        ...session,
        messages: [...session.messages, userMsg, modelMsg],
        lastMessage: response.text
      });

      speak(response.text);
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage('Kuch dikat ho gaye, pheri se koshish kara.');
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isMuted && status === 'listening') {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  };

  const handleStartCall = async () => {
    initSpeechRecognition();
    setStatus('connecting');
    setInterimTranscript('');
    
    if (!audioStarted.current) {
        audioStarted.current = true;
        setStatus('thinking');
        try {
          // Fetch a warm welcoming voice greeting from Gemini
          const response = await getGeminiResponse([], "Jai Johar! Ek chota aur madhur greeting bolo start karne ke liye.", selectedVoice, true);
          speak(response.text);
        } catch (e) {
          speak("जय जोहार! बोलिहू, मैं सुनत हंव।");
        }
    } else {
        setStatus('listening');
        try {
          recognitionRef.current.start();
        } catch (e) {}
    }
  };

  // Helper to convert base64 PCM (linear16, 24kHz, mono) to WAV Blob URL
  const pcmToWav = (base64Pcm: string, sampleRate = 24000): string => {
    const binaryString = window.atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const buffer = new ArrayBuffer(44 + len);
    const view = new DataView(buffer);
    
    /* RIFF identifier */
    view.setUint32(0, 0x52494646, false); // "RIFF"
    /* file length */
    view.setUint32(4, 36 + len, true);
    /* RIFF type */
    view.setUint32(8, 0x57415645, false); // "WAVE"
    /* format chunk identifier */
    view.setUint32(12, 0x666d7420, false); // "fmt "
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw PCM = 1) */
    view.setUint16(20, 1, true);
    /* channel count (mono = 1) */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample (16) */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    view.setUint32(36, 0x64617461, false); // "data"
    /* data chunk length */
    view.setUint32(40, len, true);
    
    // Copy PCM data
    const pcmView = new Uint8Array(buffer, 44);
    pcmView.set(bytes);
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  const speak = async (text: string) => {
    if (!isMounted.current) return;
    
    // Cancel browser TTS first
    window.speechSynthesis.cancel();
    
    // Stop any HTML5 audio currently playing
    if (audioObjRef.current) {
      audioObjRef.current.pause();
      audioObjRef.current.src = '';
    }

    if (isMuted) {
      setStatus('listening');
      startListening();
      return;
    }

    // Clean up text (remove markdown symbols, stars, emojis, etc.)
    const cleanText = text
      .replace(/[*#_`~]/g, '')
      .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
      .trim();

    if (!cleanText) {
      setStatus('listening');
      startListening();
      return;
    }

    setStatus('speaking');
    try {
      const base64Pcm = await getGeminiTTS(cleanText, selectedVoice);
      const wavUrl = pcmToWav(base64Pcm);
      
      const audio = new Audio(wavUrl);
      audioObjRef.current = audio;

      audio.onended = () => {
        if (isMounted.current) {
          setInterimTranscript('');
          setStatus('listening');
          startListening();
        }
      };

      audio.onerror = (e) => {
        console.error("Gemini TTS playback failed, falling back to browser SpeechSynthesis", e);
        fallbackSpeak(cleanText);
      };

      audio.play().catch(err => {
        console.error("Gemini TTS play failed, falling back to browser SpeechSynthesis", err);
        fallbackSpeak(cleanText);
      });
    } catch (error) {
      console.error("Gemini TTS generation error, falling back to browser SpeechSynthesis", error);
      fallbackSpeak(cleanText);
    }
  };

  const fallbackSpeak = (text: string) => {
    if (!isMounted.current || isMuted) {
      setStatus('listening');
      startListening();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Look for specified voice fallback, otherwise look for general Hindi/IN voice
    let matchedVoice = null;
    if (selectedVoice) {
      matchedVoice = voices.find(v => v.name.includes(selectedVoice));
    }
    if (!matchedVoice) {
      matchedVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
    }
    
    if (matchedVoice) utterance.voice = matchedVoice;
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    
    utterance.onstart = () => { if (isMounted.current) setStatus('speaking'); };
    utterance.onend = () => {
      if (isMounted.current) {
        setInterimTranscript('');
        setStatus('listening');
        startListening();
      }
    };
    utterance.onerror = () => {
       if (isMounted.current) {
        setStatus('listening');
        startListening();
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    isMounted.current = true;
    window.speechSynthesis.getVoices();
    return () => {
      isMounted.current = false;
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
      window.speechSynthesis.cancel();
      if (audioObjRef.current) {
        audioObjRef.current.pause();
        audioObjRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (isMuted) {
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
      window.speechSynthesis.cancel();
      if (audioObjRef.current) {
        audioObjRef.current.pause();
        audioObjRef.current.src = '';
      }
    } else if (status === 'listening') {
      startListening();
    }
  }, [isMuted]);

  const getOrbStateClass = () => {
    if (status === 'speaking') return 'orb-speaking';
    if (status === 'thinking') return 'orb-thinking';
    if (status === 'listening' || status === 'connecting') return 'orb-active';
    return '';
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] items-center justify-between py-12 px-6 relative overflow-hidden transition-all duration-700">
       {/* Ambient Background Glow */}
       <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--primary-color)] blur-[120px] rounded-full opacity-30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--secondary-color)] blur-[100px] rounded-full opacity-20 translate-x-20 -translate-y-20" />
       </div>

       {/* Header */}
       <div className="z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
             <Sparkles className="text-[var(--primary-color)] animate-pulse" size={20} />
             <h2 className="text-xl font-medium text-white/90 tracking-wider">SANGWARI LIVE</h2>
          </div>
          <p className="text-white/40 text-sm font-light">Chhattisgarhi Voice Companion</p>
       </div>

       {/* Voice Selector */}
       <div className="z-10 flex gap-2 justify-center bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md max-w-[280px] w-full mx-auto">
          {(['Aoede', 'Charon', 'Fenrir'] as const).map(voice => (
             <button
                key={voice}
                onClick={() => setSelectedVoice(voice)}
                className={`flex-1 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-all duration-300 ${
                   selectedVoice === voice
                      ? 'bg-[var(--primary-color)] text-white shadow-[0_0_15px_rgba(255,152,0,0.35)] scale-105'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
             >
                {voice === 'Aoede' ? 'Aoede (नारी)' :
                 voice === 'Charon' ? 'Charon (नरम)' :
                 'Fenrir (गंभीर)'}
             </button>
          ))}
       </div>

       {/* Central Interactive Orb */}
       <div className={`relative flex items-center justify-center transition-all duration-500 ${status === 'idle' ? 'scale-75 opacity-50' : 'scale-100'}`}>
          <div className={`orb-container ${getOrbStateClass()}`}>
             {/* Layered Gradients */}
             <div className="orb-layer bg-gradient-to-tr from-[var(--primary-color)] via-orange-400 to-yellow-300 opacity-80" />
             <div className="orb-layer bg-gradient-to-bl from-[var(--secondary-color)] via-teal-400 to-emerald-300 opacity-60 translate-x-4 -translate-y-4" />
             <div className="orb-layer bg-gradient-to-br from-purple-500 via-pink-400 to-red-400 opacity-40 -translate-x-6 translate-y-6" />
             
             {/* Inner Core */}
             <div className="absolute inset-4 bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 shadow-inner z-20 flex items-center justify-center">
                {status === 'idle' && (
                  <button onClick={handleStartCall} className="w-20 h-20 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all group">
                     <Mic size={32} className="text-white group-hover:scale-110 transition-transform" />
                  </button>
                )}
             </div>
          </div>
       </div>

       {/* Transcript Area */}
       <div className="z-10 w-full max-w-lg text-center h-24 flex flex-col items-center justify-center px-4">
          {status === 'thinking' && (
             <div className="flex gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:0.4s]" />
             </div>
          )}
          
          <p className={`text-white/80 text-lg font-light leading-relaxed transition-opacity duration-500 ${interimTranscript ? 'opacity-100' : 'opacity-40'}`}>
             {interimTranscript ? `"${interimTranscript}"` : (
                status === 'listening' ? 'Bolih, main sunat haan...' : 
                status === 'speaking' ? 'Sangwari bolat he...' :
                status === 'thinking' ? 'Sangwari sochati he...' :
                status === 'error' ? errorMessage : 'Tayyar ho?'
             )}
          </p>
       </div>

       {/* Bottom Controls */}
       <div className="z-10 flex items-center gap-10">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 ${isMuted ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
          >
             {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>

          <button 
            onClick={onEndCall}
            className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-all transform hover:scale-105 active:scale-95"
          >
             <PhoneOff size={32} fill="currentColor" />
          </button>

          <button 
            onClick={() => status === 'idle' ? handleStartCall() : null}
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 ${status === 'listening' ? 'bg-[var(--primary-color)]/20 border-[var(--primary-color)] text-[var(--primary-color)]' : 'bg-white/5 border-white/10 text-white/60'}`}
          >
             <Mic size={24} />
          </button>
       </div>
    </div>
  );
};

export default AudioInterface;
