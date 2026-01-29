
import React, { useState } from 'react';
import { ChatSession } from '../types';
import { MessageSquare, Calendar, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { deleteSession } from '../services/storage';

interface HistoryViewProps {
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onRefresh: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ sessions, onSelectSession, onRefresh }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Aaj': true,
    'Kal': true,
    'Pichle 7 Din': true,
    'Puraana': false
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Kya aap ye batchit mitaana chahate ho?")) {
      deleteSession(id);
      onRefresh();
    }
  };

  const groupSessions = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 86400000 * 7;

    const groups: Record<string, ChatSession[]> = {
      'Aaj': [],
      'Kal': [],
      'Pichle 7 Din': [],
      'Puraana': []
    };

    sessions.forEach(session => {
      const ts = session.timestamp || Date.now();
      if (ts >= today) groups['Aaj'].push(session);
      else if (ts >= yesterday) groups['Kal'].push(session);
      else if (ts >= lastWeek) groups['Pichle 7 Din'].push(session);
      else groups['Puraana'].push(session);
    });

    return groups;
  };

  const grouped = groupSessions();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[var(--bg-color)]">
        <div className="w-20 h-20 bg-[var(--primary-color)]/10 rounded-full flex items-center justify-center mb-4 text-[var(--primary-color)]">
          <MessageSquare size={40} />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-color)] mb-2">Abhi tak koi batchit nahi hui he</h2>
        <p className="opacity-60 text-[var(--text-color)]">Sangwari se gappa ladao, tab yeha itihaas dikhi!</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-[var(--bg-color)]">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-[var(--text-color)] flex items-center gap-3">
          <MessageSquare className="text-[var(--primary-color)]" />
          Pahli Batchit (History)
        </h2>

        {Object.entries(grouped).map(([groupName, groupSessions]) => {
          if (groupSessions.length === 0) return null;
          const isExpanded = expandedGroups[groupName];

          return (
            <div key={groupName} className="space-y-3">
              <button 
                onClick={() => toggleGroup(groupName)}
                className="flex items-center gap-2 w-full text-left font-bold text-[var(--text-color)] opacity-70 hover:opacity-100 transition-opacity"
              >
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <span>{groupName}</span>
                <span className="ml-2 text-xs bg-[var(--surface-color)] px-2 py-0.5 rounded-full border border-[var(--primary-color)]/20">
                  {groupSessions.length}
                </span>
              </button>

              {isExpanded && (
                <div className="grid grid-cols-1 gap-3 pl-4">
                  {groupSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className="bg-[var(--surface-color)] p-4 rounded-2xl shadow-sm border border-[var(--primary-color)]/10 hover:border-[var(--primary-color)]/40 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-[var(--primary-color)]/10 rounded-xl flex items-center justify-center text-[var(--primary-color)] flex-shrink-0 group-hover:bg-[var(--primary-color)] group-hover:text-white transition-colors">
                          <MessageSquare size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[var(--text-color)] truncate">
                            {session.title || 'Naya Batchit'}
                          </h3>
                          <p className="text-sm opacity-60 text-[var(--text-color)] truncate">
                            {session.lastMessage || 'Koi sandesh nahi he'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] opacity-40 hidden sm:block whitespace-nowrap">{session.date}</span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => handleDelete(e, session.id)}
                            className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryView;
