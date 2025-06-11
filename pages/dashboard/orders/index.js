import classes from "./orders.module.css";
import Head from "next/head";
import Navbar from "../../../Components/subNavbar/navbar";
import DataTable from "../../../Components/DataTabel/DataTabel";
import { useContext, useEffect, useState } from "react";
import { auth } from "../../../firebase/firebase";
import axios from "axios";
import { StateContext } from "../../../Context/StateContext";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const Orders = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { state, dispatch } = useContext(StateContext);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const response = await axios.post("/api/Invoice/fetch", {
          uid: auth.currentUser.uid,
        });
        setInvoices(response.data);
        setFilteredInvoices(response.data);
      } catch (error) {
        console.error("Fetch invoices error:", error);
        dispatch({
          type: "show popup",
          payload: { msg: "Failed to fetch invoices", type: "error" },
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchInvoices();
    }
  }, [dispatch]);

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setFilterType(value);
    applySearch(searchQuery, value);
  };

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchQuery(value);
    applySearch(value, filterType);
  };

  const applySearch = (query, type) => {
    let filtered = invoices;
    if (type === "name") {
      filtered = invoices.filter((inv) =>
        inv.customerName?.toLowerCase().includes(query)
      );
    } else if (type === "invoice") {
      filtered = invoices.filter((inv) =>
        inv.invoiceNumber?.toLowerCase().includes(query)
      );
    } else if (type === "date") {
      filtered = invoices.filter((inv) =>
        new Date(inv.date).toLocaleDateString().includes(query)
      );
    } else {
      filtered = invoices.filter(
        (inv) =>
          inv.customerName?.toLowerCase().includes(query) ||
          inv.invoiceNumber?.toLowerCase().includes(query) ||
          new Date(inv.date).toLocaleDateString().includes(query)
      );
    }
    setFilteredInvoices(filtered);
  };

  const handleOpen = (row) => {
    setSelectedInvoice(row);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedInvoice(null);
  };

  const columns = [
    { field: "invoiceNumber", headerName: "Invoice #", width: 280 },
    {
      field: "date",
      headerName: "Sale Date",
      width: 150,
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return `${String(date.getDate()).padStart(2, "0")}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${date.getFullYear()}`;
      },
    },
    { field: "customerName", headerName: "Customer", width: 200 },
    {
      field: "totalAmount",
      headerName: "Amount",
      width: 120,
      valueFormatter: (params) => `₹${params.value.toFixed(2)}`,
    },
    { field: "paymentMethod", headerName: "Payment", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleOpen(params.row)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>MedAssist | Orders</title>
      </Head>
      <div className={classes.main_container}>
        <Navbar title="Orders" />

        <div className={classes.searchContainer}>
          <div className={classes.filterBox}>
            <FormControl fullWidth size="small">
              <InputLabel>Search By</InputLabel>
              <Select
                value={filterType}
                label="Search By"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="name">Customer Name</MenuItem>
                <MenuItem value="invoice">Invoice Number</MenuItem>
                <MenuItem value="date">Date</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div className={classes.searchBox}>
            <TextField
              label="Search"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={handleSearch}
              size="small"
            />
          </div>
        </div>

        <div className={classes.dataTabelContainer}>
          {isLoading ? (
            <h2 style={{ opacity: 0.6 }}>Loading orders...</h2>
          ) : filteredInvoices.length > 0 ? (
            <DataTable data={filteredInvoices} col={columns} />
          ) : (
            <h2 style={{ opacity: 0.5 }}>No orders found</h2>
          )}
        </div>
      </div>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Invoice Details</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <>
              <div className={classes.invoiceHeader}>
                <div>
                  <h2>OndruAssist Pharmacy</h2>
                  <p>Invoice #: {selectedInvoice.invoiceNumber}</p>
                </div>
                <div className={classes.invoiceMeta}>
                  <p>
                    Date: {new Date(selectedInvoice.date).toLocaleDateString()}
                  </p>
                  <p>Payment: {selectedInvoice.paymentMethod}</p>
                </div>
              </div>

              <div className={classes.customerInfo}>
                <h3>Customer:</h3>
                <p>{selectedInvoice.customerName}</p>
                <p>{selectedInvoice.customerPhone}</p>
              </div>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          ₹{item.price.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          ₹{item.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <strong>Grand Total:</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          ₹{selectedInvoice.totalAmount.toFixed(2)}
                        </strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button variant="contained" onClick={() => window.print()}>
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Orders;
