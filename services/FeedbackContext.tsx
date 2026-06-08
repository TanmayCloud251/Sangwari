import React, { createContext, useContext, useState, ReactNode } from 'react';
import Modal from '../components/Modal';

interface ModalOptions {
  title: string;
  message: string;
  type?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

interface FeedbackContextType {
  showAlert: (title: string, message: string, onConfirm?: () => void) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<(ModalOptions & { isOpen: boolean }) | null>(null);
  const [onCancelCallback, setOnCancelCallback] = useState<(() => void) | undefined>(undefined);

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setModal(null);
      }
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: () => {
        onConfirm();
        setModal(null);
      }
    });
    setOnCancelCallback(() => () => {
      if (onCancel) onCancel();
      setModal(null);
    });
  };

  const handleCancel = () => {
    if (onCancelCallback) onCancelCallback();
    setModal(null);
  };

  return (
    <FeedbackContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modal && (
        <Modal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm!}
          onCancel={handleCancel}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
        />
      )}
    </FeedbackContext.Provider>
  );
};
