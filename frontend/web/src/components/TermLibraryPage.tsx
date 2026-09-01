import { useState, useEffect } from 'react';

interface Library {
  id: number;
  name: string;
  isDefault: number;
  entryCount: number;
  createTime: string;
}

interface Entry {
  id?: number;
  sourceTerm: string;
  targetTerm: string;
  direction: string;
}

const API = '/api/sys/user/term';

const DIR_OPTIONS = ['zh→en', 'en→zh', 'zh→ja', 'ja→zh', 'zh→ko', 'ko→zh'];

export function TermLibraryPage() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [activeLib, setActiveLib] = useState<Library | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dirty, setDirty] = useState(false);
  const [showLibModal, setShowLibModal] = useState(false);
  const [editLib, setEditLib] = useState<{ id?: number; name: string; isDefault: number }>({ name: '', isDefault: 0 });
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const token = () => localStorage.getItem('token') || '';
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  const loadLibraries = async () => {
    const res = await fetch(`${API}/library`, { headers: headers() });
    const json = await res.json();
    if (json.code === 200) setLibraries(json.data);
  };

  const loadEntries = async (libId: number) => {
    const res = await fetch(`${API}/entry/${libId}`, { headers: headers() });
    const json = await res.json();
    if (json.code === 200) { setEntries(json.data); setDirty(false); }
  };

  useEffect(() => { loadLibraries(); }, []);

  const openLib = (lib: Library) => { setActiveLib(lib); loadEntries(lib.id); };

  const saveLibrary = async () => {
    const url = editLib.id ? `${API}/library/${editLib.id}` : `${API}/library`;
    const method = editLib.id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(editLib) });
    const json = await res.json();
    if (json.code === 200) { setShowLibModal(false); loadLibraries(); showToast('保存成功'); }
    else showToast(json.detail || json.message || '保存失败');
  };

  const deleteLibrary = async (id: number) => {
    if (!confirm('确定删除该术语库及其下所有条目？')) return;
    const res = await fetch(`${API}/library/${id}`, { method: 'DELETE', headers: headers() });
    const json = await res.json();
    if (json.code === 200) { loadLibraries(); if (activeLib?.id === id) setActiveLib(null); showToast('已删除'); }
    else showToast(json.message || '删除失败');
  };

  const saveEntries = async () => {
    const res = await fetch(`${API}/entry`, { method: 'PUT', headers: headers(), body: JSON.stringify({ libraryId: activeLib?.id, entries }) });
    const json = await res.json();
    if (json.code === 200) { setDirty(false); loadEntries(activeLib!.id); loadLibraries(); showToast('保存成功'); }
    else showToast(json.detail || json.message || '保存失败');
  };

  const addEntry = () => { setEntries([...entries, { sourceTerm: '', targetTerm: '', direction: 'zh→en' }]); setDirty(true); };
  const updateEntry = (i: number, field: keyof Entry, val: string) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: val };
    setEntries(updated);
    setDirty(true);
  };
  const removeEntry = (i: number) => { setEntries(entries.filter((_, j) => j !== i)); setDirty(true); };

  // 返回时如果有未保存的修改，提示
  const goBack = () => {
    if (dirty && !confirm('你有未保存的修改，确定返回吗？')) return;
    setActiveLib(null);
    setDirty(false);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* ========== 术语库列表视图 ========== */}
      {!activeLib ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>术语库</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>管理你的翻译术语库，点击卡片或按钮进入术语条目管理</div>
            </div>
            <button
              onClick={() => { setEditLib({ name: '', isDefault: 0 }); setShowLibModal(true); }}
              style={btnPrimary}
            >
              + 新建术语库
            </button>
          </div>

          {libraries.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#bbb', padding: 60, fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .4 }}>📚</div>
              暂无术语库，点击上方按钮创建
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {libraries.map(lib => (
                <div
                  key={lib.id}
                  className="card term-lib-card"
                  onClick={() => openLib(lib)}
                  style={{ padding: '20px 24px', marginBottom: 0 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="term-name">{lib.name}</span>
                          {lib.isDefault === 1 && (
                            <span className="term-default-tag">默认</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          {lib.entryCount} 个术语 · {lib.createTime ? new Date(lib.createTime).toLocaleDateString() : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} onClick={e => e.stopPropagation()}>
                      <span
                        onClick={() => openLib(lib)}
                        className="term-ghost"
                      >
                        管理术语
                      </span>
                      <span
                        onClick={() => { setEditLib({ id: lib.id, name: lib.name, isDefault: lib.isDefault }); setShowLibModal(true); }}
                        className="term-ghost"
                      >
                        编辑
                      </span>
                      <span
                        onClick={() => deleteLibrary(lib.id)}
                        className="term-danger"
                      >
                        删除
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ========== 术语条目管理视图 ========== */
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={goBack} style={btnBack}>← 返回</button>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{activeLib.name}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 1 }}>
                  {entries.length} 个术语{dirty ? ' · 有未保存的修改' : ''}
                </div>
              </div>
            </div>
            <button onClick={addEntry} style={btnPrimary}>+ 添加术语</button>
          </div>

          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#bbb', padding: 60, fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .4 }}>📝</div>
              此术语库暂无条目，点击"添加术语"开始
            </div>
          ) : (
            <>
              {/* 表头 */}
              <div className="card" style={{ padding: 0, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', background: '#fafaf9', padding: '10px 16px', fontSize: 12, color: '#999', fontWeight: 500, borderBottom: '1px solid #f0efec' }}>
                  <div style={{ width: 32 }}>#</div>
                  <div style={{ flex: 2 }}>原文</div>
                  <div style={{ flex: 2 }}>译文</div>
                  <div style={{ width: 90 }}>方向</div>
                  <div style={{ width: 40 }}></div>
                </div>
                {entries.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderBottom: '1px solid #f5f3f0', transition: 'background .15s' }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = '#fafaf9')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 32, fontSize: 12, color: '#ccc', paddingLeft: 4 }}>{i + 1}</div>
                    <input value={e.sourceTerm} onChange={ev => updateEntry(i, 'sourceTerm', ev.target.value)} style={{ ...cellInp, flex: 2 }} placeholder="输入原文" />
                    <input value={e.targetTerm} onChange={ev => updateEntry(i, 'targetTerm', ev.target.value)} style={{ ...cellInp, flex: 2 }} placeholder="输入译文" />
                    <select value={e.direction} onChange={ev => updateEntry(i, 'direction', ev.target.value)} style={dirSelect}>
                      {DIR_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button onClick={() => removeEntry(i)} style={btnRemove} title="删除此行">×</button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={saveEntries}
                  style={{ ...btnPrimary, flex: 1, opacity: dirty ? 1 : .6 }}
                >
                  {dirty ? '💾 保存全部术语' : '已是最新'}
                </button>
                {dirty && (
                  <button onClick={() => { loadEntries(activeLib!.id); }} style={btnCancel}>
                    撤销修改
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ========== 新建/编辑术语库弹窗 ========== */}
      {showLibModal && (
        <div onClick={() => setShowLibModal(false)} style={overlay}>
          <div onClick={e => e.stopPropagation()} style={modal}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>{editLib.id ? '编辑术语库' : '新建术语库'}</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>名称</div>
              <input value={editLib.name} onChange={e => setEditLib({ ...editLib, name: e.target.value })} style={inp} placeholder="例如：医学词汇、法律术语" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666', marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={editLib.isDefault === 1} onChange={e => setEditLib({ ...editLib, isDefault: e.target.checked ? 1 : 0 })} style={{ accentColor: '#2c2c2c' }} />
              设为默认术语库
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveLibrary} style={{ ...btnPrimary, flex: 1 }}>保存</button>
              <button onClick={() => setShowLibModal(false)} style={{ ...btnCancel, flex: 1 }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Toast ========== */}
      {toast && <div style={toastStyle}>{toast}</div>}

      {/* ========== 术语库卡片样式 ========== */}
      <style>{`
        .term-lib-card {
          cursor: pointer;
          transition: all .2s ease;
        }
        .term-lib-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,.06);
          border-color: #d0cdc5 !important;
        }
        [data-theme="dark"] .term-lib-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,.3);
          border-color: #4a4a5e !important;
        }

        /* 术语库名称 - 链接风格，表明可点击 */
        .term-name {
          color: #234b49;
          cursor: pointer;
          transition: color .15s;
        }
        .term-lib-card:hover .term-name { color: #8f4b2e; }
        [data-theme="dark"] .term-name { color: #8ab9b4; }
        [data-theme="dark"] .term-lib-card:hover .term-name { color: #d0ad70; }

        /* 默认术语库标签 */
        .term-default-tag {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(35, 75, 73, 0.1);
          color: #234b49;
          line-height: 1.6;
        }
        [data-theme="dark"] .term-default-tag {
          background: rgba(138, 185, 180, 0.15);
          color: #8ab9b4;
        }

        /* ghost 操作文字 */
        .term-ghost {
          font-size: 13px;
          color: #888;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all .15s;
          user-select: none;
        }
        .term-ghost:hover {
          background: #f5f3f0;
          color: #333;
        }
        [data-theme="dark"] .term-ghost { color: #999; }
        [data-theme="dark"] .term-ghost:hover { background: #394139; color: #fff; }

        /* 删除 - 危险操作红色 */
        .term-danger {
          font-size: 13px;
          color: #888;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all .15s;
          user-select: none;
        }
        .term-danger:hover {
          color: #e55c5c;
          background: #fdf2f2;
        }
        [data-theme="dark"] .term-danger { color: #999; }
        [data-theme="dark"] .term-danger:hover { color: #ff7a7a; background: rgba(229, 92, 92, 0.1); }
      `}</style>
    </div>
  );
}

/* ========== 样式常量 ========== */
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modal: React.CSSProperties = {
  background: '#fff', borderRadius: 14, padding: 24, width: 380,
  boxShadow: '0 8px 30px rgba(0,0,0,.15)',
};
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#f7f6f4',
  border: '1px solid transparent', borderRadius: 10, fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
};
const cellInp: React.CSSProperties = {
  padding: '6px 8px', border: '1px solid transparent', borderRadius: 6,
  fontSize: 13, outline: 'none', background: 'transparent', marginRight: 8,
};
const dirSelect: React.CSSProperties = {
  width: 90, padding: '6px 4px', border: '1px solid #e0ded8',
  borderRadius: 6, fontSize: 12, background: '#fff', outline: 'none', color: '#555',
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', background: '#2c2c2c', color: '#fff',
  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const btnCancel: React.CSSProperties = {
  padding: '10px 20px', border: '1px solid #e0ded8', borderRadius: 10,
  background: '#fff', color: '#666', fontSize: 13, cursor: 'pointer',
};
const btnBack: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 6, border: '1px solid #e0ded8',
  background: '#fff', fontSize: 13, color: '#666', cursor: 'pointer',
};
const btnRemove: React.CSSProperties = {
  width: 40, padding: 4, border: 'none', background: 'none',
  color: '#e55c5c', cursor: 'pointer', fontSize: 18, fontWeight: 300,
};
const toastStyle: React.CSSProperties = {
  position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
  padding: '10px 24px', background: '#2c2c2c', color: '#fff',
  borderRadius: 10, fontSize: 13, zIndex: 999,
};
