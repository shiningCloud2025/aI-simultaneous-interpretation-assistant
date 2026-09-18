import { useCallback, useEffect, useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { api, clearToken, getToken, setToken as persistToken, uploadFile } from './lib/api';
import type {
  EvaluationRecord,
  PlatformSkill,
  ReviewResult,
  TutorHistoryMessage,
  UserInfo,
  WritingTopic,
} from './lib/api';
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
export type PlatformPanel = 'translate' | 'vocab' | 'writing' | 'writing-review' | 'writing-tutor';

const getLastDesktopPanel = (): PlatformPanel => {
  const saved = localStorage.getItem('desktop-tool-mode') as PlatformPanel | null;
  return saved && ['translate', 'vocab', 'writing', 'writing-review', 'writing-tutor'].includes(saved)
    ? saved
    : 'translate';
};

function App() {
  const [mode, setMode] = useState<DesktopMode>('toolbar');
  const [panel, setPanel] = useState<PlatformPanel>(getLastDesktopPanel);
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
      if (next === 'platform') {
        setPanel(getLastDesktopPanel());
      }
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
    'writing-tutor': '写作 · 批阅答疑',
  }[activePanel];
  const [showSkills, setShowSkills] = useState(false);
  const [pendingTutorRecord, setPendingTutorRecord] = useState<EvaluationRecord | null>(null);
  const openTutorWithRecord = useCallback(
    (record: EvaluationRecord) => {
      setPendingTutorRecord(record);
      onPanelChange('writing-tutor');
    },
    [onPanelChange]
  );

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
        <NavButton active={activePanel === 'writing-tutor'} onClick={() => onPanelChange('writing-tutor')} icon="💬" label="答疑" />
        <div className="desktop-sidebar-spacer" />
        <button className="desktop-link-btn" onClick={() => setShowSkills(true)}>
          平台 Skill
        </button>
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
              {activePanel === 'writing-review' && <WritingReviewPanel onOpenTutor={openTutorWithRecord} />}
              {activePanel === 'writing-tutor' && (
                <WritingTutorPanel initialRecord={pendingTutorRecord} onInitialRecordUsed={() => setPendingTutorRecord(null)} />
              )}
            </>
          )}
        </section>
      </main>
      {showSkills && <PlatformSkillModal onClose={() => setShowSkills(false)} />}
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
function WritingReviewPanel({ onOpenTutor }: { onOpenTutor: (record: EvaluationRecord) => void }) {
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
        renderActions={(item) => (
          item.success ? (
            <button className="history-action-btn" onClick={() => onOpenTutor(item)}>
              答疑
            </button>
          ) : null
        )}
        busy={loading || uploading}
        refreshKey={refreshKey}
      />
    </div>
  );
}

interface TutorMessage {
  role: 'user' | 'assistant';
  text: string;
  imageUrls?: string[];
}

function WritingTutorPanel({
  initialRecord,
  onInitialRecordUsed,
}: {
  initialRecord: EvaluationRecord | null;
  onInitialRecordUsed: () => void;
}) {
  const [records, setRecords] = useState<EvaluationRecord[]>([]);
  const [selected, setSelected] = useState<EvaluationRecord | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const loadRecords = useCallback(async (nextPage = 1) => {
    setLoadingRecords(true);
    setError('');
    try {
      const data = await api.pageEvaluationHistory(nextPage, 6, { success: true });
      setRecords(data.records || []);
      setPage(data.current || nextPage);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e?.message || '已批阅作文加载失败');
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  const loadMessages = useCallback(async (evaluationId: number) => {
    setLoadingMessages(true);
    setError('');
    try {
      const data = await api.listTutorMessages(evaluationId);
      setMessages((data || []).map(toTutorMessage));
    } catch (e: any) {
      setMessages([]);
      setError(e?.message || '答疑历史加载失败');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const selectRecord = useCallback((record: EvaluationRecord) => {
    setSelected(record);
    setQuestion('');
    setImageUrls([]);
    setMessages([]);
    loadMessages(record.id);
  }, [loadMessages]);

  useEffect(() => {
    loadRecords(1);
  }, [loadRecords]);

  useEffect(() => {
    if (!initialRecord?.id) return;
    selectRecord(initialRecord);
    onInitialRecordUsed();
  }, [initialRecord, onInitialRecordUsed, selectRecord]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatLoading, selected?.id]);

  const handleQuestionUpload = async (files: File[]) => {
    if (files.length === 0) return;
    if (imageUrls.length + files.length > 5) {
      setError('提问图片最多上传 5 张');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadFile<{ url: string }>(file)));
      setImageUrls((prev) => [...prev, ...uploaded.map((file) => file.url).filter(Boolean)].slice(0, 5));
    } catch (e: any) {
      setError(e?.message || '图片上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const sendQuestion = async () => {
    if (!selected) {
      setError('请先选择一条已批阅作文');
      return;
    }
    const text = question.trim();
    if (!text) {
      setError('请输入要咨询的问题');
      return;
    }
    const images = imageUrls.slice();
    setMessages((prev) => [...prev, { role: 'user', text, imageUrls: images }]);
    setQuestion('');
    setImageUrls([]);
    setChatLoading(true);
    setError('');
    try {
      const result = await api.chatWithWritingTutor({
        evaluationId: selected.id,
        question: text,
        imageUrls: images.length > 0 ? images : undefined,
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: result.answer || '这次答疑没有返回内容' }]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'assistant', text: e?.message || 'AI 答疑失败，请稍后再试' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="tutor-layout">
      <aside className="tutor-records desktop-card">
        <div className="tutor-section-head">
          <div>
            <strong>已批阅作文</strong>
            <span>只显示成功批阅记录</span>
          </div>
          <button className="desktop-ghost" onClick={() => loadRecords(1)} disabled={loadingRecords}>
            {loadingRecords ? '刷新中' : '刷新'}
          </button>
        </div>
        <div className="tutor-record-list">
          {records.length === 0 ? (
            <div className="tutor-empty">{loadingRecords ? '正在加载...' : '暂无可答疑的批阅记录'}</div>
          ) : (
            records.map((record) => (
              <button
                key={record.id}
                className={`tutor-record ${selected?.id === record.id ? 'active' : ''}`}
                onClick={() => selectRecord(record)}
              >
                <strong>{record.title || record.prompt?.slice(0, 18) || '作文批阅'}</strong>
                <span>{record.score ?? '-'} 分 · {stageLabel(record.stageCode)} · {formatDesktopTime(record.createTime)}</span>
                <p>{record.suggestion || record.feedback || '进入后围绕本次评阅继续追问。'}</p>
              </button>
            ))
          )}
        </div>
        <div className="tutor-pager">
          <button disabled={page <= 1 || loadingRecords} onClick={() => loadRecords(page - 1)}>上一页</button>
          <span>{page} / {Math.max(1, pages)} · 共 {total} 条</span>
          <button disabled={page >= pages || loadingRecords} onClick={() => loadRecords(page + 1)}>下一页</button>
        </div>
      </aside>

      <section className="tutor-chat desktop-card">
        <div className="tutor-chat-head">
          <div>
            <strong>作文答疑</strong>
            <span>{selected ? `围绕「${selected.title || '作文批阅'}」继续追问` : '选择左侧记录后开始'}</span>
          </div>
          <div className="tutor-head-actions">
            <button className="desktop-ghost" disabled={!selected || loadingMessages} onClick={() => selected && loadMessages(selected.id)}>
              {loadingMessages ? '刷新中' : '刷新历史'}
            </button>
            <button className="desktop-ghost" disabled={messages.length === 0 || chatLoading} onClick={() => setMessages([])}>
              清空本页
            </button>
          </div>
        </div>
        {selected && (
          <div className="tutor-summary">
            <span>{selected.score ?? '-'} 分</span>
            <p>{selected.feedback || selected.suggestion || selected.prompt || '暂无摘要'}</p>
          </div>
        )}
        {error && <div className="desktop-error">{error}</div>}
        <div className="tutor-chat-body" ref={bodyRef}>
          {!selected ? (
            <div className="tutor-empty">从左侧选一条批阅记录，桌面平台会进入连续答疑空间。</div>
          ) : loadingMessages ? (
            <div className="tutor-empty">正在读取历史答疑...</div>
          ) : messages.length === 0 ? (
            <div className="tutor-empty">
              <strong>这次评阅还没有历史答疑</strong>
              <div className="tutor-quick-grid">
                {['这篇作文主要为什么扣分？', '帮我把修改建议拆成三步。', '第二段怎么写更自然？', '这次评分合理吗？'].map((text) => (
                  <button key={text} onClick={() => setQuestion(text)}>{text}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => <TutorBubble key={index} message={message} />)
          )}
          {chatLoading && <div className="tutor-thinking">AI 正在整理回答...</div>}
        </div>
        <div className="tutor-composer">
          {imageUrls.length > 0 && (
            <div className="tutor-image-list">
              {imageUrls.map((url, index) => (
                <span key={url}>
                  <img src={url} alt={`提问图片${index + 1}`} />
                  <button onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}>×</button>
                </span>
              ))}
            </div>
          )}
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={!selected || chatLoading}
            placeholder="继续追问这次批阅，例如：这句为什么不自然？"
          />
          <div className="tutor-composer-actions">
            <label className={`desktop-ghost ${uploading || imageUrls.length >= 5 ? 'disabled' : ''}`}>
              {uploading ? '上传中' : '+ 图片'}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                disabled={uploading || imageUrls.length >= 5}
                onChange={(e) => handleQuestionUpload(Array.from(e.target.files || []))}
              />
            </label>
            <button className="desktop-primary" onClick={sendQuestion} disabled={!selected || chatLoading || !question.trim()}>
              发送
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PlatformSkillModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [skills, setSkills] = useState<PlatformSkill[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (nextPage = 1, keyword = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await api.pagePlatformSkills(nextPage, 8, keyword);
      setSkills(data.records || []);
      setPage(data.current || nextPage);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e: any) {
      setSkills([]);
      setError(e?.message || '平台 Skill 加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, '');
  }, [load]);

  return (
    <div className="desktop-modal-mask" onClick={onClose}>
      <div className="skill-modal" onClick={(event) => event.stopPropagation()}>
        <div className="skill-modal-head">
          <div>
            <h3>平台 Skill 配置</h3>
            <p>只读查看当前智能体可调用的外语学习 Skill。</p>
          </div>
          <button onClick={onClose}>×</button>
        </div>
        <div className="skill-toolbar">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(1); }}
            placeholder="按 Skill 名称查询"
          />
          <button className="desktop-primary" disabled={loading} onClick={() => load(1, name)}>查询</button>
          <button className="desktop-ghost" disabled={loading} onClick={() => { setName(''); load(1, ''); }}>清空</button>
          <button className="desktop-ghost" disabled={loading} onClick={() => load(page, name)}>刷新</button>
          <span>共 {total} 条</span>
        </div>
        {error && <div className="desktop-error">{error}</div>}
        <div className="skill-list">
          {loading ? (
            <div className="tutor-empty">正在加载平台 Skill...</div>
          ) : skills.length === 0 ? (
            <div className="tutor-empty">暂无平台 Skill</div>
          ) : (
            skills.map((skill) => (
              <article className="skill-card" key={skill.id}>
                <div>
                  <strong>{skill.name}</strong>
                  <span>{skill.sourceText || skill.source || '平台配置'}</span>
                </div>
                <p>{skill.description || '暂无 Skill 描述'}</p>
                <footer>
                  <span>创建：{formatDesktopTime(skill.createdAt)}</span>
                  <span>更新：{formatDesktopTime(skill.updatedAt)}</span>
                </footer>
              </article>
            ))
          )}
        </div>
        <div className="skill-pager">
          <button className="desktop-ghost" disabled={page <= 1 || loading} onClick={() => load(page - 1, name)}>上一页</button>
          <span>{page} / {Math.max(1, pages)}</span>
          <button className="desktop-ghost" disabled={page >= pages || loading} onClick={() => load(page + 1, name)}>下一页</button>
        </div>
      </div>
    </div>
  );
}

function TutorBubble({ message }: { message: TutorMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`tutor-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div>{message.text}</div>
      {message.imageUrls && message.imageUrls.length > 0 && (
        <div className="tutor-bubble-images">
          {message.imageUrls.map((url) => <img key={url} src={url} alt="提问图片" />)}
        </div>
      )}
    </div>
  );
}

function toTutorMessage(message: TutorHistoryMessage): TutorMessage {
  return {
    role: String(message.role).toLowerCase() === 'assistant' ? 'assistant' : 'user',
    text: message.content || '',
    imageUrls: message.imageUrls || [],
  };
}

function stageLabel(code?: string) {
  return WRITING_STAGES.find((item) => item.code === code)?.desc || code || '—';
}

function formatDesktopTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ').slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
