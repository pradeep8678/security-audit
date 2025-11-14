import { useRef, useState } from "react";
import { FiHelpCircle } from "react-icons/fi";
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
      {/* 3-SECTION HEADER */}
      <div className="dropzone-header-3col">

        {/* LEFT */}
        <div className="dz-left"></div>

        {/* CENTER */}
        <div className="dz-center">
          <div className="dropzone-header">Upload Service Account JSON</div>
        </div>

        {/* RIGHT (icon aligned left inside this box) */}
        <div className="dz-right">
          <div className="help-icon-dz">
            <FiHelpCircle className="help-icon-dz-svg" />
            <div className="help-tooltip-dz">
              <strong>How to download Service Account JSON:</strong>
              <br /><br />
              ➜ Go to <em>IAM & Admin → Service Accounts</em><br />
              ➜ Click Create Service Account<br />
              ➜ Enter any name → Continue<br />
              ➜Under Roles, add: Viewer<br />
              ➜ Click Done<br />
              ➜ Open the service account you created<br />
              ➜ Go to the <em>Keys</em> tab<br />
              ➜ Click Add Key → Create new key<br />
              ➜ Choose JSON → Download<br />
            </div>

          </div>
        </div>

      </div>

      {/* DROP BODY */}
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
