import { useState, useEffect } from 'react';
import { api } from '../stores/appStore';

interface Shortcut {
  id?: number;
  action: string;
  keyCombination: string;
}

const defaults: Shortcut[] = [
  { action: '复制译文', keyCombination: 'Ctrl+C' },
  { action: '粘贴原文', keyCombination: 'Ctrl+V' },
];

export function ShortcutSettings() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(defaults);
  const [editing, setEditing] = useState<number | null>(null);
  const [editKey, setEditKey] = useState('');
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  useEffect(() => {
    api.getShortcuts().then((data: any[]) => {
      if (data && data.length > 0) {
        setShortcuts(data);
      }
    }).catch(() => {});
  }, []);

  const startEdit = (i: number) => { setEditing(i); setEditKey(shortcuts[i].keyCombination); };

  const saveEdit = async (i: number) => {
    const updated = [...shortcuts];
    updated[i] = { ...updated[i], action: shortcuts[i].action, keyCombination: editKey };
    setShortcuts(updated);
    setEditing(null);
    try {
      await api.saveShortcuts({ shortcuts: updated });
      showToast('已保存');
    } catch (e: any) { showToast(e.message || '保存失败'); }
  };

  const resetDefaults = async () => {
    setShortcuts(defaults);
    try {
      await api.saveShortcuts({ shortcuts: defaults });
      showToast('已恢复默认');
    } catch (e: any) { showToast(e.message || '恢复失败'); }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', fontSize: 14, fontWeight: 600, color: '#333', borderBottom: '1px solid #f5f3f0' }}>快捷键设置</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ padding: '12px 24px', background: '#fafaf9', color: '#999', fontWeight: 500, borderBottom: '1px solid #f0efec' }}>功能</th><th style={{ padding: '12px 24px', background: '#fafaf9', color: '#999', fontWeight: 500, borderBottom: '1px solid #f0efec' }}>快捷键</th><th style={{ padding: '12px 24px', background: '#fafaf9', color: '#999', fontWeight: 500, borderBottom: '1px solid #f0efec' }}>操作</th></tr></thead>
        <tbody>
          {shortcuts.map((s, i) => (
            <tr key={i}>
              <td style={{ padding: '14px 24px', borderBottom: '1px solid #fafaf9', color: '#555' }}>{s.action}</td>
              <td style={{ padding: '14px 24px', borderBottom: '1px solid #fafaf9' }}>
                {editing === i ? (
                  <input value={editKey} onChange={e => setEditKey(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(i); if (e.key === 'Escape') setEditing(null); }} style={inp} autoFocus />
                ) : (
                  <span style={{ padding: '4px 10px', background: '#f5f3f0', borderRadius: 6, color: '#666', fontSize: 13, fontFamily: 'monospace' }}>{s.keyCombination}</span>
                )}
              </td>
              <td style={{ padding: '14px 24px', borderBottom: '1px solid #fafaf9' }}>
                {editing === i ? (
                  <span onClick={() => saveEdit(i)} style={{ color: '#2c2c2c', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>保存</span>
                ) : (
                  <span onClick={() => startEdit(i)} style={{ color: '#2c2c2c', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>修改</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '16px 24px' }}>
        <button onClick={resetDefaults} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' }}>恢复默认</button>
      </div>
      {toast && <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{toast}</div>}
    </div>
  );
}

const inp: React.CSSProperties = { padding: '4px 8px', border: '1px solid #e0ded8', borderRadius: 6, fontSize: 13, outline: 'none', width: 140, fontFamily: 'monospace' };
