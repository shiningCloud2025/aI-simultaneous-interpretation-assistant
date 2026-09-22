import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiCall } from '../lib/api';

const PAGE_SIZE = 8;

interface SkillItem {
  id: number;
  name: string;
  description?: string;
  source?: string;
  sourceText?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SkillPage {
  records: SkillItem[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

const emptyPage: SkillPage = { records: [], total: 0, size: PAGE_SIZE, current: 1, pages: 1 };

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

export function PlatformSkillsDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [page, setPage] = useState<SkillPage>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (pageNum: number, keyword: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ pageNum: String(pageNum), pageSize: String(PAGE_SIZE) });
      if (keyword.trim()) params.set('name', keyword.trim());
      const data = await apiCall<SkillPage>(`/sys/user/skills/page?${params.toString()}`);
      setPage({
        records: data.records || [],
        total: data.total || 0,
        size: data.size || PAGE_SIZE,
        current: data.current || pageNum,
        pages: data.pages || Math.max(1, Math.ceil((data.total || 0) / (data.size || PAGE_SIZE))),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '平台 Skill 加载失败');
      setPage(emptyPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, '');
  }, []);

  const totalPages = Math.max(1, page.pages || Math.ceil(page.total / page.size));
  const current = Math.min(Math.max(page.current, 1), totalPages);
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter(value => value === 1 || value === totalPages || Math.abs(value - current) <= 1);
  const compactPages = visiblePages.reduce<(number | string)[]>((result, value) => {
    const previous = result[result.length - 1];
    if (typeof previous === 'number' && value - previous > 1) result.push(`ellipsis-${value}`);
    result.push(value);
    return result;
  }, []);

  return createPortal(<div className="platform-skill-mask" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="platform-skill-modal" role="dialog" aria-modal="true" aria-label="平台 Skill">
      <div className="platform-skill-head">
        <div><h3>平台 Skill</h3><p>查看当前平台开放给外语学习智能体调用的 Skill。</p></div>
        <button className="platform-skill-close" aria-label="关闭" onClick={onClose}>×</button>
      </div>
      <div className="platform-skill-toolbar">
        <input value={name} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void load(1, name); }} placeholder="按 Skill 名称查询" aria-label="按 Skill 名称查询" />
        <button className="btn platform-skill-primary" disabled={loading} onClick={() => void load(1, name)}>查询</button>
        <button className="btn" disabled={loading} onClick={() => { setName(''); void load(1, ''); }}>清空</button>
        <button className="btn" disabled={loading} onClick={() => void load(current, name)}>刷新</button>
        <span className="platform-skill-toolbar-count">共 {page.total} 条配置</span>
      </div>
      {error && <div className="platform-skill-error" role="alert">{error}</div>}
      <div className="platform-skill-body">
        {loading ? <div className="platform-skill-empty">正在加载平台 Skill…</div>
          : page.records.length ? <div className="platform-skill-list">{page.records.map(skill => <div key={skill.id} className="platform-skill-card">
            <div className="platform-skill-card-title"><div><strong>{skill.name}</strong><p>{skill.description || '暂无 Skill 描述'}</p></div><span>{skill.sourceText || skill.source || '平台配置'}</span></div>
            <div className="platform-skill-card-meta"><span>创建：{formatTime(skill.createdAt)}</span><span>更新：{formatTime(skill.updatedAt)}</span></div>
          </div>)}</div>
            : <div className="platform-skill-empty"><strong>暂无平台 Skill</strong><span>可以先让超管在 Skill 管理里配置一条。</span></div>}
      </div>
      <div className="platform-skill-pagination">
        <button className="btn" disabled={current <= 1 || loading} onClick={() => void load(current - 1, name)}>上一页</button>
        {compactPages.map(value => typeof value === 'number' ? <button key={value} className={`platform-skill-page-btn ${value === current ? 'active' : ''}`} disabled={loading} onClick={() => void load(value, name)}>{value}</button> : <span key={value} className="platform-skill-ellipsis">...</span>)}
        <button className="btn" disabled={current >= totalPages || loading} onClick={() => void load(current + 1, name)}>下一页</button>
        <span className="platform-skill-total">共 {page.total} 条</span>
      </div>
    </div>
  </div>, document.body);
}
