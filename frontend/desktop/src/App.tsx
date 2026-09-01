import { useCallback, useEffect, useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { api, clearToken, getToken, setToken as persistToken } from './lib/api';
import type { ReviewResult, UserInfo, WritingTopic } from './lib/api';
import { TranscribeSession, type AudioSource } from './lib/asr';
import { HistoryPanel } from './components/HistoryPanel';
import { useDesktopStore, type SegItem as StoreSegItem } from './stores/desktopStore';
import { useWordMaterial, useWritingReview, useWritingTopic } from './hooks/useBusiness';
import { useModels } from './hooks/useModels';
import { AuthPanel } from './components/AuthPanel';
import {
  DIFFICULTIES,
  LANGS,
  READING_LANGUAGES,
  READING_STAGES,
  SCENES,
  WRITING_GENRES,
  WRITING_LANGUAGES,
  WRITING_STAGES,
} from './constants';
import './App.css';

type DesktopMode = 'toolbar' | 'platform';
export type PlatformPanel = 'translate' | 'vocab' | 'writing' | 'writing-review';

function App() {
  const [mode, setMode] = useState<DesktopMode>('toolbar');
  const [panel, setPanel] = useState<PlatformPanel>('translate');
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState<UserInfo | null>(null);

  // 悬浮条与听力页共享的模型/语言配置，保证两边行为一致
  const [sharedConfig, setSharedConfig] = useState<{
    asrModel: string;
    llmModel: string;
    audioSource: AudioSource;
    sourceLang: string;
    targetLang: string;
  }>({
    asrModel: '',
    llmModel: '',
    audioSource: 'mic',
    sourceLang: 'en',
    targetLang: 'zh',
  });

  const handleResize = useCallback(
    (edge: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.electronAPI?.startResize?.(edge);
    },
    []
  );

  const openPanel = useCallback((nextPanel: PlatformPanel) => {
    setPanel(nextPanel);
    setMode('platform');
    window.electronAPI?.setWindowMode?.('platform');
  }, []);

  // 监听主进程的模式变化（如托盘菜单「进入平台模式」），
  // 避免窗口已切到大尺寸但渲染层仍是悬浮条，导致大片空白。
  useEffect(() => {
    window.electronAPI?.onAppModeChanged?.((next) => {
      setMode(next === 'platform' ? 'platform' : 'toolbar');
    });
  }, []);

  // 登录态 → 拉取用户信息
  useEffect(() => {
    if (!token) return;
    api
      .userInfo()
      .then(setUser)
      .catch(() => {
        clearToken();
        setToken('');
        setUser(null);
      });
  }, [token]);

  const handleLogin = useCallback((nextToken: string) => {
    persistToken(nextToken);
    setToken(nextToken);
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setToken('');
    setUser(null);
  }, []);

  // ============ 唯一的转译会话 ============
  // 悬浮条与桌面平台听力面板共用同一个 session 与同一份 store 数据，
  // 因此在任意一端开始转译，另一端都能看到实时输出。
  //
  // 注意：这里只订阅 store 的 action（引用恒定），
  // 不能用 useDesktopStore() 订阅整个 state，否则 state 变化会让
  // startTranscribe 重建 → 注入 effect 重跑 → 再次更新 state，形成死循环。
  const sessionRef = useRef<TranscribeSession | null>(null);
  const setSegments = useDesktopStore((s) => s.setSegments);
  const setRecording = useDesktopStore((s) => s.setRecording);
  const setTranscribeStatus = useDesktopStore((s) => s.setTranscribeStatus);
  const setTranscribeError = useDesktopStore((s) => s.setTranscribeError);
  const setLatency = useDesktopStore((s) => s.setLatency);
  const resetTranscript = useDesktopStore((s) => s.resetTranscript);

  const stopTranscribe = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setRecording(false);
  }, [setRecording]);

  const startTranscribe = useCallback(async () => {
    if (!token) {
      setTranscribeError('请先登录后再开始转译');
      return;
    }
    if (!sharedConfig.asrModel || !sharedConfig.llmModel) {
      setTranscribeError('请先配置 ASR 和翻译模型');
      return;
    }
    setTranscribeError('');
    resetTranscript();

    const session = new TranscribeSession({
      onSegments: setSegments,
      onStatus: setTranscribeStatus,
      onLatency: setLatency,
      onError: setTranscribeError,
    });
    sessionRef.current = session;
    setRecording(true);
    await session.start({
      audioSource: sharedConfig.audioSource,
      sourceLang: sharedConfig.sourceLang,
      targetLang: sharedConfig.targetLang,
    });
  }, [
    token,
    sharedConfig,
    setSegments,
    setRecording,
    setTranscribeStatus,
    setTranscribeError,
    setLatency,
    resetTranscript,
  ]);

  // 把转译控制注入 store，使悬浮条无需层层透传 props 即可启停同一会话
  useEffect(() => {
    useDesktopStore.getState().setTranscribeControls(() => startTranscribe(), () => stopTranscribe());
  }, [startTranscribe, stopTranscribe]);

  // 卸载时释放音频/WS 资源
  useEffect(() => () => sessionRef.current?.stop(), []);

  return (
    <div className={`app-container ${mode === 'platform' ? 'platform-mode' : ''}`}>
      {mode === 'toolbar' ? (
        <Toolbar
          token={token}
          config={sharedConfig}
          onConfigChange={(patch) => setSharedConfig((prev) => ({ ...prev, ...patch }))}
          onOpenPanel={openPanel}
        />
      ) : (
        <DesktopShell
          activePanel={panel}
          token={token}
          user={user}
          config={sharedConfig}
          onConfigChange={(patch) => setSharedConfig((prev) => ({ ...prev, ...patch }))}
          onPanelChange={setPanel}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onStartTranscribe={startTranscribe}
          onStopTranscribe={stopTranscribe}
          onBackToToolbar={() => {
            setMode('toolbar');
            window.electronAPI?.setWindowMode?.('toolbar');
          }}
        />
      )}
      <ResizeHandles onResize={handleResize} />
    </div>
  );
}

interface SharedConfig {
  asrModel: string;
  llmModel: string;
  audioSource: AudioSource;
  sourceLang: string;
  targetLang: string;
}

function DesktopShell(props: {
  activePanel: PlatformPanel;
  token: string;
  user: UserInfo | null;
  config: SharedConfig;
  onConfigChange: (patch: Partial<SharedConfig>) => void;
  onPanelChange: (panel: PlatformPanel) => void;
  onLogin: (token: string) => void;
  onLogout: () => void;
  onStartTranscribe: () => void;
  onStopTranscribe: () => void;
  onBackToToolbar: () => void;
}) {
  const {
    activePanel,
    token,
    user,
    config,
    onConfigChange,
    onPanelChange,
    onLogin,
    onLogout,
    onStartTranscribe,
    onStopTranscribe,
    onBackToToolbar,
  } = props;
  const panelTitle = {
    translate: '听力 · 实时转译',
    vocab: '阅读 · 单词素材',
    writing: '写作 · 题目生成',
    'writing-review': '写作 · 作文批阅',
  }[activePanel];

  return (
    <div className="desktop-shell">
      <aside className="desktop-sidebar">
        <div className="desktop-brand">
          <span>语</span>
          <strong>智语同航</strong>
        </div>
        <NavButton active={activePanel === 'translate'} onClick={() => onPanelChange('translate')} icon="🎧" label="听力" />
        <NavButton active={activePanel === 'vocab'} onClick={() => onPanelChange('vocab')} icon="📖" label="阅读" />
        <NavButton active={activePanel === 'writing'} onClick={() => onPanelChange('writing')} icon="✍️" label="写作" />
        <NavButton active={activePanel === 'writing-review'} onClick={() => onPanelChange('writing-review')} icon="📝" label="批阅" />
        <div className="desktop-sidebar-spacer" />
        <button className="desktop-link-btn" onClick={onBackToToolbar}>
          悬浮模式
        </button>
        {token && (
          <button className="desktop-link-btn" onClick={onLogout}>
            退出登录
          </button>
        )}
      </aside>
      <main className="desktop-main">
        <header className="desktop-header">
          <div>
            <div className="desktop-title">{panelTitle}</div>
            <div className="desktop-subtitle">桌面端原生页面，复用平台端同一后端接口</div>
          </div>
          <div className="desktop-user">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username || '用户头像'} />
            ) : (
              <span>{user?.username?.[0] || 'U'}</span>
            )}
            <div>
              <strong>{user?.username || '未登录'}</strong>
              {/* 显示 userId，便于核对桌面端与平台端是否为同一账号（同账号=同一份数据） */}
              {user?.id != null && <div className="desktop-user-id">ID {user.id} · {user.account || ''}</div>}
            </div>
          </div>
        </header>
        <section className="desktop-content">
          {!token ? (
            <AuthPanel onLogin={onLogin} />
          ) : (
            <>
              <ModelPanel token={token} />
              {activePanel === 'translate' && (
                <ListeningPanel
                  config={config}
                  onConfigChange={onConfigChange}
                  onStartTranscribe={onStartTranscribe}
                  onStopTranscribe={onStopTranscribe}
                />
              )}
              {activePanel === 'vocab' && <WordPanel />}
              {activePanel === 'writing' && <WritingPanel />}
              {activePanel === 'writing-review' && <WritingReviewPanel />}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

// 登录/注册/找回统一由 AuthPanel 承载，能力对齐平台端
// （原 LoginPanel 仅支持账号密码，已移除）

/**
 * 模型选择面板。
 * 与平台端一致：ASR 独立选择，LLM 翻译模型单独选择，
 * 纠错模型与翻译模型保持一体（后端 CorrectionAgent 复用同一份 LLM 偏好）。
 */
function ModelPanel({ token }: { token: string }) {
  const {
    asrProviders, llmProviders, asrModels, llmModels,
    asrProvider, setAsrProvider, llmProvider, setLlmProvider,
    asrModel, llmModel, setConfig, loadModels, savePreference, toast,
  } = useModels(token);
  const config = { asrModel, llmModel };

  return (
    <div className="desktop-card model-card">
      <div className="panel-grid two">
        <SelectField
          label="ASR 厂商"
          value={asrProvider}
          options={asrProviders.map((p) => ({ value: p.key, label: p.name }))}
          onChange={(v) => {
            setAsrProvider(v);
            setConfig({ asrModel: '' });
            loadModels('ASR', v);
          }}
        />
        <SelectField
          label="ASR 模型"
          value={config.asrModel}
          options={asrModels.map((m) => ({ value: m.name, label: m.display }))}
          onChange={(v) => {
            setConfig({ asrModel: v });
            savePreference('ASR', asrProvider, v);
          }}
        />
        <SelectField
          label="LLM 厂商"
          value={llmProvider}
          options={llmProviders.map((p) => ({ value: p.key, label: p.name }))}
          onChange={(v) => {
            setLlmProvider(v);
            setConfig({ llmModel: '' });
            loadModels('LLM', v);
          }}
        />
        <SelectField
          label="翻译模型"
          value={config.llmModel}
          options={llmModels.map((m) => ({ value: m.name, label: m.display }))}
          onChange={(v) => {
            setConfig({ llmModel: v });
            savePreference('LLM', llmProvider, v);
          }}
        />
      </div>
      {/* 纠错与翻译一体：后端 CorrectionAgent 复用同一份 LLM 偏好 */}
      <div className="correction-tip">
        <span>纠错模型</span>
        <strong>{llmModels.find((m) => m.name === config.llmModel)?.display || config.llmModel || '（随翻译）'}</strong>
        <em>与翻译保持一致</em>
      </div>
      {toast && <div className="desktop-toast">{toast}</div>}
    </div>
  );
}

/**
 * 听力面板：与桌面端悬浮条共用同一份 store 与同一个转译会话，
 * 因此悬浮条开始转译后切到本面板，能看到完全一致的实时输出。
 */
function ListeningPanel({
  config,
  onConfigChange,
  onStartTranscribe,
  onStopTranscribe,
}: {
  config: SharedConfig;
  onConfigChange: (patch: Partial<SharedConfig>) => void;
  onStartTranscribe: () => void;
  onStopTranscribe: () => void;
}) {
  const { segments, recording, transcribeStatus, transcribeError, latency } = useDesktopStore();
  const status = transcribeStatus;
  const error = transcribeError;
  const start = onStartTranscribe;
  const stop = onStopTranscribe;

  const latest = segments[segments.length - 1];

  return (
    <div className="desktop-card">
      <div className="panel-grid two">
        <TranscriptList
          title="源语言"
          lang={LANGS.find((l) => l.code === config.sourceLang)?.label || config.sourceLang}
          segments={segments}
          field="source"
          recording={recording}
        />
        <TranscriptList
          title="译文"
          lang={LANGS.find((l) => l.code === config.targetLang)?.label || config.targetLang}
          segments={segments}
          field="target"
          recording={recording}
        />
      </div>
      <div className="desktop-control-row">
        <SelectField
          label="音频源"
          value={config.audioSource}
          options={[
            { value: 'mic', label: '麦克风' },
            { value: 'speaker', label: '扬声器/屏幕共享' },
          ]}
          onChange={(v) => onConfigChange({ audioSource: v as AudioSource })}
        />
        <SelectField
          label="源语言"
          value={config.sourceLang}
          options={LANGS.map((l) => ({ value: l.code, label: l.label }))}
          onChange={(v) => onConfigChange({ sourceLang: v })}
        />
        <SelectField
          label="目标语言"
          value={config.targetLang}
          options={LANGS.map((l) => ({ value: l.code, label: l.label }))}
          onChange={(v) => onConfigChange({ targetLang: v })}
        />
        <button className={`round-record ${recording ? 'recording' : ''}`} onClick={recording ? stop : start}>
          {recording ? '停' : '录'}
        </button>
        <span className="status-pill">{status}</span>
        {latency != null && <span className="status-pill">延迟 ~{latency}ms</span>}
        {latest?.corrected && <span className="status-pill corrected">已纠错</span>}
      </div>
      {error && <div className="desktop-error">{error}</div>}
    </div>
  );
}

/** 多句累积展示，对齐平台端 RealTimeTrans 的行为 */
function TranscriptList({
  title,
  lang,
  segments,
  field,
  recording,
}: {
  title: string;
  lang: string;
  segments: StoreSegItem[];
  field: 'source' | 'target';
  recording: boolean;
}) {
  return (
    <div className="transcript-list">
      <div className="transcript-head">
        <strong>
          {title} · {lang}
        </strong>
      </div>
      <div className="transcript-body">
        {segments.length === 0 ? (
          <p className="transcript-placeholder">{recording ? '等待语音输入...' : '点击录音按钮开始'}</p>
        ) : (
          segments.map((s) => (
            <div className="transcript-item" key={s.id}>
              <div className="transcript-meta">
                <span>{s.time}</span>
                {field === 'source' && s.corrected && <span className="badge-corrected">已纠错</span>}
              </div>
              <div className="transcript-text">{s[field] || (field === 'target' && recording ? '…' : '')}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * 阅读面板：与悬浮条「阅读」模式复用同一个 hook，
 * 因此两端操作的是同一份数据，互为补充（这里额外提供历史与完整配置）。
 */
function WordPanel() {
  const {
    word, setWord, language, setLanguage, stage, setStage,
    loading, error, result, generate, restore, refreshKey,
  } = useWordMaterial();

  const fetchHistory = useCallback((page: number, size: number) => api.pageWordHistory(page, size), []);

  return (
    <div className="desktop-card">
      <div className="panel-grid three">
        <SelectField
          label="语言"
          value={language}
          options={READING_LANGUAGES.map((i) => ({ value: i.code, label: i.desc }))}
          onChange={setLanguage}
        />
        <SelectField
          label="学习阶段"
          value={stage}
          options={READING_STAGES.map((i) => ({ value: i.code, label: i.desc }))}
          onChange={setStage}
        />
        <InputField label="单词" value={word} onChange={setWord} placeholder="例如：apple" />
      </div>
      <div className="desktop-control-row">
        <button className="desktop-primary" onClick={generate} disabled={loading}>
          {loading ? '生成中...' : '生成单词素材'}
        </button>
      </div>
      {error && <div className="desktop-error">{error}</div>}
      {result && (
        <ResultBlock
          imageUrl={result.imageUrl}
          title={result.word || word}
          lines={[result.sentence, result.translation]}
        />
      )}
      <HistoryPanel
        title="历史记录"
        fetcher={fetchHistory}
        renderTitle={(item) => item.word || '(未命名)'}
        renderSummary={(item) => item.translation || item.sentence || ''}
        onSelect={restore}
        busy={loading}
        refreshKey={refreshKey}
      />
    </div>
  );
}

/**
 * 写作面板：与悬浮条「写作」模式复用同一个 hook，
 * 这里作为补充，额外提供场景、自定义场景与历史记录。
 */
function WritingPanel() {
  const {
    language, setLanguage, stage, setStage, genre, setGenre,
    difficulty, setDifficulty, scene, setScene, customScene, setCustomScene,
    loading, error, topic, generate, restore, refreshKey,
  } = useWritingTopic();
  const genres = WRITING_GENRES.filter((g) => g.stage === stage);

  const fetchHistory = useCallback((page: number, size: number) => api.pageGenerationHistory(page, size), []);

  return (
    <div className="desktop-card">
      <div className="panel-grid four">
        <SelectField
          label="语言"
          value={language}
          options={WRITING_LANGUAGES.map((i) => ({ value: i.code, label: i.desc }))}
          onChange={setLanguage}
        />
        <SelectField
          label="学段"
          value={stage}
          options={WRITING_STAGES.map((i) => ({ value: i.code, label: i.desc }))}
          onChange={(v) => {
            setStage(v);
            setGenre(WRITING_GENRES.find((g) => g.stage === v)?.code || '');
          }}
        />
        <SelectField
          label="题型"
          value={genre}
          options={genres.map((i) => ({ value: i.code, label: i.desc }))}
          onChange={setGenre}
        />
        <SelectField
          label="难度"
          value={difficulty}
          options={DIFFICULTIES.map((i) => ({ value: i.code, label: i.desc }))}
          onChange={setDifficulty}
        />
        <SelectField
          label="场景"
          value={scene}
          options={SCENES.map((i) => ({ value: i.code, label: i.desc }))}
          onChange={setScene}
        />
        {scene === 'custom' && (
          <InputField label="自定义场景" value={customScene} onChange={setCustomScene} placeholder="请输入场景" />
        )}
      </div>
      <div className="desktop-control-row">
        <button className="desktop-primary" onClick={generate} disabled={loading}>
          {loading ? '生成中...' : '生成写作题目'}
        </button>
      </div>
      {error && <div className="desktop-error">{error}</div>}
      {topic && <TopicView topic={topic} />}
      <HistoryPanel
        title="历史记录"
        fetcher={fetchHistory}
        renderTitle={(item) => item.title || item.prompt?.slice(0, 28) || '(未命名)'}
        renderSummary={(item) => item.prompt || ''}
        onSelect={restore}
        busy={loading}
        refreshKey={refreshKey}
      />
    </div>
  );
}

/**
 * 批阅面板：与悬浮条「批阅」模式复用同一个 hook，
 * 这里作为补充，额外提供正文输入、图片上传与历史记录。
 */
function WritingReviewPanel() {
  const {
    submitType, setSubmitType, language, setLanguage, stage, setStage, genre, setGenre,
    title, setTitle, prompt, setPrompt, scoringCriteria, setScoringCriteria,
    content, setContent, imageUrls,
    loading, uploading, error, review, evaluate, restore, handleUpload, refreshKey,
  } = useWritingReview();
  const fileRef = useRef<HTMLInputElement>(null);
  const genres = WRITING_GENRES.filter((g) => g.stage === stage);

  const fetchHistory = useCallback((page: number, size: number) => api.pageEvaluationHistory(page, size), []);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleUpload(files);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="desktop-card">
      <div className="panel-grid three">
        <SelectField
          label="语言"
          value={language}
          options={WRITING_LANGUAGES.map((i) => ({ value: i.code, label: i.desc }))}
          onChange={setLanguage}
        />
        <SelectField
          label="学段"
          value={stage}
          options={WRITING_STAGES.map((i) => ({ value: i.code, label: i.desc }))}
          onChange={(v) => {
            setStage(v);
            setGenre(WRITING_GENRES.find((g) => g.stage === v)?.code || '');
          }}
        />
        <SelectField
          label="题型"
          value={genre}
          options={genres.map((i) => ({ value: i.code, label: i.desc }))}
          onChange={setGenre}
        />
      </div>
      <div className="panel-grid two">
        <InputField label="作文题干" value={prompt} onChange={setPrompt} placeholder="请输入题干" />
        <InputField label="评分标准" value={scoringCriteria} onChange={setScoringCriteria} placeholder="例如：15" />
      </div>
      <div className="segmented">
        <button className={submitType === 'text' ? 'active' : ''} onClick={() => setSubmitType('text')}>
          文本作文
        </button>
        <button className={submitType === 'image' ? 'active' : ''} onClick={() => setSubmitType('image')}>
          图片作文
        </button>
      </div>
      {submitType === 'text' ? (
        <>
          <InputField label="作文题目" value={title} onChange={setTitle} placeholder="可选" />
          <textarea
            className="desktop-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="粘贴作文正文"
          />
        </>
      ) : (
        <div className="image-upload-area">
          {imageUrls.map((url, index) => (
            <img key={url} src={url} alt={`作文图片${index + 1}`} />
          ))}
          <label>
            {uploading ? '上传中...' : '+ 上传图片'}
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPickFile} />
          </label>
        </div>
      )}
      {error && <div className="desktop-error">{error}</div>}
      <div className="desktop-control-row">
        <button className="desktop-primary" onClick={evaluate} disabled={loading || uploading}>
          {loading ? '批阅中...' : '开始批阅'}
        </button>
      </div>
      {review && <ReviewView review={review} />}
      <HistoryPanel
        title="批阅历史"
        fetcher={fetchHistory}
        renderTitle={(item) =>
          item.title || item.prompt?.slice(0, 24) || (item.score != null ? `得分 ${item.score}` : '(未命名)')
        }
        renderSummary={(item) => (item.score != null ? `得分 ${item.score} · ${item.feedback || ''}` : item.feedback || '')}
        onSelect={restore}
        busy={loading || uploading}
        refreshKey={refreshKey}
      />
    </div>
  );
}

function ResizeHandles({ onResize }: { onResize: (edge: string) => (e: React.MouseEvent) => void }) {
  const edges = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
  return (
    <>
      {edges.map((edge) => (
        <div key={edge} className={`resize-edge ${edge}`} onMouseDown={onResize(edge)} />
      ))}
    </>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button className={`desktop-nav ${active ? 'active' : ''}`} onClick={onClick}>
      <span>{icon}</span>
      {label}
    </button>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="desktop-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">请选择</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="desktop-field">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function ResultBlock({
  imageUrl,
  title,
  lines,
}: {
  imageUrl?: string;
  title: string;
  lines: Array<string | undefined>;
}) {
  return (
    <div className="result-block">
      {imageUrl && <img src={imageUrl} alt={title} />}
      <h3>{title}</h3>
      {lines.filter(Boolean).map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
  );
}

function TopicView({ topic }: { topic: WritingTopic }) {
  return (
    <div className="result-block">
      <h3>{topic.title}</h3>
      <p>{topic.prompt}</p>
      <p>{topic.requirement}</p>
      {(topic.wordLimitMin || topic.wordLimitMax) && (
        <p className="muted">
          字数建议：{topic.wordLimitMin} ~ {topic.wordLimitMax}
        </p>
      )}
      <ListBlock title="写作要点" items={topic.keyPoints} />
      <ListBlock title="词汇提示" items={topic.vocabularyHints} />
      <ListBlock title="结构提示" items={topic.structureHints} />
      <ListBlock title="评分标准" items={topic.scoringCriteria} />
    </div>
  );
}

function ReviewView({ review }: { review: ReviewResult }) {
  return (
    <div className="result-block">
      <h3>批阅报告 · 总分 {review.score}</h3>
      {review.feedback && <p>{review.feedback}</p>}
      {review.suggestion && <p>{review.suggestion}</p>}
      <ListBlock title="作文亮点" items={review.highlights} />
      <ListBlock title="重点弥补项" items={review.improvementPoints} />
      {review.sentenceFeedback?.map((item, index) => (
        <div className="sentence-feedback" key={index}>
          <strong>第 {item.index ?? index + 1} 句</strong>
          <p>{item.original}</p>
          <p>{item.feedback}</p>
          <p>{item.suggestion}</p>
        </div>
      ))}
      {review.improvedVersion && <pre>{review.improvedVersion}</pre>}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="list-block">
      <strong>{title}</strong>
      {items.map((item, index) => (
        <span key={index}>{item}</span>
      ))}
    </div>
  );
}

export default App;
