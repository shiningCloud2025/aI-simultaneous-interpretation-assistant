import { useEffect, useRef, useState } from 'react';
import type { PlatformPanel } from '../App';
import { APP_ORIGIN } from '../lib/api';
import type { AudioSource } from '../lib/asr';
import { useDesktopStore } from '../stores/desktopStore';
import {
  useWordMaterial,
  useWritingReview,
  useWritingTopic,
} from '../hooks/useBusiness';
import {
  DIFFICULTIES,
  LANGS,
  READING_LANGUAGES,
  READING_STAGES,
  SCENES,
  WRITING_GENRES,
  WRITING_LANGUAGES,
  WRITING_STAGES,
} from '../constants';
import { ToolSelect, ToolInput, ToolButton } from './ToolField';
import { ModelSettings } from './ModelSettings';
import './Toolbar.css';

interface ToolbarProps {
  token: string;
  config: {
    asrModel: string;
    llmModel: string;
    audioSource: AudioSource;
    sourceLang: string;
    targetLang: string;
  };
  onConfigChange: (patch: Partial<ToolbarProps['config']>) => void;
  onOpenPanel: (panel: PlatformPanel) => void;
}

type ToolMode = 'translate' | 'vocab' | 'writing' | 'writing-review';

const MODES: Array<{ id: ToolMode; icon: string; label: string }> = [
  { id: 'translate', icon: '🎧', label: '听力' },
  { id: 'vocab', icon: '📖', label: '阅读' },
  { id: 'writing', icon: '✍️', label: '写作' },
  { id: 'writing-review', icon: '📝', label: '批阅' },
];

export function Toolbar({ token, config, onConfigChange, onOpenPanel }: ToolbarProps) {
  const { audioSource, sourceLang, targetLang } = config;

  // 转译状态与桌面平台共享
  const segments = useDesktopStore((s) => s.segments);
  const recording = useDesktopStore((s) => s.recording);
  const status = useDesktopStore((s) => s.transcribeStatus);
  const error = useDesktopStore((s) => s.transcribeError);
  const startTranscribe = useDesktopStore((s) => s.startTranscribe);
  const stopTranscribe = useDesktopStore((s) => s.stopTranscribe);

  // 当前模式：决定悬浮条上显示哪一套控件
  const [mode, setMode] = useState<ToolMode>(
    () => (localStorage.getItem('desktop-tool-mode') as ToolMode) || 'translate'
  );
  useEffect(() => {
    localStorage.setItem('desktop-tool-mode', mode);
  }, [mode]);

  // 各模式业务（与桌面平台复用同一份 hook，数据天然互通）
  const word = useWordMaterial();
  const topic = useWritingTopic();
  const review = useWritingReview();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // 展开后显示当前模式的完整选项（语言、场景等），收起时只留核心控件
  const [expanded, setExpanded] = useState(false);
  const [showModels, setShowModels] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleRecord = () => {
    if (!token) {
      useDesktopStore.getState().setTranscribeError('请先登录');
      return;
    }
    if (recording) stopTranscribe();
    else startTranscribe();
  };

  const langLabel = (code: string) => LANGS.find((l) => l.code === code)?.label || code;
  const latest = segments[segments.length - 1];
  // 未登录时，阅读/写作/批阅需要提示先登录
  const needLogin = !token && mode !== 'translate' && !showModels;

  return (
    <div className="toolbar-wrapper" ref={dropdownRef}>
      <div className="toolbar">
        <span className="drag-handle">⋮⋮</span>

        {/* 模式切换：听力 / 阅读 / 写作 / 批阅 */}
        <div className="business-switch">
          {MODES.map((item) => (
            <button
              key={item.id}
              className={`business-btn ${mode === item.id ? 'active' : ''}`}
              onClick={() => setMode(item.id)}
              title={`切换到${item.label}模式`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="tb-divider" />

        {/* ===== 各模式专属控件 ===== */}
        {mode === 'translate' && (
          <>
            <button className={`tb-btn ${recording ? 'mic-active' : ''}`} onClick={toggleRecord} title="开始/停止实时转译">
              🎤
            </button>
            <ToolSelect
              id="audioSource"
              label="音源"
              value={audioSource}
              open={openDropdown}
              setOpen={setOpenDropdown}
              options={[
                { value: 'mic', label: '麦克风' },
                { value: 'speaker', label: '扬声器' },
              ]}
              onChange={(v) => onConfigChange({ audioSource: v as AudioSource })}
            />
            <ToolSelect
              id="sourceLang"
              label="识别"
              value={sourceLang}
              open={openDropdown}
              setOpen={setOpenDropdown}
              options={LANGS.map((l) => ({ value: l.code, label: l.label }))}
              onChange={(v) => onConfigChange({ sourceLang: v })}
            />
            <ToolSelect
              id="targetLang"
              label="译文"
              value={targetLang}
              open={openDropdown}
              setOpen={setOpenDropdown}
              options={LANGS.map((l) => ({ value: l.code, label: l.label }))}
              onChange={(v) => onConfigChange({ targetLang: v })}
            />
            {recording && <span className="tb-status">{status}</span>}
          </>
        )}

        {mode === 'vocab' && (
          <>
            <ToolInput value={word.word} onChange={word.setWord} placeholder="输入单词" width={120} />
            <ToolSelect
              id="vocab-stage"
              label="学段"
              value={word.stage}
              open={openDropdown}
              setOpen={setOpenDropdown}
              options={READING_STAGES.map((i) => ({ value: i.code, label: i.desc }))}
              onChange={word.setStage}
            />
            {expanded && (
              <ToolSelect
                id="vocab-lang"
                label="语言"
                value={word.language}
                open={openDropdown}
                setOpen={setOpenDropdown}
                options={READING_LANGUAGES.map((i) => ({ value: i.code, label: i.desc }))}
                onChange={word.setLanguage}
              />
            )}
            <ToolButton onClick={word.generate} disabled={word.loading}>
              {word.loading ? '生成中' : '生成'}
            </ToolButton>
          </>
        )}

        {mode === 'writing' && (
          <>
            <ToolSelect
              id="w-stage"
              label="学段"
              value={topic.stage}
              open={openDropdown}
              setOpen={setOpenDropdown}
              options={WRITING_STAGES.map((i) => ({ value: i.code, label: i.desc }))}
              onChange={(v) => {
                topic.setStage(v);
                topic.setGenre(WRITING_GENRES.find((g) => g.stage === v)?.code || '');
              }}
            />
            <ToolSelect
              id="w-genre"
              label="题型"
              value={topic.genre}
              open={openDropdown}
              setOpen={setOpenDropdown}
              options={WRITING_GENRES.filter((g) => g.stage === topic.stage).map((i) => ({
                value: i.code,
                label: i.desc,
              }))}
              onChange={topic.setGenre}
            />
            <ToolSelect
              id="w-diff"
              label="难度"
              value={topic.difficulty}
              open={openDropdown}
              setOpen={setOpenDropdown}
              options={DIFFICULTIES.map((i) => ({ value: i.code, label: i.desc }))}
              onChange={topic.setDifficulty}
            />
            {expanded && (
              <>
                <ToolSelect
                  id="w-scene"
                  label="场景"
                  value={topic.scene}
                  open={openDropdown}
                  setOpen={setOpenDropdown}
                  options={SCENES.map((i) => ({ value: i.code, label: i.desc }))}
                  onChange={topic.setScene}
                />
                {topic.scene === 'custom' && (
                  <ToolInput
                    value={topic.customScene}
                    onChange={topic.setCustomScene}
                    placeholder="自定义场景"
                    width={110}
                  />
                )}
                <ToolSelect
                  id="w-lang"
                  label="语言"
                  value={topic.language}
                  open={openDropdown}
                  setOpen={setOpenDropdown}
                  options={WRITING_LANGUAGES.map((i) => ({ value: i.code, label: i.desc }))}
                  onChange={topic.setLanguage}
                />
              </>
            )}
            <ToolButton onClick={topic.generate} disabled={topic.loading}>
              {topic.loading ? '出题' : '出题'}
            </ToolButton>
          </>
        )}

        {mode === 'writing-review' && (
          <>
            <ToolInput value={review.prompt} onChange={review.setPrompt} placeholder="作文题干" width={150} />
            <ToolInput
              value={review.scoringCriteria}
              onChange={review.setScoringCriteria}
              placeholder="评分标准"
              width={80}
            />
            {expanded && (
              <>
                <ToolSelect
                  id="r-type"
                  label="提交"
                  value={review.submitType}
                  open={openDropdown}
                  setOpen={setOpenDropdown}
                  options={[
                    { value: 'text', label: '文本' },
                    { value: 'image', label: '图片' },
                  ]}
                  onChange={(v) => review.setSubmitType(v as 'text' | 'image')}
                />
                <ToolSelect
                  id="r-stage"
                  label="学段"
                  value={review.stage}
                  open={openDropdown}
                  setOpen={setOpenDropdown}
                  options={WRITING_STAGES.map((i) => ({ value: i.code, label: i.desc }))}
                  onChange={(v) => {
                    review.setStage(v);
                    review.setGenre(WRITING_GENRES.find((g) => g.stage === v)?.code || '');
                  }}
                />
                <ToolSelect
                  id="r-genre"
                  label="题型"
                  value={review.genre}
                  open={openDropdown}
                  setOpen={setOpenDropdown}
                  options={WRITING_GENRES.filter((g) => g.stage === review.stage).map((i) => ({
                    value: i.code,
                    label: i.desc,
                  }))}
                  onChange={review.setGenre}
                />
              </>
            )}
            <ToolButton onClick={review.evaluate} disabled={review.loading}>
              {review.loading ? '批阅' : '批阅'}
            </ToolButton>
          </>
        )}

        <div className="tb-divider" />

        {/* 模型设置：直接在悬浮条内选择，不必进入桌面平台 */}
        <button
          className={`tb-btn ${showModels ? 'active' : ''}`}
          onClick={() => setShowModels((v) => !v)}
          title="模型设置（ASR / 翻译）"
        >
          ⚙
        </button>
        {/* 展开/收起当前模式的完整选项 */}
        {mode !== 'translate' && (
          <button className="tb-btn" onClick={() => setExpanded((v) => !v)} title="展开更多选项">
            {expanded ? '⌃' : '⌄'}
          </button>
        )}

        {/* 进入桌面平台（补充：历史/详细配置） */}
        <button className="tb-btn" onClick={() => onOpenPanel(mode)} title="打开桌面平台查看历史与详细配置">
          🖥
        </button>
        <button
          className="tb-btn"
          onClick={() => window.electronAPI?.openPlatformExternal?.(APP_ORIGIN)}
          title="在系统浏览器中打开平台端"
        >
          🌐
        </button>
        <button className="tb-btn" onClick={() => window.electronAPI?.toggleFullscreen?.()} title="切换全屏">
          ⛶
        </button>
        <button className="tb-btn" onClick={() => window.electronAPI?.hideToolbar?.()} title="隐藏到托盘">
          −
        </button>
      </div>

      {/* ===== 模型设置（悬浮条内直接选择） ===== */}
      {showModels && (
        <div className="transcript-box">
          <ModelSettings token={token} />
        </div>
      )}

      {/* ===== 结果区：随模式展示，操作与结果都在悬浮条内完成 ===== */}
      {needLogin ? (
        <div className="transcript-box">
          <div className="transcript-row">
            <span className="lang-tag">提示</span>
            <span className="transcript-text">请先登录后再使用{mode === 'vocab' ? '阅读' : mode === 'writing' ? '写作' : '批阅'}功能</span>
          </div>
        </div>
      ) : (
        <>
          {mode === 'translate' && (segments.length > 0 || error) && (
            <div className="transcript-box">
              {error && (
                <div className="transcript-row">
                  <span className="lang-tag">错误</span>
                  <span className="transcript-text">{error}</span>
                </div>
              )}
              {segments.slice(-3).map((seg) => (
                <div className="transcript-row" key={seg.id}>
                  <span className="lang-tag">{langLabel(sourceLang)}</span>
                  <span className="transcript-text">{seg.source}</span>
                </div>
              ))}
              {latest && (
                <div className="transcript-row">
                  <span className="lang-tag target">{langLabel(targetLang)}</span>
                  <span className="transcript-text">{latest.target || '…'}</span>
                </div>
              )}
            </div>
          )}

          {mode === 'vocab' && (word.error || word.result) && (
            <div className="transcript-box">
              {word.error && (
                <div className="transcript-row">
                  <span className="lang-tag">错误</span>
                  <span className="transcript-text">{word.error}</span>
                </div>
              )}
              {word.result && (
                <>
                  <div className="transcript-row">
                    <span className="lang-tag">单词</span>
                    <span className="transcript-text">
                      <strong>{word.result.word}</strong>
                      {word.result.translation ? ` · ${word.result.translation}` : ''}
                    </span>
                  </div>
                  {word.result.sentence && (
                    <div className="transcript-row">
                      <span className="lang-tag target">例句</span>
                      <span className="transcript-text">{word.result.sentence}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {mode === 'writing' && (topic.error || topic.topic) && (
            <div className="transcript-box">
              {topic.error && (
                <div className="transcript-row">
                  <span className="lang-tag">错误</span>
                  <span className="transcript-text">{topic.error}</span>
                </div>
              )}
              {topic.topic && (
                <>
                  <div className="transcript-row">
                    <span className="lang-tag">题目</span>
                    <span className="transcript-text">
                      <strong>{topic.topic.title}</strong>
                    </span>
                  </div>
                  <div className="transcript-row">
                    <span className="lang-tag target">题干</span>
                    <span className="transcript-text">{topic.topic.prompt}</span>
                  </div>
                  {topic.topic.requirement && (
                    <div className="transcript-row">
                      <span className="lang-tag">要求</span>
                      <span className="transcript-text">{topic.topic.requirement}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {mode === 'writing-review' && (review.error || review.review) && (
            <div className="transcript-box">
              {review.error && (
                <div className="transcript-row">
                  <span className="lang-tag">错误</span>
                  <span className="transcript-text">{review.error}</span>
                </div>
              )}
              {review.review && (
                <>
                  <div className="transcript-row">
                    <span className="lang-tag target">得分</span>
                    <span className="transcript-text">
                      <strong>{review.review.score}</strong>
                    </span>
                  </div>
                  {review.review.feedback && (
                    <div className="transcript-row">
                      <span className="lang-tag">反馈</span>
                      <span className="transcript-text">{review.review.feedback}</span>
                    </div>
                  )}
                  {review.review.suggestion && (
                    <div className="transcript-row">
                      <span className="lang-tag">建议</span>
                      <span className="transcript-text">{review.review.suggestion}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
