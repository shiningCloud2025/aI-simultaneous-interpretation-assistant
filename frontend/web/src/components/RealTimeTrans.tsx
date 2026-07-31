import { useState } from 'react';
import { Card, Select } from './ui';

export function RealTimeTrans() {
  const [recording, setRecording] = useState(true);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: 'calc(100vh - 280px)' }}>
        <TransBox label="源语言 · 中文" dotColor="#999">
          <Seg time="00:02" text="大家好，欢迎参加今天的项目进度会议。" />
          <Seg time="00:08" text="首先我们来回顾一下上周的工作进展。" />
          <Seg time="00:15" text="市场部完成了竞品分析报告，研发部已经完成了第一阶段的开发工作。" />
          <Seg time="00:25" text="接下来我们需要讨论一下下个季度的产品路线图..." />
        </TransBox>
        <TransBox label="译文 · English" dotColor="#4caf50">
          <Seg time="00:02" text="Hello everyone, welcome to today's project progress meeting." />
          <Seg time="00:08" text="First, let's review the work progress from last week." />
          <Seg time="00:15" text="The marketing department has completed the competitive analysis report, and R&D has finished the first phase." />
          <Seg time="00:25" text="Next, we need to discuss the product roadmap for the next quarter..." />
        </TransBox>
      </div>

      {/* 模型快速切换栏 */}
      <Card title="">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#999' }}>快速切换:</span>
          <Select options={['Whisper Large v3', 'Whisper Medium', 'FunASR', 'SenseVoice']} />
          <Select options={['GPT-4o', 'GPT-4o-mini', 'Claude 3.5', 'DeepSeek V3']} />
          <Select options={['Claude 3.5 Sonnet', 'GPT-4o', '关闭纠错']} />
          <Select options={['中文', 'English', '日本語', '自动检测']} />
          <span style={{ fontSize: 12, color: '#bbb' }}>→</span>
          <Select options={['English', '中文', '日本語', '한국어']} />
        </div>
      </Card>

      {/* 控制栏 */}
      <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 20, marginTop: 16 }}>
        <CtrlBtn>🎧</CtrlBtn>
        <CtrlInfo label="ASR" value="Whisper Large v3" />
        <Div />
        <button onClick={() => setRecording(!recording)} style={{ width: 50, height: 50, borderRadius: '50%', background: recording ? '#e55c5c' : '#ccc', border: 'none', cursor: 'pointer', fontSize: 18, color: '#fff', animation: recording ? 'pulse2 1.5s infinite' : 'none' }}>{recording ? '⏹' : '▶'}</button>
        <Div />
        <CtrlInfo label="翻译" value="GPT-4o" />
        <Div />
        <CtrlInfo label="状态" value="● 翻译中" on />
        <Div />
        <CtrlInfo label="延迟" value="~320ms" />
        <CtrlBtn style={{ marginLeft: 'auto' }}>⚙</CtrlBtn>
      </div>
      <style>{`@keyframes pulse2{0%,100%{box-shadow:0 0 0 0 rgba(229,92,92,.3)}50%{box-shadow:0 0 0 10px rgba(229,92,92,0)}}`}</style>
    </div>
  );
}

function TransBox({ label, dotColor, children }: { label: string; dotColor: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0efec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} />{label}</div>
        <button style={btn}>复制</button>
      </div>
      <div style={{ flex: 1, padding: '16px 18px', overflowY: 'auto', fontSize: 13, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

function Seg({ time, text }: { time: string; text: string }) {
  return <div style={{ padding: '8px 0', borderBottom: '1px solid #fafaf9' }}><div style={{ fontSize: 10, color: '#ccc', marginBottom: 3 }}>{time}</div><div style={{ color: '#555' }}>{text}</div></div>;
}

function CtrlBtn({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <button style={{ width: 38, height: 38, borderRadius: 10, background: '#f5f3f0', border: 'none', cursor: 'pointer', fontSize: 16, ...style }}>{children}</button>;
}

function CtrlInfo({ label, value, on }: { label: string; value: string; on?: boolean }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 10, color: '#bbb' }}>{label}</span><span style={{ fontSize: 12, color: on ? '#e55c5c' : '#555', fontWeight: 500 }}>{value}</span></div>;
}

function Div() { return <div style={{ width: 1, height: 28, background: '#f0efec' }} />; }

const btn: React.CSSProperties = { padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#f5f3f0', border: 'none', color: '#888', cursor: 'pointer' };
