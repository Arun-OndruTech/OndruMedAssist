import classes from "./purchase.module.css";
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
import { columns } from "../../../Components/DataTabel/Purchase/Column";
import Link from "next/link";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

const Sales = () => {
  const router = useRouter();
  const [medicineData, setMedicineData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const { state, dispatch } = useContext(StateContext);

  useEffect(() => {
    if (!auth.currentUser) return;
    axios
      .post("/api/Medicine/fetch", { uid: auth.currentUser.uid })
      .then((res) => {
        const history = res.data.history || [];
        const stock = res.data.stock || [];

        const adds = history.filter((m) => m.type === "add");
        const enriched = adds.map((item) => {
          const stockMatch = stock.find((s) => s.name === item.name);
          return {
            ...item,
            quantity: stockMatch ? stockMatch.quantity : 0,
            price: stockMatch ? stockMatch.price : item.price,
          };
        });

        setMedicineData(enriched);
        setFilteredData(enriched);
      })
      .catch((err) => {
        console.error(err);
        dispatch({
          type: "show popup",
          payload: { msg: "Failed to fetch medicines", type: "error" },
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
    let filtered = medicineData;
    if (type === "name") {
      filtered = medicineData.filter((item) =>
        item.name?.toLowerCase().includes(query)
      );
    } else if (type === "vendor") {
      filtered = medicineData.filter((item) =>
        item.vendorName?.toLowerCase().includes(query)
      );
    } else {
      filtered = medicineData.filter(
        (item) =>
          item.name?.toLowerCase().includes(query) ||
          item.vendorName?.toLowerCase().includes(query)
      );
    }
    setFilteredData(filtered);
  };

  return (
    <>
      <Head>
        <title>MedAssist | Purchase</title>
      </Head>
      <div className={classes.main_container}>
        <Navbar title="Purchase" />

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
                <MenuItem value="name">Medicine Name</MenuItem>
                <MenuItem value="vendor">Vendor Name</MenuItem>
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

          <div className={classes.buttonBox}>
            <Button
              startIcon={<ShoppingCartIcon />}
              variant="contained"
              color="primary"
              onClick={() => router.replace("/user/purchase-medicine")}
              style={{ whiteSpace: "nowrap", height: "40px" }}
            >
              Purchase
            </Button>
          </div>
        </div>

        <div className={classes.dataTabelContainer}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <CircularProgress />
              <p style={{ marginTop: "1rem", opacity: 0.7, fontWeight: 500 }}>
                Fetching medicines, please wait...
              </p>
            </div>
          ) : filteredData.length !== 0 ? (
            <DataTable data={filteredData} col={columns} />
          ) : (
            <>
              <h2 style={{ opacity: ".5" }}>No matching medicines found.</h2>
              <span style={{ opacity: ".5", fontWeight: "500" }}>
                Click here to add medicine –{" "}
                <Link href="/user/purchase-medicine/">Purchase</Link>
              </span>
            </>
          )}
        </div>
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
