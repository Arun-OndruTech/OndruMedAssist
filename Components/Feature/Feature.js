import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase/firebase";
import classes from "./feature.module.css";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function Feature() {
  const [totalSales, setTotalSales] = useState(0);
  const [totalPurchase, setTotalPurchase] = useState(0);

  const percentage = totalPurchase
    ? Math.min(Math.round((totalSales / totalPurchase) * 100), 100)
    : 0;

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const fetchAllData = async () => {
      try {
        const [salesRes, purchaseRes] = await Promise.all([
          axios.get(`/api/User/today?uid=${uid}`),
          axios.post("/api/Medicine/fetch", { uid }),
        ]);
        setTotalSales(salesRes.data.totalSalesToday || 0);
        setTotalPurchase(purchaseRes.data.totalPurchase || 0);
      } catch (err) {
        console.error("❌ Failed to fetch data", err);
        setTotalSales(0);
        setTotalPurchase(0);
      }
    };

    fetchAllData();
  }, []);

  return (
    <div className={classes.feature}>
      <div className={classes.top}>
        <h1 className={classes.title}>Total Revenue</h1>
        <MoreVertIcon fontSize="small" />
      </div>
      <div className={classes.bottom}>
        <div className={classes.featureChart}>
          <CircularProgressbar
            value={percentage}
            text={`${percentage}%`}
            strokeWidth={7}
          />
        </div>
        <p className={classes.titleb}>Total sales made today</p>
        <p className={classes.amount}>₹ {totalSales}</p>
        <p className={classes.desc}>
          Based on total purchases: ₹{totalPurchase}
        </p>
      </div>
    </div>
  );
}
