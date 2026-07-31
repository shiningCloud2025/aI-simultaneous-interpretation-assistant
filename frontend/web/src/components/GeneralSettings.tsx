import { useState } from 'react';
import { Card, SettingRow, Select, Toggle } from './ui';

export function GeneralSettings() {
  const [a, setA] = useState(true); const [b, setB] = useState(true); const [c, setC] = useState(true); const [d, setD] = useState(false);
  return (
    <Card title="">
      <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>翻译</div>
        <SettingRow label="自动开始翻译" desc="检测到语音后自动翻译"><Toggle on={a} onClick={() => setA(!a)} /></SettingRow>
        <SettingRow label="显示原文" desc="同时显示识别原文和译文"><Toggle on={b} onClick={() => setB(!b)} /></SettingRow>
        <SettingRow label="启动时最小化到托盘" desc="开机自启后最小化到系统托盘"><Toggle on={c} onClick={() => setC(!c)} /></SettingRow>
        <SettingRow label="开机自启" desc="系统启动时自动运行"><Toggle on={d} onClick={() => setD(!d)} /></SettingRow>
      </div>
      <div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>外观</div>
        <SettingRow label="语言" desc="界面显示语言"><Select options={['简体中文', 'English', '日本語']} /></SettingRow>
        <SettingRow label="主题" desc="界面配色方案"><Select options={['浅色', '深色', '跟随系统']} /></SettingRow>
      </div>
    </Card>
  );
}
