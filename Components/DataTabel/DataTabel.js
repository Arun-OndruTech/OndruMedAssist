import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import styles from "./DataTabel.module.css"; // Make sure this file exists

export default function DataTable({ data, col, type }) {
  // Sort: low quantity first, then others
  const rows = [...data].sort((a, b) => {
    // Put rows with quantity < 1 at the top
    if (a.quantity < 1 && b.quantity >= 1) return -1;
    if (a.quantity >= 1 && b.quantity < 1) return 1;
    return 0; // keep original order otherwise
  });

  return (
    <div style={{ height: 475, width: "100%" }}>
      <DataGrid
        getRowId={(row) => row._id}
        rows={rows}
        columns={col}
        pageSize={7}
        rowsPerPageOptions={[7]}
        className="table"
        getRowClassName={(params) =>
          params.row.quantity < 1 ? styles.lowStockRow : ""
        }
      />
    </div>
  );
}
