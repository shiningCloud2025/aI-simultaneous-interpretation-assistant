import { useState, useEffect } from 'react';
import { api } from '../stores/appStore';
import { Card, SettingRow, Select } from './ui';

interface ModelInfo {
  name: string;
  display: string;
  languages?: string[];
  inputs?: string[];
}

interface Provider {
  key: string;
  name: string;
}

export function ModelConfig() {
  const [asrProviders, setAsrProviders] = useState<Provider[]>([]);
  const [llmProviders, setLlmProviders] = useState<Provider[]>([]);
  const [asrModels, setAsrModels] = useState<ModelInfo[]>([]);
  const [llmModels, setLlmModels] = useState<ModelInfo[]>([]);
  const [asrProvider, setAsrProvider] = useState('');
  const [llmProvider, setLlmProvider] = useState('');
  const [asrModel, setAsrModel] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  useEffect(() => {
    // 加载厂商列表
    fetch('/api/sys/user/ai/asr/providers').then(r => r.json()).then(d => {
      if (d.code === 200) setAsrProviders(d.data);
    }).catch(() => {});
    fetch('/api/sys/user/ai/llm/providers').then(r => r.json()).then(d => {
      if (d.code === 200) setLlmProviders(d.data);
    }).catch(() => {});
    // 加载推荐模型
    fetch('/api/sys/user/ai/asr/models').then(r => r.json()).then(d => {
      if (d.code === 200) setAsrModels(d.data);
    }).catch(() => {});
    fetch('/api/sys/user/ai/llm/models').then(r => r.json()).then(d => {
      if (d.code === 200) setLlmModels(d.data);
    }).catch(() => {});
  }, []);

  const loadAsrModels = async (provider: string) => {
    setAsrProvider(provider);
    try {
      const res = await fetch(`/api/sys/user/ai/asr/models?provider=${provider}`);
      const d = await res.json();
      if (d.code === 200) setAsrModels(d.data);
    } catch (e) { showToast('加载失败'); }
  };

  const loadLlmModels = async (provider: string) => {
    setLlmProvider(provider);
    try {
      const res = await fetch(`/api/sys/user/ai/llm/models?provider=${provider}`);
      const d = await res.json();
      if (d.code === 200) setLlmModels(d.data);
    } catch (e) { showToast('加载失败'); }
  };

  const savePreference = async (modelType: string, provider: string, modelName: string) => {
    try {
      await api.saveModelPreference({ modelType, provider, modelName });
      showToast('已设为默认模型');
    } catch (e: any) { showToast(e.message || '保存失败'); }
  };

  return (
    <Card title="">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>语音识别 (ASR)</div>
        <SettingRow label="厂商" desc="选择模型服务商">
          <Select
            value={asrProvider}
            options={asrProviders.map(p => p.key)}
            labels={Object.fromEntries(asrProviders.map(p => [p.key, p.name]))}
            onChange={(v: string) => loadAsrModels(v)}
          />
        </SettingRow>
        <SettingRow label="ASR 模型" desc="选择语音识别模型">
          <Select
            value={asrModel}
            options={asrModels.map(m => m.name)}
            labels={Object.fromEntries(asrModels.map(m => [m.name, m.display]))}
            onChange={(v: string) => { setAsrModel(v); savePreference('ASR', asrProvider, v); }}
          />
        </SettingRow>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>大语言模型 (LLM)</div>
        <SettingRow label="厂商" desc="选择模型服务商">
          <Select
            value={llmProvider}
            options={llmProviders.map(p => p.key)}
            labels={Object.fromEntries(llmProviders.map(p => [p.key, p.name]))}
            onChange={(v: string) => loadLlmModels(v)}
          />
        </SettingRow>
        <SettingRow label="LLM 模型" desc="选择翻译/纠错模型">
          <Select
            value={llmModel}
            options={llmModels.map(m => m.name)}
            labels={Object.fromEntries(llmModels.map(m => [m.name, m.display]))}
            onChange={(v: string) => { setLlmModel(v); savePreference('LLM', llmProvider, v); }}
          />
        </SettingRow>
      </div>
      {toast && <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{toast}</div>}
    </Card>
  );
}
