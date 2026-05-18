export const BigBtn = ({label, onClick, sub}: {label: string, onClick?: () => void, sub?: string}) => (
  <button className="btn-primary" onClick={onClick} style={{width:"100%",padding:"22px 20px",fontSize:20,borderRadius:14,marginBottom:8,lineHeight:1.2}}>
    {label}{sub&&<div style={{fontSize:13,fontWeight:400,opacity:.85,marginTop:4}}>{sub}</div>}
  </button>
);
