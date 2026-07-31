import { useState } from 'react';
import { Card, SettingRow, Select, Toggle } from './ui';

export function AudioSettings() {
  const [sys, setSys] = useState(true);
  return (
    <Card title="">
      <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>音频输入</div>
        <SettingRow label="麦克风设备" desc="选择收音设备"><Select options={['MacBook Pro 麦克风', '外接麦克风 (USB)', '蓝牙耳机']} /></SettingRow>
        <SettingRow label="输入音量" desc="调整麦克风灵敏度"><input type="range" defaultValue={80} /></SettingRow>
      </div>
      <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>音频输出</div>
        <SettingRow label="扬声器设备" desc="选择播放设备"><Select options={['MacBook Pro 扬声器', '外接耳机', '蓝牙音箱']} /></SettingRow>
        <SettingRow label="输出音量" desc="调整播放音量"><input type="range" defaultValue={70} /></SettingRow>
      </div>
      <SettingRow label="采集系统音频" desc="翻译电脑播放的声音（如视频会议、视频）"><Toggle on={sys} onClick={() => setSys(!sys)} /></SettingRow>
    </Card>
  );
}
