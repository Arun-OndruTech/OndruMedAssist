import classes from './sale.module.css';
import Navbar from "../../../Components/subNavbar/navbar";
import Head from 'next/head';
import DataTable from '../../../Components/DataTabel/DataTabel';
import Button from '@mui/material/Button';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { auth } from '../../../firebase/firebase';
import { StateContext } from '../../../Context/StateContext';
import SnackbarTag from '../../../Components/Snackbar/Snackbar';
import { columns_sale } from '../../../Components/DataTabel/Sales/Column';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { TextField, Grid, Card, CardContent, Typography } from '@mui/material';
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
  Box
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';

const Sales = () => {
  const router = useRouter();
  const [medicineData, setMedicineData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const { state, dispatch } = useContext(StateContext);

  useEffect(() => {
    // Fetch available medicines
    axios.post('/api/Medicine/fetch', { uid: auth.currentUser.uid })
      .then((res) => {
        setInventory(res.data.stock || []);
        setMedicineData(res.data.sales || []);
      })
      .catch(err => {
        dispatch({ 
          type: 'show popup', 
          payload: { msg: 'Failed to fetch inventory', type: 'error' } 
        });
      });
  }, []);

  const handleAddToCart = (medicine) => {
    const existingItem = cart.find(item => item.name === medicine.name);
    if (existingItem) {
      setCart(cart.map(item => 
        item.name === medicine.name 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }
  };

  const handleCheckout = async () => {
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async (method) => {
    try {
      const sales = cart.map(item => ({
        uid: auth.currentUser.uid,
        _id: item._id,
        quantity: item.quantity,
        name: item.name,
        type: 'sale',
        uploadOn: new Date().toISOString(),
        price: item.price,
        date: new Date().toISOString()
      }));

      // Make API calls for each item in the cart
      await Promise.all(sales.map(saleItem => 
        axios.post('/api/Medicine/whole_sale', saleItem)
      ));

      setPaymentMethod(method);
      setShowPaymentDialog(false);
      setShowOrderSummary(true);

      dispatch({ 
        type: 'show popup', 
        payload: { msg: 'Sale completed successfully', type: 'success' } 
      });
    } catch (error) {
      console.error('Sale error:', error);
      dispatch({ 
        type: 'show popup', 
        payload: { msg: 'Failed to process sale: ' + (error.response?.data?.message || error.message), type: 'error' } 
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = document.getElementById('orderSummary');
    const opt = {
      margin: 1,
      filename: `order-summary-${new Date().toISOString()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(content).save();
  };

  const filteredMedicines = inventory.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>MedAssist | POS Sales</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      </Head>
      <div className={classes.main_container}>
        <Navbar title="POS Sales" />
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
                        <Typography variant="h6">{medicine.name}</Typography>
                        <Typography>Price: ₹{medicine.price}</Typography>
                        <Typography>Stock: {medicine.quantity}</Typography>
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
                    Total: ₹{cart.reduce((sum, item) => sum + (item.quantity * item.price), 0)}
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
        <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)}>
          <DialogTitle>Select Payment Method</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please select your payment method:
            </DialogContentText>
            <Button onClick={() => handlePaymentSubmit('cash')} variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
              Cash
            </Button>
            <Button onClick={() => handlePaymentSubmit('card')} variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
              Card
            </Button>
          </DialogContent>
        </Dialog>

        {/* Order Summary Dialog */}
        <Dialog 
          open={showOrderSummary} 
          onClose={() => {
            setShowOrderSummary(false);
            setCart([]);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Order Summary</DialogTitle>
          <DialogContent>
            <div id="orderSummary">
              <Typography variant="h6" gutterBottom>Order Details</Typography>
              <Typography>Date: {new Date().toLocaleDateString()}</Typography>
              <Typography>Payment Method: {paymentMethod}</Typography>
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
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.price}</TableCell>
                        <TableCell align="right">₹{item.quantity * item.price}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right"><strong>Grand Total:</strong></TableCell>
                      <TableCell align="right"><strong>₹{cart.reduce((sum, item) => sum + (item.quantity * item.price), 0)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
                Print
              </Button>
              <Button onClick={handleDownload} variant="contained" startIcon={<DownloadIcon />}>
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
          if (reason === 'clickaway') return;
          dispatch({ type: 'close popup' });
        }}
      />
    </>
  );
};

export default Sales;