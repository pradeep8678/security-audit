export default function ResultsTable({ results }) {
  if (!results || results.length === 0) return <div>No public VMs found.</div>;
  return (
    <table border="1" cellPadding="8" style={{marginTop:"20px", width:"100%"}}>
      <thead><tr>
        <th>Name</th><th>Zone</th><th>Status</th>
        <th>Machine</th><th>Internal IP</th><th>Public IP</th>
      </tr></thead>
      <tbody>
        {results.map((vm, idx) => (
          <tr key={idx}>
            <td>{vm.name}</td><td>{vm.zone}</td><td>{vm.status}</td>
            <td>{vm.machineType}</td><td>{vm.internalIP}</td><td>{vm.externalIP}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}