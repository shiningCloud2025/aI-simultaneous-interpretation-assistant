import { useModels } from '../hooks/useModels';

/**
 * 模型设置：直接嵌在悬浮条内，无需进入桌面平台。
 * ASR 与翻译模型可独立选择；纠错与翻译一体（后端复用同一份 LLM 偏好），
 * 因此此处不提供独立的纠错模型。
 */
export function ModelSettings({ token }: { token: string }) {
  const {
    asrProviders, llmProviders, asrModels, llmModels,
    asrProvider, setAsrProvider, llmProvider, setLlmProvider,
    asrModel, llmModel, setConfig, loadModels, savePreference, toast,
  } = useModels(token);

  if (!token) {
    return <div className="model-settings-empty">登录后可选择模型</div>;
  }

  return (
    <div className="model-settings">
      <div className="model-row">
        <label>ASR 厂商</label>
        <select
          value={asrProvider}
          onChange={(e) => {
            setAsrProvider(e.target.value);
            setConfig({ asrModel: '' });
            loadModels('ASR', e.target.value);
          }}
        >
          <option value="">请选择</option>
          {asrProviders.map((p) => (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="model-row">
        <label>ASR 模型</label>
        <select
          value={asrModel}
          onChange={(e) => savePreference('ASR', asrProvider, e.target.value)}
        >
          <option value="">请选择</option>
          {asrModels.map((m) => (
            <option key={m.name} value={m.name}>{m.display}</option>
          ))}
        </select>
      </div>

      <div className="model-row">
        <label>LLM 厂商</label>
        <select
          value={llmProvider}
          onChange={(e) => {
            setLlmProvider(e.target.value);
            setConfig({ llmModel: '' });
            loadModels('LLM', e.target.value);
          }}
        >
          <option value="">请选择</option>
          {llmProviders.map((p) => (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="model-row">
        <label>翻译模型</label>
        <select
          value={llmModel}
          onChange={(e) => savePreference('LLM', llmProvider, e.target.value)}
        >
          <option value="">请选择</option>
          {llmModels.map((m) => (
            <option key={m.name} value={m.name}>{m.display}</option>
          ))}
        </select>
      </div>

      <div className="model-correction">
        纠错模型：{llmModels.find((m) => m.name === llmModel)?.display || llmModel || '（随翻译）'}
        <em>与翻译保持一致</em>
      </div>

      {toast && <div className="model-toast">{toast}</div>}
    </div>
  );
}
