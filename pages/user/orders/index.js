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
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const Orders = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [open, setOpen] = useState(false);
  const { state, dispatch } = useContext(StateContext);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.post("/api/Invoice/fetch", {
          uid: auth.currentUser.uid,
        });
        setInvoices(response.data);
      } catch (error) {
        dispatch({
          type: "show popup",
          payload: { msg: "Failed to fetch invoices", type: "error" },
        });
      }
    };
    fetchInvoices();
  }, []);

  const handleOpen = (invoice) => {
    setSelectedInvoice(invoice);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const columns = [
    { field: "invoiceNumber", headerName: "Invoice #", width: 180 },
    {
      field: "date",
      headerName: "Date",
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    { field: "customerName", headerName: "Customer", width: 150 },
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
        <div className={classes.dataTabelContainer}>
          {invoices.length > 0 ? (
            <DataTable data={invoices} col={columns} />
          ) : (
            <h2 style={{ opacity: ".5" }}>No orders found</h2>
          )}
        </div>
      </div>

      {/* Invoice Details Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Invoice Details</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <>
              <div className={classes.invoiceHeader}>
                <div>
                  <h2>MedAssist Pharmacy</h2>
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
