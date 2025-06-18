import Navbar from "../../../Components/subNavbar/navbar";
import classes from "./add_item.module.css";
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

// Validation Schema
const schema = yup.object().shape({
  name: yup
    .string()
    .required("Item name is required")
    .matches(
      /^[a-zA-Z0-9\s-]+$/,
      "Only letters, numbers, spaces, and '-' allowed"
    ),
  vendorName: yup
    .string()
    .required("Vendor name is required")
    .matches(
      /^[a-zA-Z0-9\s-]+$/,
      "Only letters, numbers, spaces, and '-' allowed"
    ),
  quantity: yup
    .number()
    .required("Quantity is required")
    .positive("Quantity must be greater than 0")
    .integer("Quantity must be an integer"),
  price: yup
    .number()
    .required("Price is required")
    .positive("Price must be greater than 0"),
  expiryDate: yup
    .date()
    .required("Expiry date is required")
    .min(new Date(), "Expiry date must be in the future"),
});

const AddItem = () => {
  const { state, dispatch } = useContext(StateContext);
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [customVendor, setCustomVendor] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      vendorName: "",
      quantity: "",
      price: "",
      expiryDate: dayjs(convertDate(getCurrentDate())),
    },
  });

  useEffect(() => {
    axios
      .post("/api/Medicine/fetch", { uid: auth.currentUser?.uid })
      .then((res) => {
        const uniqueVendors = [
          ...new Set(
            res.data.history?.map((m) => m.vendorName).filter(Boolean)
          ),
        ];
        setVendors(uniqueVendors);
      });
  }, []);

  const onSubmit = async (data) => {
    if (loading) return;
    setLoading(true);

    const ex_date = dayjs(data.expiryDate).format("YYYY-MM-DD");
    const cu_date = dayjs(new Date()).format("YYYY-MM-DD");

    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/Medicine/add",
        {
          uid: auth.currentUser.uid,
          ...data,
          expiryDate: ex_date,
          uploadOn: cu_date,
        }
      );

      dispatch({
        type: "open popup",
        playload: {
          msg: res.data.msg,
          type: "success",
        },
      });

      router.replace("/user/purchase");
    } catch (err) {
      dispatch({
        type: "open popup",
        playload: {
          msg: err.message || "Something went wrong",
          type: "error",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const closeAlert = () => {
    dispatch({ type: "close alert" });
    router.replace("/user/items");
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
      <div className={classes.main_container}>
        <Navbar title="Purchase Medicine" />
        <NavigationBar />
        <div className={classes.add_container}>
          <form className={classes.container} onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  className={classes.input}
                  label="Item Name"
                  variant="outlined"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <div className={classes.vendorFieldContainer}>
              {!customVendor ? (
                <FormControl sx={{ flex: "0 0 65%" }}>
                  <InputLabel id="vendor-label">Vendor Name</InputLabel>
                  <Controller
                    name="vendorName"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        labelId="vendor-label"
                        label="Vendor Name"
                        error={!!errors.vendorName}
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
                    )}
                  />
                  {errors.vendorName && (
                    <p className={classes.errorText}>
                      {errors.vendorName.message}
                    </p>
                  )}
                </FormControl>
              ) : (
                <Controller
                  name="vendorName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New Vendor Name"
                      variant="outlined"
                      sx={{ flex: "0 0 65%" }}
                      error={!!errors.vendorName}
                      helperText={errors.vendorName?.message}
                    />
                  )}
                />
              )}

              <Button
                onClick={() => setCustomVendor((prev) => !prev)}
                variant="outlined"
                color="primary"
                sx={{ flex: "0 0 130px", whiteSpace: "nowrap" }}
              >
                {customVendor ? "Existing" : "Add Vendor"}
              </Button>
            </div>

            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  className={classes.input}
                  label="Quantity"
                  type="number"
                  inputProps={{ min: 1 }}
                  onKeyDown={(e) =>
                    ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                  }
                  variant="outlined"
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                />
              )}
            />

            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  className={classes.input}
                  label="Price (per/piece)"
                  type="number"
                  inputProps={{ min: 1 }}
                  onKeyDown={(e) =>
                    ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                  }
                  variant="outlined"
                  error={!!errors.price}
                  helperText={errors.price?.message}
                />
              )}
            />

            <div className={classes.cal}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Controller
                  name="expiryDate"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      label="Expiry Date"
                      inputFormat="MM/DD/YYYY"
                      value={field.value}
                      disablePast
                      onChange={(date) => field.onChange(date)}
                      renderInput={(params) => (
                        <TextField
                          className={classes.input}
                          required
                          {...params}
                          error={!!errors.expiryDate}
                          helperText={errors.expiryDate?.message}
                        />
                      )}
                    />
                  )}
                />
              </LocalizationProvider>
            </div>

            <div className={classes.btn}>
              <Button variant="contained" type="submit" disabled={loading}>
                {loading ? "Processing..." : "PURCHASE"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddItem;
