import { useState, useRef, useEffect } from 'react';
import { useToolbarStore } from '../stores/toolbarStore';
import './Toolbar.css';

export function Toolbar() {
  const {
    micOn, micRecording, speakerOn,
    asrModel, translationModel, correctionModel,
    sourceLang, targetLang, isTranslating,
    toggleMic, toggleSpeaker,
    setAsrModel, setTranslationModel, setCorrectionModel,
    setSourceLang, setTargetLang,
  } = useToolbarStore();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 同步 Electron 托盘切换
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onModelChanged(({ type, model }) => {
        if (type === 'asr') setAsrModel(model);
        if (type === 'translation') setTranslationModel(model);
        if (type === 'correction') setCorrectionModel(model);
      });
      window.electronAPI.getModels().then((models) => {
        if (models.asr) setAsrModel(models.asr);
        if (models.translation) setTranslationModel(models.translation);
        if (models.correction) setCorrectionModel(models.correction);
      });
    }
  }, [setAsrModel, setTranslationModel, setCorrectionModel]);

  const handleSelectModel = (type: string, model: string) => {
    if (type === 'asr') setAsrModel(model);
    if (type === 'translation') setTranslationModel(model);
    if (type === 'correction') setCorrectionModel(model);
    window.electronAPI?.setModel(type, model);
    setOpenDropdown(null);
  };

  const asrOptions = [
    { label: 'Whisper Large v3', value: 'Whisper Large v3' },
    { label: 'Whisper Medium', value: 'Whisper Medium' },
    { label: 'FunASR Paraformer', value: 'FunASR Paraformer' },
    { label: 'SenseVoice', value: 'SenseVoice' },
  ];

  const transOptions = [
    { label: 'GPT-4o', value: 'GPT-4o' },
    { label: 'GPT-4o-mini', value: 'GPT-4o-mini' },
    { label: 'Claude 3.5 Sonnet', value: 'Claude 3.5 Sonnet' },
    { label: 'DeepSeek V3', value: 'DeepSeek V3' },
  ];

  const correctOptions = [
    { label: 'Claude 3.5 Sonnet', value: 'Claude 3.5 Sonnet' },
    { label: 'GPT-4o', value: 'GPT-4o' },
    { label: '关闭纠错', value: '关闭纠错' },
  ];

  const sourceLangOptions = ['中文', 'English', '日本語', '한국어', 'Français', 'Español'];
  const targetLangOptions = ['English', '中文', '日本語', '한국语', 'Français', 'Español'];

  return (
    <div className="toolbar-wrapper" ref={dropdownRef}>
      {/* 主工具栏 - 可拖动 */}
      <div className="toolbar">
        <span className="drag-handle">⋮⋮</span>

        {/* 麦克风 */}
        <button
          className={`tb-btn ${micRecording ? 'mic-active' : micOn ? 'toggle-on' : ''}`}
          onClick={toggleMic}
          title="麦克风"
        >
          🎤
          <span className="tooltip">{micRecording ? '录音中' : micOn ? '麦克风' : '已关闭'}</span>
        </button>

        {/* 扬声器 */}
        <button
          className={`tb-btn ${!speakerOn ? 'speaker-muted' : 'toggle-on'}`}
          onClick={toggleSpeaker}
          title="扬声器"
        >
          {speakerOn ? '🔊' : '🔇'}
          <span className="tooltip">{speakerOn ? '扬声器' : '已静音'}</span>
        </button>

        <div className="tb-divider" />

        {/* ASR 模型下拉 — 默认「ASR」，选完后显示模型名 */}
        <div className="model-wrapper">
          <button
            className={`tb-select ${openDropdown === 'asr' ? 'active' : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'asr' ? null : 'asr')}
          >
            <span className="select-value">{asrModel}</span>
            <span className="select-arrow">▾</span>
          </button>
          {openDropdown === 'asr' && (
            <div className="dropdown">
              {asrOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`dropdown-item ${asrModel === opt.value ? 'selected' : ''}`}
                  onClick={() => handleSelectModel('asr', opt.value)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 翻译模型下拉 — 默认「翻译」，选完后显示模型名 */}
        <div className="model-wrapper">
          <button
            className={`tb-select ${openDropdown === 'translation' ? 'active' : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'translation' ? null : 'translation')}
          >
            <span className="select-value">{translationModel}</span>
            <span className="select-arrow">▾</span>
          </button>
          {openDropdown === 'translation' && (
            <div className="dropdown">
              {transOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`dropdown-item ${translationModel === opt.value ? 'selected' : ''}`}
                  onClick={() => handleSelectModel('translation', opt.value)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 纠错模型下拉 — 默认「纠错」，选完后显示模型名 */}
        <div className="model-wrapper">
          <button
            className={`tb-select ${openDropdown === 'correction' ? 'active' : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'correction' ? null : 'correction')}
          >
            <span className="select-value">{correctionModel}</span>
            <span className="select-arrow">▾</span>
          </button>
          {openDropdown === 'correction' && (
            <div className="dropdown">
              {correctOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`dropdown-item ${correctionModel === opt.value ? 'selected' : ''}`}
                  onClick={() => handleSelectModel('correction', opt.value)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tb-divider" />

        {/* 源语言下拉 (ASR 识别语言) */}
        <div className="model-wrapper">
          <button
            className={`tb-select lang-select ${openDropdown === 'sourceLang' ? 'active' : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'sourceLang' ? null : 'sourceLang')}
          >
            <span className="select-label dim">识别:</span>
            <span className="select-value">{sourceLang}</span>
            <span className="select-arrow">▾</span>
          </button>
          {openDropdown === 'sourceLang' && (
            <div className="dropdown">
              {sourceLangOptions.map((lang) => (
                <div
                  key={lang}
                  className={`dropdown-item ${sourceLang === lang ? 'selected' : ''}`}
                  onClick={() => { setSourceLang(lang); setOpenDropdown(null); }}
                >
                  {lang}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 目标语言下拉 (译文) */}
        <div className="model-wrapper">
          <button
            className={`tb-select lang-select ${openDropdown === 'targetLang' ? 'active' : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'targetLang' ? null : 'targetLang')}
          >
            <span className="select-label dim">译文:</span>
            <span className="select-value">{targetLang}</span>
            <span className="select-arrow">▾</span>
          </button>
          {openDropdown === 'targetLang' && (
            <div className="dropdown">
              {targetLangOptions.map((lang) => (
                <div
                  key={lang}
                  className={`dropdown-item ${targetLang === lang ? 'selected' : ''}`}
                  onClick={() => { setTargetLang(lang); setOpenDropdown(null); }}
                >
                  {lang}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tb-divider" />

        {/* 状态指示 */}
        {isTranslating && (
          <span className="tb-status">
            <span className="status-dot" />
            翻译中
          </span>
        )}

        <div className="tb-divider" />

        {/* 完整页面按钮 */}
        <button
          className="tb-btn"
          onClick={() => window.electronAPI?.showToolbar()}
          title="完整页面"
        >
          🖥
          <span className="tooltip">完整页面</span>
        </button>

        {/* 隐藏按钮 */}
        <button
          className="tb-btn"
          onClick={() => window.electronAPI?.hideToolbar()}
          title="隐藏"
        >
          −
          <span className="tooltip">隐藏</span>
        </button>
      </div>

      {/* 翻译内容框 - demo 数据 */}
      {isTranslating && (
        <div className="transcript-box">
          <div className="transcript-row">
            <span className="lang-tag">{sourceLang}</span>
            <span className="transcript-text">
              让我们讨论一下下个季度的产品路线图，并确定核心功能的优先级。
            </span>
          </div>
          <div className="transcript-row">
            <span className="lang-tag target">{targetLang}</span>
            <span className="transcript-text">
              Let's discuss the product roadmap for next quarter and prioritize the core features.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
