import classes from "./sale.module.css";
import Navbar from "../../../Components/subNavbar/navbar";
import Head from "next/head";
import { useContext, useEffect, useState } from "react";
import { auth } from "../../../firebase/firebase";
import { StateContext } from "../../../Context/StateContext";
import SnackbarTag from "../../../Components/Snackbar/Snackbar";
import { TextField, Grid, Card, CardContent, Typography } from "@mui/material";
import { Button } from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
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
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import axios from "axios";

const Sales = () => {
  const [medicineData, setMedicineData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const { state, dispatch } = useContext(StateContext);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.post("/api/Medicine/fetch", {
          uid: auth.currentUser.uid,
        });
        setInventory(response.data.stock.filter((med) => med.quantity > 0));
        setMedicineData(response.data.sales || []);
      } catch (err) {
        dispatch({
          type: "show popup",
          payload: { msg: "Failed to fetch inventory", type: "error" },
        });
      }
    };

    if (auth.currentUser) {
      fetchInventory();
    }
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

    setInventory(
      inventory.map((item) =>
        item._id === medicine._id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      dispatch({
        type: "show popup",
        payload: { msg: "Cart is empty", type: "error" },
      });
      return;
    }

    if (!customerName.trim()) {
      dispatch({
        type: "show popup",
        payload: { msg: "Please enter customer name", type: "error" },
      });
      return;
    }

    setShowPaymentDialog(true);
  };

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

      await axios.post("/api/Medicine/whole_sale", {
        uid: auth.currentUser.uid,
        sales,
      });

      setPaymentMethod(method);
      setShowPaymentDialog(false);
      setShowOrderSummary(true);

      dispatch({
        type: "show popup",
        payload: { msg: "Sale completed successfully", type: "success" },
      });

      const invoice = {
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

      // Save invoice with uid
      await axios.post("/api/Invoice/add", {
        uid: auth.currentUser.uid,
        invoice,
      });

      // Reset cart and customer info
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
    } catch (error) {
      console.error("Sale error:", error);
      dispatch({
        type: "show popup",
        payload: {
          msg:
            "Failed to process sale: " +
            (error.response?.data?.msg || error.message),
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

    if (typeof window !== "undefined") {
      import("html2pdf.js").then((html2pdf) => {
        html2pdf().set(opt).from(content).save();
      });
    }
  };

  const filteredMedicines = inventory.filter((med) =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>MedAssist | POS Sales</title>
      </Head>
      <div className={classes.main_container}>
        <Navbar title="POS Sales" />
        <div className={classes.pos_container}>
          <Grid container spacing={3}>
            {/* Customer Info */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Customer Information</Typography>
                  <TextField
                    label="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <TextField
                    label="Phone Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                </CardContent>
              </Card>
            </Grid>

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
                  <Grid item xs={4} key={medicine._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{medicine.name}</Typography>
                        <Typography>Price: ₹{medicine.price}</Typography>
                        <Typography>Stock: {medicine.quantity}</Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddShoppingCartIcon />}
                          onClick={() => handleAddToCart(medicine)}
                          disabled={medicine.quantity < 1}
                          fullWidth
                          sx={{ mt: 1 }}
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
                  <Typography variant="h5" gutterBottom>
                    Shopping Cart
                  </Typography>
                  {cart.length === 0 ? (
                    <Typography>Your cart is empty</Typography>
                  ) : (
                    <>
                      {cart.map((item) => (
                        <div key={item._id} className={classes.cart_item}>
                          <Typography variant="body1">{item.name}</Typography>
                          <Typography>Qty: {item.quantity}</Typography>
                          <Typography>
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </Typography>
                        </div>
                      ))}
                      <Typography variant="h6" sx={{ mt: 2 }}>
                        Total: ₹
                        {cart
                          .reduce(
                            (sum, item) => sum + item.quantity * item.price,
                            0
                          )
                          .toFixed(2)}
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleCheckout}
                        sx={{ mt: 2 }}
                      >
                        Checkout
                      </Button>
                    </>
                  )}
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

        {/* Order Summary Dialog */}
        <Dialog
          open={showOrderSummary}
          onClose={() => setShowOrderSummary(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ m: 0, p: 2 }}>
            Order Summary
            <IconButton
              aria-label="close"
              onClick={() => setShowOrderSummary(false)}
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
            <div id="orderSummary">
              <Typography variant="h6" gutterBottom>
                Order Details
              </Typography>
              <Typography>Date: {new Date().toLocaleDateString()}</Typography>
              <Typography>Payment Method: {paymentMethod}</Typography>
              <Typography>Customer: {customerName}</Typography>
              {customerPhone && <Typography>Phone: {customerPhone}</Typography>}
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.price}</TableCell>
                        <TableCell align="right">
                          ₹{(item.quantity * item.price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <strong>Grand Total:</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          ₹
                          {cart
                            .reduce(
                              (sum, item) => sum + item.quantity * item.price,
                              0
                            )
                            .toFixed(2)}
                        </strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Button
                onClick={handlePrint}
                variant="contained"
                startIcon={<PrintIcon />}
              >
                Print
              </Button>
              <Button
                onClick={handleDownload}
                variant="contained"
                startIcon={<DownloadIcon />}
              >
                Download PDF
              </Button>
            </Box>
          </DialogContent>
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
