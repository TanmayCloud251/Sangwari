
import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession, Attachment } from '../types';
import { getGeminiResponse } from '../services/geminiUtils';
import { Send, Paperclip, Mic, Bot, User, X, FileText, ExternalLink } from 'lucide-react';
import { updateSession } from '../services/storage';

interface ChatInterfaceProps {
  onStartAudio: () => void;
  session: ChatSession;
  onUpdateSession: (session: ChatSession) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onStartAudio, session, onUpdateSession }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ file: File, preview: string, base64: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      const preview = URL.createObjectURL(file);
      setSelectedFile({ file, preview, base64 });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedFile) || isLoading) return;

    const attachment: Attachment | undefined = selectedFile ? {
      mimeType: selectedFile.file.type,
      data: selectedFile.base64,
      fileName: selectedFile.file.name,
      url: selectedFile.preview
    } : undefined;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now(),
      attachment
    };

    const updatedMessages = [...session.messages, userMsg];
    const newSessionState = {
        ...session,
        messages: updatedMessages,
        lastMessage: inputText || (attachment ? `Sent ${attachment.fileName}` : ''),
        title: session.messages.length <= 1 ? (inputText.substring(0, 30) || 'Naya Batchit') : session.title
    };
    
    onUpdateSession(newSessionState);
    updateSession(newSessionState);
    
    const currentInput = inputText;
    setInputText('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const history = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const attachmentForApi = attachment ? { mimeType: attachment.mimeType, data: attachment.data } : undefined;
      const response = await getGeminiResponse(history, currentInput || "Summarize this file", attachmentForApi);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        groundingUrls: response.groundingUrls
      };

      const finalMessages = [...updatedMessages, botMsg];
      const finalSessionState = {
          ...newSessionState,
          messages: finalMessages,
          lastMessage: response.text
      };
      
      onUpdateSession(finalSessionState);
      updateSession(finalSessionState);
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
                  {msg.attachment && (
                    <div className="mb-3 overflow-hidden rounded-xl border border-white/20">
                      {msg.attachment.mimeType.startsWith('image/') ? (
                        <img src={msg.attachment.url || `data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} alt="Upload" className="max-w-full h-auto object-cover max-h-60" />
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-white/10">
                          <FileText className={msg.role === 'user' ? 'text-white' : 'text-[var(--primary-color)]'} />
                          <span className="text-sm font-medium truncate">{msg.attachment.fileName || 'Document'}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.text}
                  
                  {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--primary-color)]/10 space-y-2">
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-wider text-[var(--text-color)]">References:</p>
                      {msg.groundingUrls.map((url, idx) => (
                        <a 
                          key={idx} 
                          href={url.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-[var(--primary-color)] hover:underline"
                        >
                          <ExternalLink size={12} />
                          <span className="truncate">{url.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
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
          {selectedFile && (
            <div className="bg-[var(--surface-color)] rounded-xl shadow-md p-2 flex items-center gap-3 border border-[var(--primary-color)]/10 self-start">
               {selectedFile.file.type.startsWith('image/') ? (
                 <img src={selectedFile.preview} className="w-12 h-12 rounded-lg object-cover" />
               ) : (
                 <div className="w-12 h-12 bg-[var(--primary-color)]/5 rounded-lg flex items-center justify-center text-[var(--primary-color)]">
                   <FileText size={20} />
                 </div>
               )}
               <div className="flex-1 min-w-0 pr-4">
                 <p className="text-xs font-bold text-[var(--text-color)] truncate">{selectedFile.file.name}</p>
                 <p className="text-[10px] opacity-40 text-[var(--text-color)]">{(selectedFile.file.size / 1024).toFixed(1)} KB</p>
               </div>
               <button onClick={removeFile} className="p-1.5 hover:bg-gray-500/10 rounded-full text-gray-400 hover:text-red-500">
                 <X size={16} />
               </button>
            </div>
          )}

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
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg, application/pdf"
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 opacity-40 text-[var(--text-color)] hover:opacity-100 hover:text-[var(--primary-color)] transition-colors"
              >
                  <Paperclip size={20} />
              </button>
              
              <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputText.trim() && !selectedFile)}
                  className={`p-2 rounded-xl transition-all ${inputText.trim() || selectedFile ? 'text-[var(--primary-color)] hover:bg-[var(--primary-color)]/5' : 'text-gray-300'}`}
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
