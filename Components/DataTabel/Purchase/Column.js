// Components/DataTabel/Purchase/Column.js
export const columns = [
  { id: "name", field: "name", headerName: "Name", width: 350 },
  {
    id: "vendorname",
    field: "vendorName",
    headerName: "Vendor Name",
    width: 250,
  },
  {
    id: "total_quantity",
    field: "total_quantity",
    headerName: "Purchased Quantity",
    type: "number",
    width: 160,
  },

  {
    field: "quantity",
    headerName: "Available Quantity",
    type: "number",
    width: 160,
  },
  {
    field: "price",
    headerName: "Price",
    type: "number",
    width: 160,
  },
  {
    field: "updateon",
    field: "updateon",
    headerName: "Purchase On",
    width: 250,
    valueFormatter: (params) => {
      const date = new Date(params.value);
      return `${String(date.getDate()).padStart(2, "0")}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${date.getFullYear()}`;
    },
  },
];
