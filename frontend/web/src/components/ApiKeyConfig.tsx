import { useState, useEffect } from 'react';

/** 后端返回的 API Key VO */
interface ApiKeyVO {
  id: number;
  provider: string;
  keyType: 'ASR' | 'LLM';
  apiKeyMask: string;
  status: number;
  lastTestTime: string | null;
  createTime: string;
}

/** 厂商列表项 */
interface Provider {
  key: string;
  name: string;
}

const API = '/api/sys/user/api-key';
const STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '未测试', color: '#999', bg: '#f5f3f0' },
  1: { label: '可用', color: '#52c41a', bg: '#f6ffed' },
  2: { label: '不可用', color: '#e55c5c', bg: '#fdf2f2' },
};

export function ApiKeyConfig() {
  const [keys, setKeys] = useState<ApiKeyVO[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);
  const [form, setForm] = useState({ provider: '', keyType: 'LLM', apiKey: '' });
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const token = () => localStorage.getItem('token') || '';
  const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  const loadKeys = async () => {
    try {
      const res = await fetch(API, { headers: h() });
      const json = await res.json();
      if (json.code === 200) setKeys(json.data);
    } catch { /* ignore */ }
  };

  const loadProviders = async () => {
    // 合并 ASR + LLM 厂商列表，去重
    const map = new Map<string, string>();
    try {
      const [asrRes, llmRes] = await Promise.all([
        fetch('/api/sys/user/ai/asr/providers', { headers: h() }),
        fetch('/api/sys/user/ai/llm/providers', { headers: h() }),
      ]);
      const [asrJson, llmJson] = await Promise.all([asrRes.json(), llmRes.json()]);
      if (asrJson.code === 200) (asrJson.data as Provider[]).forEach(p => map.set(p.key, p.name));
      if (llmJson.code === 200) (llmJson.data as Provider[]).forEach(p => map.set(p.key, p.name));
    } catch { /* ignore */ }
    setProviders(Array.from(map, ([key, name]) => ({ key, name })));
  };

  useEffect(() => { loadKeys(); loadProviders(); }, []);

  const saveKey = async () => {
    if (!form.provider || !form.apiKey.trim()) return showToast('请填写完整信息');
    try {
      const res = await fetch(API, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      const json = await res.json();
      if (json.code === 200) {
        setShowModal(false);
        loadKeys();
        showToast('保存成功');
      }
      else showToast(json.detail || json.message || '保存失败');
    } catch { showToast('请求失败'); }
  };

  const deleteKey = async (id: number) => {
    if (!confirm('确定删除该 API Key？')) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: h() });
      const json = await res.json();
      if (json.code === 200) { loadKeys(); showToast('已删除'); }
      else showToast(json.message || '删除失败');
    } catch { showToast('请求失败'); }
  };

  const testKey = async (id: number) => {
    setTesting(id);
    try {
      const res = await fetch(`${API}/${id}/test`, { method: 'POST', headers: h() });
      const json = await res.json();
      if (json.code === 200) { showToast('连通性测试通过'); loadKeys(); }
      else showToast(json.detail || json.message || '测试失败');
    } catch { showToast('测试请求失败'); }
    finally { setTesting(null); }
  };

  // 按类型分组
  const asrKeys = keys.filter(k => k.keyType === 'ASR');
  const llmKeys = keys.filter(k => k.keyType === 'LLM');

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>API Key 配置</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>配置各厂商的 API Key，用于语音识别和翻译服务</div>
        </div>
        <button onClick={() => { setForm({ provider: '', keyType: 'LLM', apiKey: '' }); setShowModal(true); }} style={btnPrimary}>
          + 添加 API Key
        </button>
      </div>

      {/* ASR Key */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          🎤 语音识别 (ASR)
          <span style={{ fontSize: 12, color: '#bbb', fontWeight: 400 }}>· {asrKeys.length} 个</span>
        </div>
        {asrKeys.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#bbb', padding: 32, fontSize: 13 }}>暂无 ASR 的 API Key</div>
        ) : (
          <KeyTable keys={asrKeys} providers={providers} testing={testing} onTest={testKey} onDelete={deleteKey} />
        )}
      </div>

      {/* LLM Key */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          🧠 大语言模型 (LLM)
          <span style={{ fontSize: 12, color: '#bbb', fontWeight: 400 }}>· {llmKeys.length} 个</span>
        </div>
        {llmKeys.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#bbb', padding: 32, fontSize: 13 }}>暂无 LLM 的 API Key</div>
        ) : (
          <KeyTable keys={llmKeys} providers={providers} testing={testing} onTest={testKey} onDelete={deleteKey} />
        )}
      </div>

      {/* 添加弹窗 */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={overlay}>
          <div onClick={e => e.stopPropagation()} style={modal}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>添加 API Key</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>厂商</div>
              <select
                value={form.provider}
                onChange={e => setForm({ ...form, provider: e.target.value })}
                style={selectStyle}
              >
                <option value="">请选择厂商</option>
                {providers.map(p => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>类型</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['LLM', 'ASR'] as const).map(t => (
                  <button key={t} onClick={() => setForm({ ...form, keyType: t })}
                    style={typeBtn(form.keyType === t)}>
                    {t === 'LLM' ? '🧠 LLM' : '🎤 ASR'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>API Key</div>
              <input
                value={form.apiKey}
                onChange={e => setForm({ ...form, apiKey: e.target.value })}
                style={inp}
                placeholder="粘贴你的 API Key"
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveKey} style={{ ...btnPrimary, flex: 1 }}>保存</button>
              <button onClick={() => setShowModal(false)} style={{ ...btnCancel, flex: 1 }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={toastStyle}>{toast}</div>}
    </div>
  );
}

/** Key 表格 */
function KeyTable({ keys, providers, testing, onTest, onDelete }: {
  keys: ApiKeyVO[];
  providers: Provider[];
  testing: number | null;
  onTest: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const getName = (key: string) => providers.find(p => p.key === key)?.name || key;

  return (
    <div className="card" style={{ padding: 0, marginBottom: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#fafaf9', fontSize: 12, color: '#999' }}>
            <th style={th}>厂商</th>
            <th style={th}>API Key</th>
            <th style={th}>状态</th>
            <th style={th}>最后测试</th>
            <th style={{ ...th, width: 120 }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(k => {
            const st = STATUS_MAP[k.status] || STATUS_MAP[0];
            return (
              <tr key={k.id} style={{ borderBottom: '1px solid #f5f3f0' }}>
                <td style={td}>
                  <span style={{ fontWeight: 500 }}>{getName(k.provider)}</span>
                  <span style={{ fontSize: 11, color: '#bbb', marginLeft: 6 }}>{k.provider}</span>
                </td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{k.apiKeyMask}</td>
                <td style={td}>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: st.bg, color: st.color, fontWeight: 500 }}>
                    {st.label}
                  </span>
                </td>
                <td style={{ ...td, fontSize: 12, color: '#bbb' }}>
                  {k.lastTestTime ? new Date(k.lastTestTime).toLocaleString() : '-'}
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span onClick={() => onTest(k.id)} className="apikey-ghost"
                      style={{ opacity: testing === k.id ? .5 : 1, cursor: testing === k.id ? 'default' : 'pointer' }}>
                      {testing === k.id ? '测试中...' : '测试'}
                    </span>
                    <span onClick={() => onDelete(k.id)} className="apikey-danger">删除</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style>{`
        .apikey-ghost {
          font-size: 12px; color: #234b49; cursor: pointer; padding: 3px 8px; border-radius: 4px; transition: all .15s; user-select: none;
        }
        .apikey-ghost:hover { background: rgba(35,75,73,.08); }
        .apikey-danger {
          font-size: 12px; color: #888; cursor: pointer; padding: 3px 8px; border-radius: 4px; transition: all .15s; user-select: none;
        }
        .apikey-danger:hover { color: #e55c5c; background: #fdf2f2; }
        [data-theme="dark"] .apikey-ghost { color: #8ab9b4; }
        [data-theme="dark"] .apikey-ghost:hover { background: rgba(138,185,180,.12); }
        [data-theme="dark"] .apikey-danger:hover { color: #ff7a7a; background: rgba(229,92,92,.1); }
      `}</style>
    </div>
  );
}

/* ========== 样式常量 ========== */
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modal: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 24, width: 400, boxShadow: '0 8px 30px rgba(0,0,0,.15)' };
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, fontSize: 14, outline: 'none', color: '#333', cursor: 'pointer', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: '#2c2c2c', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnCancel: React.CSSProperties = { padding: '10px 20px', border: '1px solid #e0ded8', borderRadius: 10, background: '#fff', color: '#666', fontSize: 13, cursor: 'pointer' };
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 16px', fontWeight: 500 };
const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13 };
const toastStyle: React.CSSProperties = { position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 };
function typeBtn(active: boolean): React.CSSProperties {
  return { padding: '8px 16px', borderRadius: 8, border: active ? '1px solid #2c2c2c' : '1px solid #e0ded8', background: active ? '#2c2c2c' : '#fff', color: active ? '#fff' : '#666', fontSize: 13, cursor: 'pointer' };
}
