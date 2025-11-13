import { useState } from "react";
import { scanFirewall } from "../api/firewall";
import "./AuditCommon.css"; // optional, reuse your table styles

export default function FirewallAudit({ file }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await scanFirewall(file);
      setResult(data);
    } catch (err) {
      console.error("Error scanning firewall:", err);
      setError("Failed to scan firewall rules");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audit-section">
      <h2>🔥 Firewall Rules Audit</h2>
      <p>Check for publicly open firewall rules (0.0.0.0/0).</p>

      <button
        className="scan-btn"
        onClick={handleScan}
        disabled={loading}
      >
        {loading ? "Scanning..." : "Scan Firewall Rules"}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="results">
          <h3>Results</h3>
          <p>Total Rules: {result.totalRules}</p>
          <p>Public Rules: {result.publicRulesCount}</p>

          {result.publicRulesCount > 0 ? (
            <table className="result-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Network</th>
                  <th>Direction</th>
                  <th>Source Ranges</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {result.publicRules.map((rule) => (
                  <tr key={rule.name}>
                    <td>{rule.name}</td>
                    <td>{rule.network}</td>
                    <td>{rule.direction}</td>
                    <td>{rule.sourceRanges?.join(", ")}</td>
                    <td className="warning">
                      ⚠️ Allow rule open to public. Restrict to trusted IPs.
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="success">
              ✅ All firewall rules are restricted. No public access detected.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
