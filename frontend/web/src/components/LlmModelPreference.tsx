import { useEffect, useState } from 'react';
import { Select } from './ui';
import { apiCall } from '../lib/api';

interface ModelInfo {
  name: string;
  display: string;
}

interface Provider {
  key: string;
  name: string;
}

interface Preference {
  modelType: string;
  provider: string;
  modelName: string;
}

export function LlmModelPreference({ label = 'LLM 模型' }: { label?: string }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [model, setModel] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerProvider, setPickerProvider] = useState('');
  const [pickerModel, setPickerModel] = useState('');
  const [pickerModels, setPickerModels] = useState<ModelInfo[]>([]);
  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2000);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const providerList = await apiCall<Provider[]>('/sys/user/ai/llm/providers');
        setProviders(providerList);

        const preferences = await apiCall<Preference[]>('/sys/user/model-preference');
        const llmPreference = preferences.find(p => p.modelType === 'LLM');
        if (llmPreference) {
          await loadModels(llmPreference.provider);
          setModel(llmPreference.modelName);
        }
      } catch {
        showToast('模型配置加载失败');
      }
    };
    init();
  }, []);

  const loadModels = async (nextProvider: string) => {
    if (!nextProvider) {
      setModels([]);
      return [];
    }
    const data = await apiCall<ModelInfo[]>(`/sys/user/ai/llm/models?provider=${nextProvider}`);
    setModels(data);
    return data;
  };

  const savePreference = async (nextProvider: string, nextModel: string) => {
    if (!nextProvider) {
      showToast(`无法识别模型 ${nextModel} 对应的厂商`);
      return;
    }
    try {
      await apiCall<void>('/sys/user/model-preference', {
        method: 'PUT',
        body: JSON.stringify({ modelType: 'LLM', provider: nextProvider, modelName: nextModel }),
      });
      showToast('已切换 LLM 模型');
    } catch (e: any) {
      showToast(e?.message || '模型保存失败');
    }
  };

  const openPicker = () => {
    setPickerOpen(true);
    setPickerProvider('');
    setPickerModel('');
    setPickerModels([]);
  };

  const changePickerProvider = async (nextProvider: string) => {
    setPickerProvider(nextProvider);
    setPickerModel('');
    if (!nextProvider) {
      setPickerModels([]);
      return;
    }
    try {
      const data = await apiCall<ModelInfo[]>(`/sys/user/ai/llm/models?provider=${nextProvider}`);
      setPickerModels(data);
    } catch (e: any) {
      showToast(e?.message || '模型加载失败');
    }
  };

  const confirmPicker = async () => {
    if (!pickerProvider || !pickerModel) {
      showToast('请先选择厂商和模型');
      return;
    }
    setModels(pickerModels);
    setModel(pickerModel);
    await savePreference(pickerProvider, pickerModel);
    setPickerOpen(false);
  };

  const currentLabel = models.find(m => m.name === model)?.display || model || '请选择';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 14px', background: '#fafaf9', border: '1px solid #f0efec', borderRadius: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: '#999' }}>{label}</span>
        <ModelBadge value={currentLabel} empty={!model} />
        <button
          onClick={openPicker}
          style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, background: '#f5f3f0', border: 'none', color: '#888', cursor: 'pointer' }}
          title="按厂商选择其他 LLM 模型"
        >
          + 配置模型
        </button>
        <span style={{ fontSize: 11, color: '#bbb' }}>当前：{model ? currentLabel : '请先配置模型'}</span>
      </div>

      {pickerOpen && (
        <LlmModelPicker
          providers={providers}
          models={pickerModels}
          provider={pickerProvider}
          model={pickerModel}
          onProviderChange={changePickerProvider}
          onModelChange={setPickerModel}
          onConfirm={confirmPicker}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{toast}</div>
      )}
    </>
  );
}

function ModelBadge({ value, empty }: { value: string; empty?: boolean }) {
  return (
    <span style={{
      padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 12,
      color: empty ? '#aaa' : '#555', background: empty ? '#fff' : '#fff',
      minWidth: 120, display: 'inline-flex', justifyContent: 'center',
    }}>
      {empty ? '请先配置' : value}
    </span>
  );
}

function LlmModelPicker({
  providers, models, provider, model, onProviderChange, onModelChange, onConfirm, onClose,
}: {
  providers: Provider[];
  models: ModelInfo[];
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 999 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 440, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,.18)', zIndex: 1000, overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0efec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>配置其他 LLM 模型</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>先选择厂商，再选择具体模型</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6 }}>厂商</label>
            <Select
              options={providers.map(p => p.key)}
              labels={Object.fromEntries(providers.map(p => [p.key, p.name]))}
              value={provider}
              onChange={onProviderChange}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6 }}>模型</label>
            {provider ? (
              <Select
                options={models.map(m => m.name)}
                labels={Object.fromEntries(models.map(m => [m.name, m.display]))}
                value={model}
                onChange={onModelChange}
              />
            ) : (
              <div style={{ padding: '8px 12px', color: '#bbb', fontSize: 12, background: '#fafaf9', borderRadius: 8, border: '1px dashed #e8e6e1' }}>
                请先选择厂商
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #f0efec', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' }}>取消</button>
          <button
            onClick={onConfirm}
            disabled={!provider || !model}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13,
              background: (!provider || !model) ? '#ccc' : '#2c2c2c',
              border: 'none', color: '#fff',
              cursor: (!provider || !model) ? 'not-allowed' : 'pointer',
            }}
          >
            确定
          </button>
        </div>
      </div>
    </>
  );
}
