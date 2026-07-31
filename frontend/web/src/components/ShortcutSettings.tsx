import { Card } from './ui';

const shortcuts = [
  ['开始/停止录音', 'Ctrl + Shift + R'],
  ['显示/隐藏工具栏', 'Ctrl + Shift + T'],
  ['切换翻译开关', 'Ctrl + Shift + F'],
  ['清空翻译内容', 'Ctrl + Shift + C'],
  ['复制译文', 'Ctrl + Shift + D'],
];

export function ShortcutSettings() {
  return (
    <Card title="快捷键设置">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ padding: '12px 16px', background: '#fafaf9', color: '#999', fontWeight: 500, borderBottom: '1px solid #f0efec' }}>功能</th><th style={{ padding: '12px 16px', background: '#fafaf9', color: '#999', fontWeight: 500, borderBottom: '1px solid #f0efec' }}>快捷键</th><th style={{ padding: '12px 16px', background: '#fafaf9', color: '#999', fontWeight: 500, borderBottom: '1px solid #f0efec' }}>操作</th></tr></thead>
        <tbody>
          {shortcuts.map(([name, key]) => (
            <tr key={name}><td style={{ padding: '12px 16px', borderBottom: '1px solid #fafaf9', color: '#555' }}>{name}</td><td style={{ padding: '12px 16px', borderBottom: '1px solid #fafaf9', color: '#555' }}>{key}</td><td style={{ padding: '12px 16px', borderBottom: '1px solid #fafaf9' }}><span style={{ color: '#2c2c2c', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>修改</span></td></tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16 }}><button style={btn}>恢复默认</button></div>
    </Card>
  );
}

const btn: React.CSSProperties = { padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' };
