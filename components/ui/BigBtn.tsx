export const BigBtn = ({label, onClick, sub}: {label: string, onClick?: () => void, sub?: string}) => (
  <button className="btn-primary" onClick={onClick} style={{
    width: "100%",
    minHeight: "76px",
    padding: "20px 20px",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    borderRadius: 18,
    marginBottom: 12,
    lineHeight: 1.15,
    display: 'block',
    touchAction: 'manipulation',
  }}>
    {label}
    {sub && <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.8, marginTop: 5, letterSpacing: '-0.01em' }}>{sub}</div>}
  </button>
);

