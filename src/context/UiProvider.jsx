import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { UiContext } from './ui-context';

const TOAST_DURATION_MS = 4000;

const toneIconMap = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  danger: AlertTriangle,
};

export function UiProvider({ children }) {
  const confirmResolverRef = useRef(null);
  const [dialogState, setDialogState] = useState(null);
  const [toasts, setToasts] = useState([]);

  const closeDialog = useCallback((result) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }

    setDialogState(null);
  }, []);

  const confirm = useCallback((options) => new Promise((resolve) => {
    confirmResolverRef.current = resolve;
    setDialogState({
      title: options.title || 'Please confirm',
      description: options.description || '',
      confirmLabel: options.confirmLabel || 'Confirm',
      cancelLabel: options.cancelLabel || 'Cancel',
      tone: options.tone || 'info',
    });
  }), []);

  const showToast = useCallback((options) => {
    const id = crypto.randomUUID();
    const toast = {
      id,
      title: options.title || 'Notice',
      description: options.description || '',
      tone: options.tone || 'info',
    };

    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({
    confirm,
    showToast,
  }), [confirm, showToast]);

  const DialogIcon = dialogState ? toneIconMap[dialogState.tone] || Info : Info;

  return (
    <UiContext.Provider value={contextValue}>
      {children}

      {dialogState && (
        <div className="app-modal-backdrop" role="presentation">
          <div className="app-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="app-modal-title">
            <div className={`app-modal-icon ${dialogState.tone}`}>
              <DialogIcon size={18} />
            </div>
            <h3 id="app-modal-title">{dialogState.title}</h3>
            {dialogState.description && <p>{dialogState.description}</p>}
            <div className="app-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => closeDialog(false)}>
                {dialogState.cancelLabel}
              </button>
              <button type="button" className={`btn ${dialogState.tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={() => closeDialog(true)}>
                {dialogState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-stack">
        {toasts.map((toast) => {
          const ToastIcon = toneIconMap[toast.tone] || Info;
          return (
            <div key={toast.id} className={`toast-card ${toast.tone}`}>
              <div className="toast-content">
                <div className="toast-icon">
                  <ToastIcon size={16} />
                </div>
                <div>
                  <strong>{toast.title}</strong>
                  {toast.description && <p>{toast.description}</p>}
                </div>
              </div>
              <button type="button" className="toast-close" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </UiContext.Provider>
  );
}
