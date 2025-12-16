// src/components/common/AgTable.jsx

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function AgTable({ rowData, columnDefs, height = 400 }) {
  return (
    <div
      style={{
        width: "100%",
        overfLowX: "auto",
        overfLowY: "hidden",
      }}
    >
      <div
        className="ag-theme-quartz ag-scroll-inner"
        style={{
          minWidth: "100%",
          width: "max-content",
          borderRadius: "8px",
        }}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          domLayout="autoHeight"
          animateRows={true}
          suppressRowClickSelection={true}
          enableCellTextSelection={true}     // 🔥 copy/paste alLowed
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            minWidth: 250,
          }}
        />
      </div>
    </div>
  );
}
