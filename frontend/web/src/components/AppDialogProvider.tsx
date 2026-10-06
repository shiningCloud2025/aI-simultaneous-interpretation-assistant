import { useEffect, useState } from 'react';
import { type DialogRequest, registerAppDialog } from '../lib/appDialog';

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [input, setInput] = useState('');

  useEffect(() => registerAppDialog((request) => {
    setDialog(request);
    setInput(request.kind === 'prompt' ? request.defaultValue || '' : '');
  }), []);

  const close = (result?: boolean | string | null) => {
    if (!dialog) return;
    if (dialog.kind === 'alert') dialog.resolve();
    if (dialog.kind === 'confirm') dialog.resolve(Boolean(result));
    if (dialog.kind === 'prompt') dialog.resolve(typeof result === 'string' ? result : null);
    setDialog(null);
    setInput('');
  };

  return (
    <>
      {children}
      {dialog && (
        <div style={mask} onMouseDown={event => event.target === event.currentTarget && close(dialog.kind === 'confirm' ? false : null)}>
          <div style={panel} role="dialog" aria-modal="true">
            <div style={head}>
              <span style={{ ...icon, background: dialog.danger ? '#fff0ec' : '#eef7f4', color: dialog.danger ? '#b45a46' : '#20736c' }}>
                {dialog.danger ? '!' : 'i'}
              </span>
              <div>
                <h2 style={title}>{dialog.title}</h2>
                <p style={message}>{dialog.message}</p>
              </div>
            </div>
            {dialog.kind === 'prompt' && (
              <input
                autoFocus
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') close(input);
                  if (event.key === 'Escape') close(null);
                }}
                placeholder={dialog.placeholder}
                style={inputStyle}
              />
            )}
            <div style={actions}>
              {dialog.kind !== 'alert' && (
                <button type="button" onClick={() => close(dialog.kind === 'confirm' ? false : null)} style={cancelBtn}>
                  {dialog.cancelText || '取消'}
                </button>
              )}
              <button
                type="button"
                onClick={() => close(dialog.kind === 'prompt' ? input : true)}
                style={{ ...confirmBtn, background: dialog.danger ? '#b45a46' : '#1f7a73' }}
              >
                {dialog.confirmText || '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const mask: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 5000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  background: 'rgba(22, 31, 29, .28)',
  backdropFilter: 'blur(6px)',
};

const panel: React.CSSProperties = {
  width: 'min(420px, 100%)',
  border: '1px solid rgba(207, 220, 215, .92)',
  borderRadius: 18,
  background: '#fff',
  boxShadow: '0 28px 80px rgba(28, 45, 42, .22)',
  padding: 22,
};

const head: React.CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'flex-start',
};

const icon: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  fontSize: 17,
  fontWeight: 800,
};

const title: React.CSSProperties = {
  margin: '1px 0 6px',
  color: '#203330',
  fontSize: 16,
  fontWeight: 800,
};

const message: React.CSSProperties = {
  margin: 0,
  color: '#64736f',
  fontSize: 13,
  lineHeight: 1.7,
  whiteSpace: 'pre-line',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  marginTop: 18,
  padding: '0 12px',
  border: '1px solid #dfe8e4',
  borderRadius: 10,
  outline: 'none',
  color: '#253632',
  fontSize: 14,
};

const actions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  marginTop: 22,
};

const cancelBtn: React.CSSProperties = {
  height: 38,
  padding: '0 17px',
  border: '1px solid #dfe5e1',
  borderRadius: 10,
  background: '#fff',
  color: '#586964',
  cursor: 'pointer',
  fontWeight: 700,
};

const confirmBtn: React.CSSProperties = {
  height: 38,
  padding: '0 18px',
  border: 0,
  borderRadius: 10,
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 800,
};
