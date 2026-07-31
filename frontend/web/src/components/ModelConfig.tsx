import { useState } from 'react';
import { Card, SettingRow, Select, Toggle } from './ui';

export function ModelConfig() {
  const [vad, setVad] = useState(true);
  const [autoCorrect, setAutoCorrect] = useState(true);
  return (
    <Card title="">
      <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>语音识别 (ASR)</div>
        <SettingRow label="ASR 模型" desc="将音频转为文字"><Select options={['Whisper Large v3', 'Whisper Medium', 'FunASR Paraformer', 'SenseVoice']} /></SettingRow>
        <SettingRow label="识别语言" desc="默认识别的语种"><Select options={['中文', 'English', '日本語', '自动检测']} /></SettingRow>
        <SettingRow label="VAD 静音检测" desc="自动切分语音段落"><Toggle on={vad} onClick={() => setVad(!vad)} /></SettingRow>
      </div>
      <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>翻译</div>
        <SettingRow label="翻译模型" desc="将识别文字翻译为目标语言"><Select options={['GPT-4o', 'GPT-4o-mini', 'Claude 3.5 Sonnet', 'DeepSeek V3']} /></SettingRow>
        <SettingRow label="目标语言" desc="翻译结果语言"><Select options={['English', '中文', '日本語', '한국어']} /></SettingRow>
      </div>
      <div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>纠错</div>
        <SettingRow label="纠错模型" desc="对翻译结果进行语法和语义修正"><Select options={['Claude 3.5 Sonnet', 'GPT-4o', '关闭纠错']} /></SettingRow>
        <SettingRow label="自动纠错" desc="翻译完成后自动进行纠错"><Toggle on={autoCorrect} onClick={() => setAutoCorrect(!autoCorrect)} /></SettingRow>
      </div>
    </Card>
  );
}
