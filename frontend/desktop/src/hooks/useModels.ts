import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ModelInfo, Preference, Provider } from '../lib/api';
import { useDesktopStore } from '../stores/desktopStore';

/**
 * 模型选择：ASR 与 LLM 厂商/模型列表 + 偏好读写。
 * 抽成 hook 后，悬浮条与桌面平台可共用，模型选择不必再进入桌面平台。
 */
export function useModels(token: string) {
  const [asrProviders, setAsrProviders] = useState<Provider[]>([]);
  const [llmProviders, setLlmProviders] = useState<Provider[]>([]);
  const [asrModels, setAsrModels] = useState<ModelInfo[]>([]);
  const [llmModels, setLlmModels] = useState<ModelInfo[]>([]);
  const [asrProvider, setAsrProvider] = useState('');
  const [llmProvider, setLlmProvider] = useState('');
  const [toast, setToast] = useState('');

  // 选中的模型名存在共享 store，悬浮条与桌面平台一致
  const asrModel = useDesktopStore((s) => s.asrModel);
  const llmModel = useDesktopStore((s) => s.llmModel);
  const setConfig = useDesktopStore((s) => s.setConfig);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1600);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [asrPs, llmPs, prefs] = await Promise.all([
          api.listProviders('ASR'),
          api.listProviders('LLM'),
          api.listPreferences(),
        ]);
        if (cancelled) return;
        setAsrProviders(asrPs);
        setLlmProviders(llmPs);

        const asr = prefs.find((p: Preference) => p.modelType === 'ASR');
        const llm = prefs.find((p: Preference) => p.modelType === 'LLM');

        if (asr) {
          setAsrProvider(asr.provider);
          const models = await api.listModels('ASR', asr.provider);
          if (!cancelled) {
            setAsrModels(models);
            setConfig({ asrModel: asr.modelName });
          }
        }
        if (llm) {
          setLlmProvider(llm.provider);
          const models = await api.listModels('LLM', llm.provider);
          if (!cancelled) {
            setLlmModels(models);
            setConfig({ llmModel: llm.modelName });
          }
        }
        // 同步给托盘菜单
        if (!cancelled) {
          window.electronAPI?.updateTrayModels?.({
            asr: { current: asr?.modelName || '', options: asrModels.map((m) => m.name) },
            llm: { current: llm?.modelName || '', options: llmModels.map((m) => m.name) },
          });
        }
      } catch {
        /* 未登录或接口异常时静默 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, setConfig]);

  const loadModels = useCallback(async (type: 'ASR' | 'LLM', provider: string) => {
    if (!provider) return;
    const data = await api.listModels(type, provider);
    if (type === 'ASR') setAsrModels(data);
    else setLlmModels(data);
  }, []);

  const savePreference = useCallback(
    async (modelType: 'ASR' | 'LLM', provider: string, modelName: string) => {
      if (!provider || !modelName) return;
      await api.savePreference(modelType, provider, modelName);
      setConfig(modelType === 'ASR' ? { asrModel: modelName } : { llmModel: modelName });
      showToast(modelType === 'ASR' ? 'ASR 模型已保存' : '翻译模型已保存（纠错同步生效）');
    },
    [setConfig, showToast]
  );

  return {
    asrProviders, llmProviders, asrModels, llmModels,
    asrProvider, setAsrProvider, llmProvider, setLlmProvider,
    asrModel, llmModel, setConfig,
    loadModels, savePreference, toast,
  };
}
