export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      {title && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{title}</div>}
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

export function Select({ options, value, onChange, labels, titles }: { options: string[]; value?: string; onChange?: (v: string) => void; labels?: Record<string, string>; titles?: Record<string, string> }) {
  return (
    <select value={value} onChange={e => onChange?.(e.target.value)} title={value ? titles?.[value] : undefined} style={{ padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 12, color: '#555', background: '#fff', outline: 'none' }}>
      <option value="">请选择</option>
      {options.map(o => <option key={o} value={o} title={titles?.[o]}>{labels?.[o] || o}</option>)}
    </select>
  );
}

export function PageBanner({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 16, padding: 24, background: '#fff', border: '1px solid #e8e2d8', borderLeft: '5px solid #234b49', borderRadius: 14, color: '#253332', boxShadow: '0 6px 18px rgba(64,54,40,.035)' }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 5 }}>{icon} {title}</div>
      <div style={{ fontSize: 13, color: '#7a817e', lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}
