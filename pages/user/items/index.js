import classes from "./items.module.css";
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
import { columns } from "../../../Components/DataTabel/Items/Column";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { TextField, CircularProgress } from "@mui/material";

const Items = () => {
  const router = useRouter();
  const [medicineData, setMedicineData] = useState([]);
  const [loading, setLoading] = useState(true); // ⬅️ Loading state
  const [searchTerm, setSearchTerm] = useState("");
  const { state, dispatch } = useContext(StateContext);

  useEffect(() => {
    axios
      .post("/api/Medicine/fetch", { uid: auth.currentUser.uid })
      .then((res) => {
        setMedicineData(res.data.stock || []);
        setLoading(false); // ⬅️ Set loading to false after data is fetched
      })
      .catch(() => {
        setLoading(false); // ⬅️ Even on error, stop loading
      });
  }, []);

  const filteredData = medicineData.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>MedAssist | Items</title>
      </Head>
      <div className={classes.main_container}>
        <Navbar title="Items" />
        <div className={classes.dataTabelContainer}>
          <div className={classes.input_container}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              margin="normal"
            />
          </div>

          {/* Loader */}
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
              <h2 style={{ opacity: ".5" }}>
                You haven't added any medicine yet.
              </h2>
              <span style={{ opacity: ".5", fontWeight: "500" }}>
                Click here to add medicine –{" "}
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
          if (reason === "clickaway") return;
          dispatch({ type: "close popup" });
        }}
      />
    </>
  );
};

export default Items;
