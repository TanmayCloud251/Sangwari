
import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession, Attachment } from '../types';
import { getGroqResponse } from '../services/groqUtils';
import { Send, Mic, Bot, User, X, FileText, ExternalLink } from 'lucide-react';

interface ChatInterfaceProps {
  onStartAudio: () => void;
  session: ChatSession;
  onUpdateSession: (session: ChatSession) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onStartAudio, session, onUpdateSession }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    const updatedMessages = [...session.messages, userMsg];
    const newSessionState = {
        ...session,
        messages: updatedMessages,
        lastMessage: inputText,
        title: session.messages.length <= 1 ? (inputText.substring(0, 30) || 'Naya Batchit') : session.title
    };
    
    onUpdateSession(newSessionState);
    
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      const history = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await getGroqResponse(history, currentInput);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: Date.now()
      };

      const finalMessages = [...updatedMessages, botMsg];
      const finalSessionState = {
          ...newSessionState,
          messages: finalMessages,
          lastMessage: response.text
      };
      
      onUpdateSession(finalSessionState);
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
    <div className="flex flex-col h-full bg-[var(--bg-color)] relative transition-colors duration-300">
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-color)] rounded-full -translate-y-1/2 translate-x-1/2 opacity-10 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-[var(--secondary-color)] rounded-full opacity-10 pointer-events-none" />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide z-10">
        {session.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'model' ? 'bg-[var(--secondary-color)]' : 'bg-[var(--surface-color)]'}`}>
                {msg.role === 'model' ? (
                  <Bot size={20} className="text-white" />
                ) : (
                  <User size={20} className="text-[var(--text-color)] opacity-60" />
                )}
              </div>

              <div className="flex flex-col">
                <span className={`text-[10px] mb-1 opacity-50 text-[var(--text-color)] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'model' ? 'Sangwari' : 'You'}
                </span>
                <div
                  className={`p-4 rounded-2xl shadow-sm text-[var(--font-size-base)] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--primary-color)] text-white rounded-tr-none'
                      : 'bg-[var(--surface-color)] text-[var(--text-color)] rounded-tl-none border border-[var(--primary-color)]/5'
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
              <div className="w-2 h-2 bg-[var(--primary-color)]/40 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[var(--primary-color)]/40 rounded-full animate-bounce delay-75" />
              <div className="w-2 h-2 bg-[var(--primary-color)]/40 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 z-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          <div className="bg-[var(--surface-color)] rounded-2xl shadow-lg p-2 flex items-center gap-2 border border-[var(--primary-color)]/10">
               <button 
                  onClick={onStartAudio}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--primary-color)]/10 text-[var(--primary-color)] transition-colors"
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
                  className="flex-1 bg-transparent border-none outline-none text-[var(--text-color)] px-2 placeholder-[var(--text-color)]/40"
              />
              
              <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputText.trim()}
                  className={`p-2 rounded-xl transition-all ${inputText.trim() ? 'text-[var(--primary-color)] hover:bg-[var(--primary-color)]/5' : 'text-gray-300'}`}
              >
                  <Send size={20} />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
