export const BigBtn = ({label, onClick, sub}: {label: string, onClick?: () => void, sub?: string}) => (
  <button className="btn-primary" onClick={onClick} style={{width:"100%", minHeight: "72px", padding:"20px 16px",fontSize:18,borderRadius:14,marginBottom:12,lineHeight:1.2, display: 'block', touchAction: 'manipulation'}}>
    {label}{sub&&<div style={{fontSize:13,fontWeight:400,opacity:.85,marginTop:6}}>{sub}</div>}
  </button>
);
