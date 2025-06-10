export const columns = [
  // { field: "_id", headerName: "ID", width: 220 },
  { field: "name", headerName: "Name", width: 250 },

  {
    field: "vendorName",
    headerName: "vendor Name",
    width: 250,
  },
  {
    field: "price",
    headerName: "Price",
    type: "number",
    width: 160,
  },
  {
    field: "quantity",
    headerName: "Quantity",
    type: "number",
    width: 160,
  },
  {
    field: "expiryDate",
    headerName: "Expiry Date",
    width: 190,
    valueFormatter: (params) => {
      const date = new Date(params.value);
      return `${String(date.getDate()).padStart(2, "0")}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${date.getFullYear()}`;
    },
  },
  ,
  {
    field: "uploadOn",
    headerName: "Upload-On",
    width: 160,
    valueFormatter: (params) => {
      const date = new Date(params.value);
      return `${String(date.getDate()).padStart(2, "0")}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${date.getFullYear()}`;
    },
  },
];
