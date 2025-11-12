import { useRef, useState } from "react";
import "./FileDropZone.css";

export default function FileDropZone({ file, onFile }) {
  const inputRef = useRef();
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      className={`dropzone ${dragActive ? "active" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="dropzone-header">Upload Service Account JSON</div>

      <div className="dropzone-body">
        <p>Drag & drop your JSON file here, or</p>
        <button className="upload-btn" onClick={handleButtonClick}>
          Choose File
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          onChange={handleChange}
          hidden
        />
      </div>

      <div className="file-info">
        {file ? `📄 Selected: ${file.name}` : "No file selected"}
      </div>
    </div>
  );
}
