import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { getGeminiTextResponse } from '../services/geminiUtils';
import { Send, Paperclip, Mic, Bot, User } from 'lucide-react';

interface ChatInterfaceProps {
  onStartAudio: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onStartAudio }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'Jai Johar! Main Sangwari haan. Tumar ka sewa kar sakat ho?',
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Prepare history for Gemini
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await getGeminiTextResponse(history, userMsg.text);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-cream-50 relative">
      {/* Decorative Circles in BG */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-yellow-100 rounded-full opacity-50 pointer-events-none" />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide z-10">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
              
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'model' ? 'bg-teal-700' : 'bg-cream-200'}`}>
                {msg.role === 'model' ? (
                  <Bot size={20} className="text-white" />
                ) : (
                  <img src="https://picsum.photos/200" alt="User" className="w-10 h-10 rounded-full object-cover" />
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col">
                <span className={`text-xs mb-1 text-gray-500 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'model' ? 'Sangwari' : 'You'}
                </span>
                <div
                  className={`p-4 rounded-2xl shadow-sm text-base leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex items-center gap-2 ml-14">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 z-20">
        <div className="bg-white rounded-2xl shadow-lg p-2 flex items-center gap-2 border border-gray-100">
            {/* Audio Button - Styled to match screenshot */}
             <button 
                onClick={onStartAudio}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-green-100 text-green-600 transition-colors"
                title="Talk to Sangwari"
             >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-green-600 transition-all">
                    <Mic size={20} />
                </div>
             </button>

            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Chhattisgarhi me likho..."
                className="flex-1 bg-transparent border-none outline-none text-gray-700 px-2 placeholder-gray-400"
            />
            
            <button className="p-2 text-gray-400 hover:text-gray-600">
                <Paperclip size={20} />
            </button>
            
            <button 
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                className={`p-2 rounded-xl transition-all ${inputText.trim() ? 'text-brand-orange hover:bg-orange-50' : 'text-gray-300'}`}
            >
                <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;