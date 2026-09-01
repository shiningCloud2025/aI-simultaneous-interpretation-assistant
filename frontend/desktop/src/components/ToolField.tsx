/** 悬浮条专用的紧凑表单控件（比桌面平台的 SelectField 更省空间） */

export function ToolSelect({
  id,
  label,
  value,
  options,
  onChange,
  open,
  setOpen,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  open: string | null;
  setOpen: (id: string | null) => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <div className="model-wrapper">
      <button
        className={`tb-select ${open === id ? 'active' : ''}`}
        onClick={() => setOpen(open === id ? null : id)}
      >
        <span className="select-label dim">{label}:</span>
        <span className="select-value">{current?.label || '请选择'}</span>
        <span className="select-arrow">▾</span>
      </button>
      {open === id && (
        <div className="dropdown">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`dropdown-item ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(null);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ToolInput({
  value,
  onChange,
  placeholder,
  width = 120,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: number;
}) {
  return (
    <input
      className="tb-input"
      style={{ width }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function ToolButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button className="tb-action" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
