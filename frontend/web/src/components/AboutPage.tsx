import { Card } from './ui';

export function AboutPage() {
  return (
    <Card title="">
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ width: 48, height: 48, margin: '0 auto 16px', background: '#2c2c2c', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff' }}>T</div>
        <h2 style={{ marginBottom: 4 }}>TransFlow</h2>
        <p style={{ color: '#999', marginBottom: 20 }}>同声转译，随时随地</p>
        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.8 }}>版本 1.0.0<br />Electron + React + TypeScript<br />后端：Java Spring Boot</p>
        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Btn>检查更新</Btn><Btn>GitHub</Btn>
        </div>
      </div>
    </Card>
  );
}

function Btn({ children }: { children: React.ReactNode }) {
  return <button style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' }}>{children}</button>;
}
