import './Toolbar.css';

interface ModelOption {
  label: string;
  value: string;
}

interface ModelDropdownProps {
  isOpen: boolean;
  options: ModelOption[];
  selected: string;
  onSelect: (model: string) => void;
}

export function ModelDropdown({ isOpen, options, selected, onSelect }: ModelDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="model-dropdown">
      {options.map((opt) => (
        <div
          key={opt.value}
          className={`model-option ${selected === opt.value ? 'selected' : ''}`}
          onClick={() => onSelect(opt.value)}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
}
