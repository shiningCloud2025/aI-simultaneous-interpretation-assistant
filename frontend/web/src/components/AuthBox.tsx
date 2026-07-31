export function AuthBox({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: 400, background: '#fff', borderRadius: 20, padding: '48px 40px 40px', boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 8px 32px rgba(0,0,0,.06)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, margin: '0 auto 14px', background: '#2c2c2c', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff' }}>T</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{title}</h1>
          <p style={{ fontSize: 13, color: '#999' }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
