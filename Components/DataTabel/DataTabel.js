import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import styles from "./DataTabel.module.css"; // Make sure this file exists

export default function DataTable({ data, col, type }) {
  const rows = data;

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
