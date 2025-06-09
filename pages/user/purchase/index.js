import classes from "./purchase.module.css";
import Navbar from "../../../Components/subNavbar/navbar";
import Head from "next/head";
import DataTable from "../../../Components/DataTabel/DataTabel";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import axios from "axios";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { auth } from "../../../firebase/firebase";
import { StateContext } from "../../../Context/StateContext";
import SnackbarTag from "../../../Components/Snackbar/Snackbar";
import { columns } from "../../../Components/DataTabel/Purchase/Column";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

const Sales = () => {
  const router = useRouter();
  const [medicineData, setMedicineData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true); // ⬅️ Added loading state
  const { state, dispatch } = useContext(StateContext);

  useEffect(() => {
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
        setLoading(false); // ⬅️ Set loading to false after data is fetched
      })
      .catch((err) => {
        console.error(err);
        setLoading(false); // ⬅️ Also handle loading on error
      });
  }, []);

  const filteredData = medicineData.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>MedAssist | Purchase</title>
      </Head>
      <div className={classes.main_container}>
        <Navbar title="Purchase" />
        <div className={classes.dataTabelContainer}>
          <div
            className={classes.input_container}
            style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
          >
            <TextField
              label="Search medicines"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

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

          {/* Conditional Rendering */}
          {loading ? (
            <h2 style={{ opacity: ".5" }}>Loading medicines...</h2>
          ) : filteredData.length !== 0 ? (
            <DataTable data={filteredData} col={columns} />
          ) : (
            <>
              <h2 style={{ opacity: ".5" }}>No matching medicines found.</h2>
              <span style={{ opacity: ".5", fontWeight: "500" }}>
                Click here to add medicine -{" "}
                <a href="/user/purchase-medicine" style={{ color: "blue" }}>
                  Purchase medicine
                </a>
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
          if (reason === "clickaway") {
            return;
          }
          dispatch({ type: "close popup" });
        }}
      />
    </>
  );
};

export default Sales;
