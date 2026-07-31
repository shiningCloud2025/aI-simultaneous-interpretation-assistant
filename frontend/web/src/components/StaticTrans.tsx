import { useState } from 'react';
import { Card, Select } from './ui';

export function StaticTrans() {
  const [result, setResult] = useState(false);

  return (
    <Card title="">
      <div style={{ textAlign: 'center', padding: 40, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>静态转译</div>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>上传音频文件，自动识别语音并翻译<br />支持 MP3 / WAV / M4A / WebM 格式</div>
        <div onClick={() => alert('文件选择器已打开（模拟）')} style={{ border: '2px dashed #e8e6e1', borderRadius: 14, padding: 40, marginBottom: 20, cursor: 'pointer' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>☁️</div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>点击上传或拖拽音频文件到此处</div>
          <div style={{ fontSize: 12, color: '#bbb' }}>最大支持 500MB · 最长 4 小时</div>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <Select options={['识别语言：中文', 'English', '日本語', '自动检测']} />
          <Select options={['翻译为：English', '中文', '日本語']} />
          <Select options={['ASR：Whisper Large v3', 'Whisper Medium', 'FunASR']} />
          <Select options={['翻译：GPT-4o', 'GPT-4o-mini', 'Claude 3.5']} />
        </div>
        <button onClick={() => setResult(true)} style={{ padding: '12px 36px', background: '#2c2c2c', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>开始转译</button>
        {result && (
          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <Card title="识别结果"><div style={{ background: '#fafaf9', borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.8, color: '#555' }}>Hello everyone, welcome to today's project progress meeting. First, let's review the work progress from last week...</div></Card>
            <Card title="翻译结果"><div style={{ background: '#fafaf9', borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.8, color: '#555' }}>大家好，欢迎参加今天的项目进度会议。首先，我们来回顾一下上周的工作进展...</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}><Btn>📋 复制译文</Btn><Btn>📄 导出字幕</Btn><Btn>📝 导出文本</Btn></div></Card>
          </div>
        )}
      </div>
    </Card>
  );
}

function Btn({ children }: { children: React.ReactNode }) { return <button style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' }}>{children}</button>; }
