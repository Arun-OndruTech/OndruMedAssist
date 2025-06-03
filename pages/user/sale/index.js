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
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import Stack from "@mui/material/Stack";
import { v4 as uuidv4 } from "uuid";

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
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

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
  const [phoneNumber, setPhoneNumber] = useState("");

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

      // Record the sale
      await axios.post("/api/Medicine/whole_sale", {
        uid: auth.currentUser.uid,
        sales,
      });

      // Build the invoice object
      const invoice = {
        invoiceNumber: `INV-${uuidv4()}`, // Add unique ID
        date: new Date(),

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
        customerPhone: phoneNumber, // Use phoneNumber state
      };

      // Save invoice to backend
      const response = await axios.post("/api/Invoice/add", {
        uid: auth.currentUser.uid,
        invoice,
      });

      // Get the saved invoice from response
      const savedInvoice = response.data.invoice;

      // Show success message
      dispatch({
        type: "show popup",
        payload: { msg: "Sale completed successfully", type: "success" },
      });

      // Set the invoice for dialog and open it
      setSelectedInvoice(savedInvoice);
      setOpen(true);

      // Reset customer info and cart
      setCustomerName("");
      setPhoneNumber("");
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
                              💰:
                            </span>
                            <Typography
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                display: "block",
                                ml: 0.5,
                              }}
                              title={`₹${medicine.price}`}
                            >
                              ₹{medicine.price}
                            </Typography>
                          </Box>

                          <Box ml={2} display="flex" alignItems="center">
                            <span role="img" aria-label="stock">
                              📦:
                            </span>
                            <Typography
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                display: "block",
                                ml: 0.5,
                              }}
                              title={medicine.quantity}
                            >
                              {medicine.quantity}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" mt={1}>
                          <span role="img" aria-label="expiry">
                            ⏳:
                          </span>
                          <Typography
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                              display: "block",
                              ml: 0.5,
                            }}
                            title={medicine.expiryDate}
                          >
                            {medicine.expiryDate
                              ? new Date(
                                  medicine.expiryDate
                                ).toLocaleDateString()
                              : "N/A"}
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
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Shopping Cart
                  </Typography>

                  {/* Customer Info Inputs */}
                  <Box display="flex" gap={2} mb={2}>
                    <TextField
                      label="Customer Name"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <TextField
                      label="Phone Number"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      inputProps={{ maxLength: 10 }}
                    />
                  </Box>

                  {/* Cart Items */}
                  {cart.length === 0 ? (
                    <Typography>No items in cart</Typography>
                  ) : (
                    <Stack spacing={2}>
                      {cart.map((item) => (
                        <Box
                          key={item._id}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          p={1.5}
                          border="1px solid #eee"
                          borderRadius={1}
                          boxShadow="0 1px 3px rgba(0,0,0,0.05)"
                        >
                          <Box flex={1}>
                            <Typography variant="subtitle1" noWrap>
                              {item.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              ₹{item.price} x {item.quantity} = ₹
                              {(item.price * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>

                          {/* Quantity Controls */}
                          <Box display="flex" alignItems="center" mx={1}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (item.quantity > 1) {
                                  setCart((prev) =>
                                    prev.map((i) =>
                                      i._id === item._id
                                        ? { ...i, quantity: i.quantity - 1 }
                                        : i
                                    )
                                  );
                                  setInventory((prev) =>
                                    prev.map((inv) =>
                                      inv._id === item._id
                                        ? { ...inv, quantity: inv.quantity + 1 }
                                        : inv
                                    )
                                  );
                                }
                              }}
                            >
                              <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>

                            <Typography variant="body2" mx={1}>
                              {item.quantity}
                            </Typography>

                            <IconButton
                              size="small"
                              onClick={() => {
                                const stockItem = inventory.find(
                                  (inv) => inv._id === item._id
                                );
                                if (item.quantity < stockItem.quantity) {
                                  setCart((prev) =>
                                    prev.map((i) =>
                                      i._id === item._id
                                        ? { ...i, quantity: i.quantity + 1 }
                                        : i
                                    )
                                  );
                                  setInventory((prev) =>
                                    prev.map((inv) =>
                                      inv._id === item._id
                                        ? { ...inv, quantity: inv.quantity - 1 }
                                        : inv
                                    )
                                  );
                                } else {
                                  dispatch({
                                    type: "show popup",
                                    payload: {
                                      msg: `Only ${stockItem.quantity} items available for ${item.name}.`,
                                      type: "error",
                                    },
                                  });
                                }
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          {/* Remove Button */}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setCart((prev) =>
                                prev.filter((i) => i._id !== item._id)
                              );
                              setInventory((prev) =>
                                prev.map((inv) =>
                                  inv._id === item._id
                                    ? {
                                        ...inv,
                                        quantity: inv.quantity + item.quantity,
                                      }
                                    : inv
                                )
                              );
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  {/* Total Price */}
                  <Typography variant="h6" mt={3}>
                    Total: ₹
                    {cart
                      .reduce(
                        (sum, item) => sum + item.quantity * item.price,
                        0
                      )
                      .toFixed(2)}
                  </Typography>

                  {/* Checkout Button */}
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
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
                      <h2>OndruAssist Pharmacy</h2>
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
