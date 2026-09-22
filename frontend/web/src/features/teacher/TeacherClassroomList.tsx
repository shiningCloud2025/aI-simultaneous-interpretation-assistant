import { ArrowRight, BookOpen, Plus, Search } from 'lucide-react';
import type { ClassroomList, PageResult } from './teachingApi';

type ClassroomFilter = 'all' | 'active' | 'archived';

interface TeacherClassroomListProps {
  data: PageResult<ClassroomList> | null;
  loading: boolean;
  error: string;
  keyword: string;
  status: ClassroomFilter;
  page: number;
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: ClassroomFilter) => void;
  onPageChange: (value: number) => void;
  onCreate: () => void;
  onOpen: (id: number) => void;
}

const languages: Record<string, string> = { english: '英语', japanese: '日语', korean: '韩语' };
const semesters: Record<string, string> = { FIRST: '上学期', SECOND: '下学期' };
const grades: Record<string, string> = Object.fromEntries([
  ...Array.from({ length: 6 }, (_, i) => [`primary_${i + 1}`, `小学${i + 1}年级`]),
  ...Array.from({ length: 3 }, (_, i) => [`junior_${i + 1}`, `初中${i + 1}年级`]),
  ...Array.from({ length: 3 }, (_, i) => [`senior_${i + 1}`, `高中${i + 1}年级`]),
  ...Array.from({ length: 4 }, (_, i) => [`university_${i + 1}`, `大学${i + 1}年级`]),
  ...Array.from({ length: 3 }, (_, i) => [`postgraduate_${i + 1}`, `研究生${i + 1}年级`]),
]);

function classroomMeta(item: ClassroomList) {
  const pieces = [languages[item.languageCode] || item.languageCode, item.stageCode ? grades[item.stageCode] || item.stageCode : '未设置阶段'];
  if (item.academicYear) pieces.push(`${item.academicYear} 学年`);
  if (item.semesterCode) pieces.push(semesters[item.semesterCode] || item.semesterCode);
  return pieces.join(' · ');
}

function createdTime(value: string) {
  const parsed = new Date(value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function TeacherClassroomList({
  data, loading, error, keyword, status, page, onKeywordChange, onStatusChange, onPageChange, onCreate, onOpen,
}: TeacherClassroomListProps) {
  const hasFilter = Boolean(keyword.trim()) || status !== 'all';
  const firstClassroom = !loading && data?.total === 0 && !hasFilter && page === 1;
  const records = data?.records ?? [];

  return <div className="teacher-page teacher-rooms-page">
    <header className="teacher-rooms-heading">
      <div>
        <h1>我的课堂</h1>
        <p>选择一间课堂，管理学生和每次上课。</p>
      </div>
      {!firstClassroom && <button className="teacher-primary" onClick={onCreate}><Plus size={17} />创建课堂</button>}
    </header>

    {firstClassroom ? <section className="teacher-rooms-first">
      <span className="teacher-rooms-first-icon"><BookOpen size={26} /></span>
      <h2>先创建一间课堂</h2>
      <p>创建后会生成课堂码。把课堂码或邀请链接发给学生，学生加入后就可以开始上课。</p>
      <button className="teacher-primary" onClick={onCreate}><Plus size={17} />创建课堂</button>
    </section> : <>
      <div className="teacher-rooms-toolbar">
        <label><Search size={18} /><input value={keyword} onChange={event => onKeywordChange(event.target.value)} placeholder="搜索课堂名称" aria-label="搜索课堂名称" /></label>
        <div className="teacher-filter" aria-label="课堂状态">
          {(['all', 'active', 'archived'] as const).map(value => <button key={value} className={status === value ? 'active' : ''} onClick={() => onStatusChange(value)}>{value === 'all' ? '全部' : value === 'active' ? '进行中' : '已归档'}</button>)}
        </div>
      </div>
      {records.length > 0 ? <div className="teacher-rooms-list">
        {records.map(item => <button className="teacher-rooms-row" key={item.id} onClick={() => onOpen(item.id)}>
          <span className="teacher-rooms-row-icon"><BookOpen size={21} /></span>
          <span className="teacher-rooms-row-main"><strong>{item.name}</strong><small>{classroomMeta(item)}</small><small>创建于 {createdTime(item.createTime)}</small></span>
          <span className={`teacher-rooms-status ${item.status === 0 ? 'archived' : ''}`}>{item.status === 1 ? '进行中' : '已归档'}</span>
          <span className="teacher-rooms-enter">进入课堂 <ArrowRight size={16} /></span>
        </button>)}
      </div> : <div className="teacher-rooms-no-results">
        <strong>{loading || !data ? '正在加载课堂…' : error ? '课堂暂时无法加载' : hasFilter ? '没有符合条件的课堂' : '这一页没有课堂'}</strong>
        <p>{error ? '请使用页面右上角的刷新按钮重试。' : hasFilter ? '试试其他名称或切换课堂状态。' : '返回上一页继续查看。'}</p>
        {hasFilter && <button onClick={() => { onKeywordChange(''); onStatusChange('all'); }}>清除筛选</button>}
      </div>}
      {data && data.pages > 1 && <div className="teacher-pager"><span>共 {data.total} 间课堂</span><button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>上一页</button><span>{page} / {data.pages}</span><button disabled={page >= data.pages} onClick={() => onPageChange(page + 1)}>下一页</button></div>}
    </>}
  </div>;
}
