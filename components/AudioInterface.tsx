import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, PhoneOff, Volume2, VolumeX } from 'lucide-react';

interface AudioInterfaceProps {
  onEndCall: () => void;
}

const SYSTEM_INSTRUCTION = `
You are Sangwari, a Chhattisgarhi friend.
You are talking in a voice call.
Speak casual Chhattisgarhi and Hindi.
Keep sentences very short (1-2 sentences).
Be warm and energetic.
`;

const AudioInterface: React.FC<AudioInterfaceProps> = ({ onEndCall }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Refs for audio handling
  const nextStartTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null); // To hold the live session

  // -------------------------------------------------------------------------
  // Audio Helper Functions (from GenAI docs)
  // -------------------------------------------------------------------------
  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  // -------------------------------------------------------------------------
  // Main Logic
  // -------------------------------------------------------------------------

  useEffect(() => {
    let mounted = true;
    let cleanupSession: (() => void) | null = null;

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Initialize Audio Contexts
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outputAudioContext;

        const outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);

        // Get User Media
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Establish Connection
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: SYSTEM_INSTRUCTION,
          },
          callbacks: {
            onopen: () => {
                if (!mounted) return;
                setStatus('listening');

                // Setup Input Stream Processing
                const source = inputAudioContext.createMediaStreamSource(stream);
                sourceRef.current = source;
                
                // Use ScriptProcessor for raw PCM access (Worklet is better but this is simpler for single file)
                const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                inputProcessorRef.current = scriptProcessor;

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    
                    // Simple volume visualizer logic
                    let sum = 0;
                    for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                    const rms = Math.sqrt(sum / inputData.length);
                    setVolumeLevel(rms * 100); // Scale up for visualizer

                    const pcmBlob = createBlob(inputData);
                    
                    sessionPromise.then((session) => {
                        if (mounted && !isMuted) {
                             session.sendRealtimeInput({ media: pcmBlob });
                        }
                    });
                };

                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                if (!mounted) return;

                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio) {
                    setStatus('speaking');
                    nextStartTimeRef.current = Math.max(
                        nextStartTimeRef.current,
                        outputAudioContext.currentTime
                    );

                    const audioBuffer = await decodeAudioData(
                        decode(base64Audio),
                        outputAudioContext,
                        24000,
                        1
                    );

                    const source = outputAudioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputNode);
                    
                    source.addEventListener('ended', () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) {
                            setStatus('listening');
                        }
                    });

                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                }

                const interrupted = message.serverContent?.interrupted;
                if (interrupted) {
                    sourcesRef.current.forEach((src) => {
                        try { src.stop(); } catch(e) {}
                    });
                    sourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                    setStatus('listening');
                }
            },
            onclose: () => {
                if(mounted) setStatus('connecting'); // Reconnect logic could go here
            },
            onerror: (err) => {
                console.error(err);
                if(mounted) setStatus('error');
            }
          }
        });

        // Store session for cleanup (though using promise is safer)
        sessionPromise.then(sess => {
            sessionRef.current = sess;
        });

        cleanupSession = () => {
             sessionPromise.then(sess => sess.close());
        };

      } catch (err) {
        console.error("Setup error:", err);
        setStatus('error');
      }
    };

    startSession();

    return () => {
      mounted = false;
      if (cleanupSession) cleanupSession();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (inputProcessorRef.current) inputProcessorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
    };
  }, []); // Run once on mount

  // Simple visualizer bars based on pseudo-randomness + status
  const bars = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full bg-cream-50 items-center justify-between py-16 px-4 relative">
       {/* Top Status */}
       <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sangwari</h2>
            <p className="text-gray-500 font-medium animate-pulse">
                {status === 'connecting' && 'Connecting...'}
                {status === 'listening' && 'Listening...'}
                {status === 'speaking' && 'Speaking...'}
                {status === 'error' && 'Connection Error'}
            </p>
       </div>

       {/* Visualizer */}
       <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Outer Glow */}
            <div className={`absolute w-full h-full rounded-full bg-green-100 opacity-50 transition-transform duration-300 ${status === 'speaking' ? 'scale-150 animate-pulse' : 'scale-100'}`} />
            
            {/* Center Avatar/Icon */}
            <div className="w-32 h-32 bg-green-200 rounded-full flex items-center justify-center z-10 relative overflow-hidden shadow-lg border-4 border-white">
                 <img 
                    src={`https://api.dicebear.com/7.x/micah/svg?seed=Sangwari&backgroundColor=b6e3f4`} 
                    alt="Sangwari Avatar" 
                    className="w-full h-full object-cover"
                 />
            </div>
       </div>

       {/* Waveform Animation (CSS based on status) */}
       <div className="h-16 flex items-center gap-1.5">
          {Array.from({length: 12}).map((_, i) => (
             <div 
                key={i}
                className={`w-2 bg-orange-400 rounded-full transition-all duration-150 ${status === 'speaking' ? 'wave-bar' : ''}`}
                style={{ 
                    height: status === 'speaking' ? '40%' : '10%',
                    animationDelay: `${i * 0.1}s`
                }}
             />
          ))}
       </div>


       {/* Controls */}
       <div className="flex items-center gap-6">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-gray-600 bg-white shadow-md hover:bg-gray-100"
            >
                {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
            </button>

            <button 
                onClick={onEndCall}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg hover:bg-red-600 transform hover:scale-105 transition-all"
            >
                <PhoneOff size={28} fill="currentColor" />
            </button>
            
            <button className="w-12 h-12 rounded-full flex items-center justify-center text-gray-600 bg-white shadow-md hover:bg-gray-100">
                <Mic size={20} className={status === 'listening' ? 'text-green-500' : ''}/>
            </button>
       </div>
    </div>
  );
};

export default AudioInterface;