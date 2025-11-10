import { useRef } from "react";

export default function FileDropZone({ file, onFile }) {
  const inputRef = useRef();

  const onChange = (e) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div style={{border:"1px solid #ccc", padding:"15px", borderRadius:"8px", marginBottom:"20px"}}>
      <div style={{fontWeight:600}}>Upload service account JSON</div>
      <input ref={inputRef} type="file" accept="application/json" onChange={onChange} />
      <div>{file ? `Selected: ${file.name}` : "No file selected"}</div>
    </div>
  );
}