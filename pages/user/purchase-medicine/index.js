import Navbar from "../../../Components/subNavbar/navbar";
import classes from "./add_item.module.css";
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
} from "@mui/material";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import NavigationBar from "../../../Components/SideLayout/Navigation/NavigationBar";
import { useContext, useEffect, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import axios from "axios";
import { useRouter } from "next/router";
import { auth } from "../../../firebase/firebase";
import convertDate from "../../../utils/convertDate";
import getCurrentDate from "../../../utils/getCurrentDate";
import { StateContext } from "../../../Context/StateContext";
import AlertDialog from "../../../Components/AlertDialog/AlertDialog";
import Head from "next/head";
import AddIcon from "@mui/icons-material/Add";

// Prevent non-numeric and negative inputs
const blockInvalidChar = (e) => {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
};

const AddItem = () => {
  const { state, dispatch } = useContext(StateContext);
  const router = useRouter();

  const [value, setValue] = useState(dayjs(convertDate(getCurrentDate())));
  const [data, setData] = useState({
    name: "",
    quantity: "",
    price: "",
    vendorName: "",
  });
  const [vendors, setVendors] = useState([]);
  const [customVendor, setCustomVendor] = useState(false);

  useEffect(() => {
    axios
      .post("/api/Medicine/fetch", { uid: auth.currentUser.uid })
      .then((res) => {
        const uniqueVendors = [
          ...new Set(
            res.data.history?.map((m) => m.vendorName).filter(Boolean)
          ),
        ];
        setVendors(uniqueVendors);
      });
  }, []);

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  const changeHandle = (e) => {
    const element = e.target.id;
    setData((current) => ({ ...current, [element]: e.target.value }));
  };

  const closeAlert = () => {
    dispatch({ type: "close alert" });
    router.replace("/user/items");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let currentDate = new Date();
    const ex_date = `${value.year()}-${(value.month() + 1)
      .toString()
      .padStart(2, "0")}-${value.date().toString().padStart(2, "0")}`;
    const cu_date = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${currentDate.getDate().toString().padStart(2, "0")}`;

    const expiryDate = new Date(ex_date);

    if (expiryDate > currentDate) {
      axios
        .post(process.env.NEXT_PUBLIC_API_URL + "/Medicine/add", {
          uid: auth.currentUser.uid,
          ...data,
          expiryDate: ex_date,
          uploadOn: cu_date,
        })
        .then((res) => {
          dispatch({
            type: "open popup",
            playload: {
              msg: res.data.msg,
              type: "success",
            },
          });
          router.replace("/user/purchase");
        })
        .catch((err) => {
          dispatch({
            type: "open popup",
            playload: {
              msg: err.message || "Something went wrong",
              type: "error",
            },
          });
        });
    } else {
      dispatch({
        type: "open alert",
        playload: {
          title: "Expiry Alert...",
          msg: "Oops! Medicine is already expired... you cannot add this to stock.",
        },
      });
    }
  };

  if (state.isAlertOpen) {
    return (
      <AlertDialog
        info={state.alertMsg}
        open={state.isAlertOpen}
        title={state.alertTitle}
        handleClose={closeAlert}
      />
    );
  }

  return (
    <>
      <Head>
        <title>MedAssist | Purchase Medicine</title>
      </Head>
      <Navbar title="Purchase Medicine" />
      <NavigationBar />
      <div className={classes.add_container}>
        <form className={classes.container} onSubmit={handleSubmit}>
          <TextField
            required
            className={classes.input}
            id="name"
            label="Item Name"
            variant="outlined"
            value={data.name}
            onChange={changeHandle}
          />

          <div
            className={classes.vendorFieldContainer}
            style={{ display: "flex", gap: "12px", alignItems: "center" }}
          >
            {!customVendor ? (
              <FormControl sx={{ flex: "0 0 65%" }}>
                <InputLabel id="vendor-label">Vendor Name</InputLabel>
                <Select
                  labelId="vendor-label"
                  id="vendorName"
                  value={data.vendorName}
                  label="Vendor Name"
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, vendorName: e.target.value }))
                  }
                >
                  {vendors.map((vendor, idx) => (
                    <MenuItem key={idx} value={vendor}>
                      {vendor}
                    </MenuItem>
                  ))}
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                </Select>
              </FormControl>
            ) : (
              <TextField
                required
                sx={{ flex: "0 0 65%" }}
                id="vendorName"
                label="New Vendor Name"
                variant="outlined"
                value={data.vendorName}
                onChange={changeHandle}
              />
            )}

            <Button
              onClick={() => setCustomVendor((prev) => !prev)}
              variant="outlined"
              color="primary"
              // startIcon={<AddIcon />}
              sx={{ flex: "0 0 130px", whiteSpace: "nowrap" }}
              className={classes.addVendorBtn}
            >
              {customVendor ? "Existing" : "Add Vendor"}
            </Button>
          </div>

          <TextField
            required
            className={classes.input}
            id="quantity"
            label="Quantity"
            type="number"
            inputProps={{ min: 1 }}
            onKeyDown={blockInvalidChar}
            variant="outlined"
            value={data.quantity}
            onChange={changeHandle}
          />

          <TextField
            required
            className={classes.input}
            id="price"
            label="Price (per/piece)"
            type="number"
            inputProps={{ min: 1 }}
            onKeyDown={blockInvalidChar}
            variant="outlined"
            value={data.price}
            onChange={changeHandle}
          />

          <div className={classes.cal}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DesktopDatePicker
                label="Expiry Date"
                inputFormat="MM/DD/YYYY"
                value={value}
                onChange={handleChange}
                renderInput={(params) => (
                  <TextField className={classes.input} required {...params} />
                )}
                views={["day", "month", "year"]}
              />
            </LocalizationProvider>
          </div>

          <div className={classes.btn}>
            <Button variant="contained" type="submit">
              PURCHASE
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddItem;
