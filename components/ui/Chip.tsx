export const Chip = ({label, active, onClick, color}: {label: string, active?: boolean, onClick?: () => void, color?: string}) => (
  <button onClick={onClick} style={{
    padding:"5px 11px", borderRadius:20, border:`1px solid ${active?(color||"var(--chip-active)"): "var(--border)"}`,
    background: active?(color||"var(--chip-active)"):"var(--chip)",
    color: active ? "var(--chip-active-text)" : "var(--text)",
    fontSize:13, cursor:"pointer", fontFamily:"var(--font-sans)", lineHeight:1.3
  }}>{label}</button>
);
