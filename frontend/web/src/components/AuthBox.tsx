export function AuthBox({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24, background: '#f7f5f0' }}>
      <div style={{ width: 400, background: '#fff', borderRadius: 18, padding: '46px 40px 40px', boxShadow: '0 1px 2px rgba(0,0,0,.035), 0 12px 34px rgba(67,56,38,.08)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #ebe5da' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, margin: '0 auto 14px', background: '#234b49', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 800 }}>语</div>
          <h1 style={{ fontSize: 19, fontWeight: 800, color: '#1f2d2b', marginBottom: 4 }}>{title}</h1>
          <p style={{ fontSize: 13, color: '#8b918e' }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
