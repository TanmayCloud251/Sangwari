import React, { useEffect, useRef, useState } from 'react';
import { Mic, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { getGeminiResponse } from '../services/geminiUtils';

interface AudioInterfaceProps {
  onEndCall: () => void;
}

const AudioInterface: React.FC<AudioInterfaceProps> = ({ onEndCall }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const isMounted = useRef(true);
  const audioStarted = useRef(false);

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
    recognitionRef.current.continuous = false; // Keep false for turn-based interaction
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'hi-IN';

    recognitionRef.current.onstart = () => {
      console.log("Recognition started");
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
        console.log("Final Transcript detected:", finalTranscript);
        setInterimTranscript(finalTranscript);
        setStatus('thinking');
        
        try {
          const response = await getGeminiResponse([], finalTranscript);
          console.log("AI Response received:", response.text);
          speak(response.text);
        } catch (error: any) {
          console.error("Transcription/API Error:", error);
          setStatus('error');
          setErrorMessage('Response me deri ho rahi he, pheri se koshish karo.');
        }
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Recognition Error:", event.error);
      if (!isMounted.current) return;

      if (event.error === 'no-speech') {
        if (status === 'listening') startListening();
      } else {
        setStatus('error');
        if (event.error === 'not-allowed') {
          setErrorMessage('Mic permission nahi he. Settings check karo.');
        } else if (event.error === 'network') {
          setErrorMessage('Internet connect nahi he sangwari.');
        } else {
          setErrorMessage(`Error: ${event.error}. Pheri se try karo.`);
        }
      }
    };

    recognitionRef.current.onend = () => {
      console.log("Recognition ended, status:", status);
      if (isMounted.current && status === 'listening' && !isMuted) {
        // Only auto-restart if we are still in listening mode and not muted
        setTimeout(() => startListening(), 200);
      }
    };
  };

  const startListening = () => {
    if (recognitionRef.current && !isMuted && (status === 'listening' || status === 'idle' || status === 'connecting' || status === 'speaking')) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    }
  };

  const handleStartCall = () => {
    initSpeechRecognition();
    setStatus('connecting');
    setInterimTranscript('');
    
    // Unlock Speech Synthesis by playing a short empty sound or greeting
    if (!audioStarted.current) {
        audioStarted.current = true;
        speak("Jai Johar! Bolih, main sunat haan.");
    } else {
        startListening();
    }
  };

  const speak = (text: string) => {
    if (!isMounted.current) return;
    
    console.log("Speaking:", text);
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a good Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
    if (hindiVoice) {
        utterance.voice = hindiVoice;
    }
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9; // Slightly slower for clarity
    
    utterance.onstart = () => {
      console.log("TTS onstart");
      if (isMounted.current) setStatus('speaking');
    };
    
    utterance.onend = () => {
      console.log("TTS onend");
      if (isMounted.current) {
        setInterimTranscript('');
        setStatus('listening');
        startListening();
      }
    };

    utterance.onerror = (e) => {
       console.error("TTS Error:", e);
       if (isMounted.current) {
        setStatus('listening');
        startListening();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    isMounted.current = true;
    // Load voices early
    window.speechSynthesis.getVoices();
    return () => {
      isMounted.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (isMuted) {
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
      window.speechSynthesis.cancel();
    } else if (status === 'listening') {
      startListening();
    }
  }, [isMuted]);

  return (
    <div className="flex flex-col h-full bg-cream-50 items-center justify-between py-16 px-4 relative">
       {/* Top Status */}
       <div className="text-center w-full max-w-md px-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sangwari</h2>
            <div className="h-24 flex flex-col items-center justify-center">
                <p className={`text-gray-500 font-medium ${['connecting', 'listening', 'thinking', 'speaking'].includes(status) ? 'animate-pulse' : ''}`}>
                    {status === 'idle' && 'Tayyar ho?'}
                    {status === 'connecting' && 'Connecting...'}
                    {status === 'listening' && 'Listening...'}
                    {status === 'thinking' && 'Thinking...'}
                    {status === 'speaking' && 'Speaking...'}
                    {status === 'error' && 'Connection Error'}
                </p>
                {(interimTranscript || status === 'thinking') && (
                    <p className={`text-gray-400 text-sm mt-2 italic line-clamp-2 px-6 ${status === 'thinking' ? 'opacity-50' : ''}`}>
                        "{interimTranscript || 'Humm...'}"
                    </p>
                )}
                {errorMessage && (
                    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                )}
            </div>
       </div>

       {/* Visualizer */}
       <div className="relative w-48 h-48 flex items-center justify-center">
            <div className={`absolute w-full h-full rounded-full bg-green-100 opacity-50 transition-all duration-500 
                ${status === 'speaking' ? 'scale-150 animate-pulse bg-orange-100' : 
                  status === 'listening' ? 'scale-110' : 
                  status === 'thinking' ? 'scale-125 animate-bounce bg-blue-100' : 'scale-100'}`} 
            />
            <div className={`w-32 h-32 bg-green-200 rounded-full flex items-center justify-center z-10 relative overflow-hidden shadow-lg border-4 border-white transition-all duration-300 ${status === 'idle' ? 'grayscale opacity-70' : ''}`}>
                 <img 
                    src={`https://api.dicebear.com/7.x/micah/svg?seed=Sangwari&backgroundColor=b6e3f4`} 
                    alt="Sangwari Avatar" 
                    className="w-full h-full object-cover"
                 />
                 {(status === 'idle' || status === 'error') && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/20 group cursor-pointer" onClick={handleStartCall}>
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                             <Mic size={24} className="text-green-600" />
                         </div>
                     </div>
                 )}
            </div>
       </div>

       {/* Waveform Animation */}
       <div className="h-16 flex items-center gap-1.5">
          {Array.from({length: 12}).map((_, i) => (
             <div 
                key={i}
                className={`w-2 bg-orange-400 rounded-full transition-all duration-150 
                    ${status === 'speaking' ? 'wave-bar' : status === 'listening' ? 'h-[15%] opacity-50' : 'h-[10%] opacity-20'}`}
                style={{ 
                    height: status === 'speaking' ? '60%' : undefined,
                    animationDelay: `${i * 0.1}s`,
                }}
             />
          ))}
       </div>


       {/* Controls */}
       <div className="flex items-center gap-6">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                disabled={status === 'idle'}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${isMuted ? 'bg-red-50 text-red-500' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
                {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
            </button>

            {status === 'idle' || status === 'error' ? (
                <button 
                    onClick={handleStartCall}
                    className="px-8 py-3 rounded-full bg-green-500 text-white font-bold shadow-lg hover:bg-green-600 transform hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Mic size={20} />
                    {status === 'error' ? 'Retry' : 'Start Call'}
                </button>
            ) : (
                <button 
                    onClick={onEndCall}
                    className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg hover:bg-red-600 transform hover:scale-105 transition-all"
                >
                    <PhoneOff size={28} fill="currentColor" />
                </button>
            )}
            
            <button 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-gray-600 bg-white shadow-md transition-all ${status === 'listening' ? 'bg-green-50 ring-2 ring-green-500' : ''}`}
                onClick={() => (status === 'idle' || status === 'error') ? handleStartCall() : null}
            >
                <Mic size={20} className={status === 'listening' ? 'text-green-500' : 'text-gray-400'}/>
            </button>
       </div>
    </div>
  );
};

export default AudioInterface;
