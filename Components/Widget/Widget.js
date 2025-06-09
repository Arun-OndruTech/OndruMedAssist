// components/Widget.js

import classes from "./widget.module.css";
import { useRouter } from "next/router";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SellIcon from "@mui/icons-material/Sell";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

export default function Widget({ type, amount }) {
  const router = useRouter();

  let data;

  switch (type) {
    case "purchase":
      data = {
        title: "Total Purchase",
        icon: (
          <ShoppingCartIcon
            className={classes.icon}
            style={{
              color: "goldenrod",
              backgroundColor: "rgba(218,165,32,0.2)",
            }}
          />
        ),
        link: "Purchase Detail",
        dest: "purchase",
        pin: (
          <FiberManualRecordIcon
            className={classes.icon2}
            style={{
              color: "rgba(0, 0, 0, 0.3)",
              backgroundColor: "rgb(216, 216, 216)",
              boxShadow:
                "rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset",
            }}
          />
        ),
      };
      break;
    case "sales":
      data = {
        title: "Total Sales",
        icon: (
          <SellIcon
            className={classes.icon}
            style={{
              color: "green",
              backgroundColor: "rgba(0,128,0,0.2)",
            }}
          />
        ),
        link: "Sales Detail",
        dest: "orders",
        pin: (
          <FiberManualRecordIcon
            className={classes.icon2}
            style={{
              color: "rgba(0, 0, 0, 0.3)",
              backgroundColor: "rgb(216, 216, 216)",
              boxShadow:
                "rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset",
            }}
          />
        ),
      };
      break;
    case "balance":
      data = {
        title: "Today's Sales",
        dest: "orders",
        icon: (
          <AccountBalanceWalletIcon
            className={classes.icon}
            style={{
              color: "purple",
              backgroundColor: "rgba(128,0,128,0.2)",
            }}
          />
        ),
        link: "Sales Detail",
        pin: (
          <FiberManualRecordIcon
            className={classes.icon2}
            style={{
              color: "rgba(0, 0, 0, 0.1)",
              backgroundColor: "rgb(216, 216, 216)",
              boxShadow:
                "rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset",
            }}
          />
        ),
      };
      break;
    default:
      break;
  }

  return (
    <div className={classes.widget}>
      <div className={classes.left}>
        <span className={classes.title}>{data?.title}</span>
        <span className={classes.counter}>₹ {amount || 0}</span>
        {data?.link && (
          <span
            className={classes.link}
            onClick={() => router.replace("/user/" + data.dest)}
          >
            {data.link}
          </span>
        )}
      </div>
      <div className={classes.right}>
        {data?.pin}
        {data?.icon}
      </div>
    </div>
  );
}
