export default function ResultsTable({ results }) {
  if (!results || results.length === 0)
    return <div style={{ textAlign: "center", marginTop: "10px" }}>No vulnerability found</div>;

  // Detect if this is VM or Bucket data (or something else later)
  const sample = results[0];
  const isBucket = sample.hasOwnProperty("storageClass");
  const isVM = sample.hasOwnProperty("zone");

  return (
    <div style={{ overflowX: "auto", marginTop: "20px" }}>
      <table
        border="1"
        cellPadding="8"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <thead style={{ backgroundColor: "#f4f6f9" }}>
          <tr>
            {isVM ? (
              <>
                <th>Name</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Machine</th>
                <th>Internal IP</th>
                <th>Public IP</th>
                <th>Recommendation</th>
              </>
            ) : isBucket ? (
              <>
                <th>Name</th>
                <th>Location</th>
                <th>Storage Class</th>
                <th>Access</th>
                <th>Recommendation</th>
              </>
            ) : (
              // fallback for future modules
              Object.keys(sample).map((key) => (
                <th key={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {results.map((item, idx) => (
            <tr
              key={idx}
              style={{
                backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fbfc",
                borderBottom: "1px solid #ddd",
              }}
            >
              {isVM ? (
                <>
                  <td>{item.name}</td>
                  <td>{item.zone}</td>
                  <td>{item.status}</td>
                  <td>{item.machineType}</td>
                  <td>{item.internalIP}</td>
                  <td>{item.externalIP || "—"}</td>
                  <td>{item.recommendation}</td>
                </>
              ) : isBucket ? (
                <>
                  <td>{item.name}</td>
                  <td>{item.location}</td>
                  <td>{item.storageClass}</td>
                  <td>{item.access}</td>
                  <td>{item.recommendation}</td>
                </>
              ) : (
                // fallback if unknown type
                Object.keys(item).map((key) => <td key={key}>{item[key]}</td>)
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
