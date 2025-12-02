// src/components/common/AgTable.jsx

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function AgTable({ rowData, columnDefs, height = 400 }) {
  return (
    <div
      className="ag-theme-quartz"
      style={{
        height,
        width: "100%",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
         domLayout="autoHeight"
        animateRows={true}
      />
    </div>
  );
}
