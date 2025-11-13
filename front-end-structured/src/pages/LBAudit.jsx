import { useState } from "react";
import Header from "../components/Header";
import RunButton from "../components/RunButton";
import ResultsTable from "../components/ResultsTable";
import StatusBar from "../components/StatusBar";
import { checkLoadBalancers } from "../api/loadBalancers";
import "./SecurityAudit.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function LBAudit({ file }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [results, setResults] = useState([]);

  const onRun = async () => {
    if (!file) {
      setError("Please upload a JSON key file first");
      return;
    }

    try {
      setStatus("loading");
      setError(null);
      const res = await checkLoadBalancers(file);
      setProjectId(res.projectId);

      const formatted = (res.loadBalancers || []).map((item) => ({
        name: item.name,
        scheme: item.scheme,
        ip: item.ip,
        ssl_policy: item.ssl_policy,
        ssl_cert_status: item.ssl_cert_status,
        https_redirect: item.https_redirect,
        cloud_armor_policy: item.cloud_armor_policy,
        armor_rule_strength: item.armor_rule_strength,
        internal_exposure: item.internal_exposure,
      }));

      setResults(formatted);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to scan Load Balancers");
      setStatus("error");
    }
  };

  const onReset = () => {
    setStatus("idle");
    setError(null);
    setProjectId(null);
    setResults([]);
  };

  const onDownloadExcel = () => {
    if (!results.length) {
      alert("No Load Balancer data to export!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Load Balancers");
    const filename = `GCP_LoadBalancer_Audit_${projectId || "results"}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  return (
    <div className="module-box">
      <h2 style={{ textAlign: "center", color: "#24314f" }}>Load Balancer Audit</h2>

      <div className="action-buttons">
        <RunButton
          title="Run Load Balancer Audit"
          onClick={onRun}
          disabled={status === "loading"}
        />
        <button className="reset-btn" onClick={onReset}>
          Reset
        </button>
        <button className="excel-btn" onClick={onDownloadExcel}>
          Download Excel
        </button>
      </div>

      <StatusBar status={status} error={error} projectId={projectId} />
      <ResultsTable
        results={results}
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Scheme", accessor: "scheme" },
          { header: "IP", accessor: "ip" },
          { header: "SSL Policy", accessor: "ssl_policy" },
          { header: "SSL Cert Status", accessor: "ssl_cert_status" },
          { header: "HTTPS Redirect", accessor: "https_redirect" },
          { header: "Cloud Armor Policy", accessor: "cloud_armor_policy" },
          { header: "Armor Rule Strength", accessor: "armor_rule_strength" },
          { header: "Internal Exposure", accessor: "internal_exposure" },
        ]}
      />
    </div>
  );
}
