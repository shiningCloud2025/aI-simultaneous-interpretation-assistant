export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, padding: 20, marginBottom: 16 }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 16 }}>{title}</div>}
      {children}
    </div>
  );
}

export function StatCard({ label, value, unit, trend }: { label: string; value: string; unit: string; trend: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, padding: 20 }}>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>{value}<span style={{ fontSize: 13, color: '#bbb', marginLeft: 2 }}>{unit}</span></div>
      <div style={{ fontSize: 11, marginTop: 4, color: '#4caf50' }}>{trend}</div>
    </div>
  );
}

export function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f5f3f0' }}>
      <div>
        <div style={{ fontSize: 13, color: '#555' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
    </div>
  );
}

export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#4caf50' : '#ddd', cursor: 'pointer', position: 'relative', transition: 'all .2s' }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .2s' }} />
    </div>
  );
}

export function Select({ options, value, onChange }: { options: string[]; value?: string; onChange?: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange?.(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 12, color: '#555', background: '#fff', outline: 'none' }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

export function PageBanner({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 16, padding: 24, background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 14, color: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{icon} {title}</div>
      <div style={{ fontSize: 13, opacity: .85 }}>{desc}</div>
    </div>
  );
}
