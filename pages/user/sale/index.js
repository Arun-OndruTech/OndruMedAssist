import classes from "./sale.module.css";
import Navbar from "../../../Components/subNavbar/navbar";
import Head from "next/head";
import DataTable from "../../../Components/DataTabel/DataTabel";
import Button from "@mui/material/Button";
import axios from "axios";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { auth } from "../../../firebase/firebase";
import { StateContext } from "../../../Context/StateContext";
import SnackbarTag from "../../../Components/Snackbar/Snackbar";
import { columns_sale } from "../../../Components/DataTabel/Sales/Column";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { TextField, Grid, Card, CardContent, Typography } from "@mui/material";
import {
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
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";

const Sales = () => {
  const router = useRouter();
  const [medicineData, setMedicineData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const { state, dispatch } = useContext(StateContext);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // --- NEW: State for invoice dialog ---
  const [open, setOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    // Fetch available medicines
    axios
      .post("/api/Medicine/fetch", { uid: auth.currentUser.uid })
      .then((res) => {
        setInventory(res.data.stock.filter((med) => med.quantity > 0));
        setMedicineData(res.data.sales || []);
      })
      .catch((err) => {
        dispatch({
          type: "show popup",
          payload: { msg: "Failed to fetch inventory", type: "error" },
        });
      });
  }, []);

  const handleAddToCart = (medicine) => {
    const existingItem = cart.find((item) => item._id === medicine._id);

    if (medicine.quantity <= 0) {
      dispatch({
        type: "show popup",
        payload: {
          msg: `No stock available for ${medicine.name}.`,
          type: "error",
        },
      });
      return;
    }

    // Find the stock item from inventory
    const stockItem = inventory.find((item) => item._id === medicine._id);
    if (!stockItem || stockItem.quantity <= 0) {
      dispatch({
        type: "show popup",
        payload: {
          msg: `No stock available for ${medicine.name}.`,
          type: "error",
        },
      });
      return;
    }

    // Check if quantity in cart exceeds available stock
    const totalInCart = existingItem ? existingItem.quantity + 1 : 1;
    if (totalInCart > stockItem.quantity) {
      dispatch({
        type: "show popup",
        payload: {
          msg: `Only ${stockItem.quantity} items available for ${medicine.name}.`,
          type: "error",
        },
      });
      return;
    }

    // Update the cart
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === medicine._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }

    // Decrease the quantity in inventory
    setInventory(
      inventory.map((item) =>
        item._id === medicine._id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      dispatch({
        type: "show popup",
        payload: { msg: "Cart is empty", type: "error" },
      });
      return;
    }
    setShowPaymentDialog(true);
  };

  // --- MODIFIED: Show invoice dialog after sale ---
  const handlePaymentSubmit = async (method) => {
    try {
      const sales = cart.map((item) => ({
        uid: auth.currentUser.uid,
        _id: item._id,
        quantity: item.quantity,
        name: item.name,
        type: "sale",
        uploadOn: new Date().toISOString(),
        price: item.price,
        date: new Date().toISOString(),
      }));

      // Make API calls for each item in the cart
      await axios.post("/api/Medicine/whole_sale", {
        uid: auth.currentUser.uid,
        sales,
      });

      setPaymentMethod(method);
      setShowPaymentDialog(false);

      dispatch({
        type: "show popup",
        payload: { msg: "Sale completed successfully", type: "success" },
      });

      // --- Build invoice object without invoiceNumber ---
      const invoice = {
        // invoiceNumber will be set after backend response
        date: new Date().toISOString(),
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        })),
        paymentMethod: method,
        totalAmount: cart.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        ),
        customerName,
        customerPhone,
      };

      // Save invoice to backend and get the invoice number from response
      const response = await axios.post("/api/Invoice/add", {
        uid: auth.currentUser.uid,
        invoice,
      });

      // Use the invoice number from backend response
      const invoiceNumber =
        response.data?.invoiceNumber ||
        response.data?.invoice?.invoiceNumber ||
        Math.floor(Math.random() * 1000000);

      // --- Set invoice for dialog and open it ---
      setSelectedInvoice({ ...invoice, invoiceNumber });
      setOpen(true);

      // Reset customer info and cart
      setCustomerName("");
      setCustomerPhone("");
      setCart([]);
    } catch (error) {
      console.error("Sale error:", error);
      dispatch({
        type: "show popup",
        payload: {
          msg:
            "Failed to process sale: " +
            (error.response?.data?.message || error.message),
          type: "error",
        },
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = document.getElementById("orderSummary");
    const opt = {
      margin: 1,
      filename: `order-summary-${new Date().toISOString()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(content).save();
  };

  const filteredMedicines = inventory.filter((med) =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- MODIFIED: handleClose for dialog ---
  const handleClose = () => {
    setOpen(false);
    setSelectedInvoice(null);
  };

  return (
    <>
      <Head>
        <title>MedAssist | POS Sales</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      </Head>
      <div className={classes.main_container}>
        <Navbar title="Sales" />
        <div className={classes.pos_container}>
          <Grid container spacing={3}>
            {/* Left side - Inventory */}
            <Grid item xs={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                margin="normal"
              />
              <Grid container spacing={2}>
                {filteredMedicines.map((medicine) => (
                  <Grid item xs={4} key={medicine.name}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "100%",
                            display: "block",
                          }}
                          title={medicine.name}
                        >
                          {medicine.name}
                        </Typography>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Box mr={1} display="flex" alignItems="center">
                            <span role="img" aria-label="price">
                              💰Price:
                            </span>
                          </Box>
                          <Typography
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                              display: "block",
                            }}
                            title={`₹${medicine.price}`}
                          >
                            ₹{medicine.price}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Box mr={1} display="flex" alignItems="center">
                            <span role="img" aria-label="stock">
                              📦 Stock:
                            </span>
                          </Box>
                          <Typography
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                              display: "block",
                            }}
                            title={medicine.quantity}
                          >
                            {medicine.quantity}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          startIcon={<AddShoppingCartIcon />}
                          onClick={() => handleAddToCart(medicine)}
                          disabled={medicine.quantity < 1}
                          fullWidth
                        >
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Right side - Cart */}
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h5">Shopping Cart</Typography>
                  {cart.map((item) => (
                    <div key={item.name} className={classes.cart_item}>
                      <Typography>{item.name}</Typography>
                      <Typography>Qty: {item.quantity}</Typography>
                      <Typography>₹{item.quantity * item.price}</Typography>
                    </div>
                  ))}
                  <Typography variant="h6">
                    Total: ₹
                    {cart.reduce(
                      (sum, item) => sum + item.quantity * item.price,
                      0
                    )}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                  >
                    Checkout
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>

        {/* Payment Method Dialog */}
        <Dialog
          open={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
        >
          <DialogTitle sx={{ m: 0, p: 2 }}>
            Select Payment Method
            <IconButton
              aria-label="close"
              onClick={() => setShowPaymentDialog(false)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please select your payment method:
            </DialogContentText>
            <Button
              onClick={() => handlePaymentSubmit("cash")}
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Cash
            </Button>
            <Button
              onClick={() => handlePaymentSubmit("card")}
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Card
            </Button>
          </DialogContent>
        </Dialog>

        {/* Invoice Details Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>Invoice Details</DialogTitle>
          <DialogContent>
            {selectedInvoice && (
              <>
                <div id="orderSummary">
                  <div className={classes.invoiceHeader}>
                    <div>
                      <h2>MedAssist Pharmacy</h2>
                      <p>Invoice #: {selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div className={classes.invoiceMeta}>
                      <p>
                        Date:{" "}
                        {new Date(selectedInvoice.date).toLocaleDateString()}
                      </p>
                      <p>Payment: {selectedInvoice.paymentMethod}</p>
                    </div>
                  </div>

                  {/* <div className={classes.customerInfo}>
                    <h3>Customer:</h3>
                    <p>{selectedInvoice.customerName}</p>
                    <p>{selectedInvoice.customerPhone}</p>
                  </div> */}

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
                </div>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            <Button variant="contained" onClick={handlePrint}>
              Print
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleDownload}
            >
              Download PDF
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      <SnackbarTag
        open={state.isPopUpOpen}
        msg={state.popupMsg}
        type={state.popupType}
        close={(reason) => {
          if (reason === "clickaway") return;
          dispatch({ type: "close popup" });
        }}
      />
    </>
  );
};

export default Sales;
