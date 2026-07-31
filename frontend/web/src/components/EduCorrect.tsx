import { useState } from 'react';
import { Card, PageBanner, SettingRow, Toggle } from './ui';

export function EduCorrect() {
  const [a, setA] = useState(true); const [b, setB] = useState(true); const [c, setC] = useState(true); const [d, setD] = useState(false);
  return (
    <>
      <PageBanner icon="✏️" title="课堂纠错" desc="ASR 识别 + AI 检测知识性错误、口误，实时提醒老师修正" />
      <Card title="">
        <SettingRow label="语法错误检测" desc="识别老师英语授课中的语法错误"><Toggle on={a} onClick={() => setA(!a)} /></SettingRow>
        <SettingRow label="知识点准确性校验" desc="对照教材/大纲，检测讲述内容是否有事实性错误"><Toggle on={b} onClick={() => setB(!b)} /></SettingRow>
        <SettingRow label="语速/清晰度监测" desc="老师讲太快或吐字不清时提醒"><Toggle on={c} onClick={() => setC(!c)} /></SettingRow>
        <SettingRow label="术语规范性检查" desc="确保专业术语使用正确"><Toggle on={d} onClick={() => setD(!d)} /></SettingRow>
        <div style={{ marginTop: 16, background: '#fafaf9', borderRadius: 10, padding: 16, fontSize: 12 }}>
          <div style={{ color: '#999', marginBottom: 8 }}>📋 纠错示例</div>
          <div style={{ color: '#e55c5c', marginBottom: 4 }}>❌ 老师说： "The algorithm have a complexity of O(n square)..."</div>
          <div style={{ color: '#4caf50' }}>✅ 建议修正： "The algorithm has a complexity of O(n²)..."</div>
          <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>→ 语法错误：have → has | 术语建议：O(n square) → O(n²)</div>
        </div>
        <div style={{ marginTop: 16 }}><Btn>▶️ 开启课堂纠错</Btn></div>
      </Card>
    </>
  );
}

function Btn({ children }: { children: React.ReactNode }) {
  return <button style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' }}>{children}</button>;
}
