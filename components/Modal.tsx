import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'alert' | 'confirm';
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  type = 'alert',
  onConfirm,
  onCancel,
  confirmText = 'Theek Hai',
  cancelText = 'Nahi'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface-color)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--primary-color)]/10">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-[var(--text-color)]">{title}</h3>
            <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          
          <p className="text-[var(--text-color)]/80 mb-8 leading-relaxed">
            {message}
          </p>
          
          <div className="flex gap-3 justify-end">
            {type === 'confirm' && (
              <button
                onClick={onCancel}
                className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg hover:shadow-xl hover:from-orange-500 hover:to-amber-600 transition-all transform active:scale-95"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
