import classes from "./vnavbar.module.css";
import {
  FaBell,
  FaShapes,
  FaCartPlus,
  FaFileInvoice,
  FaBars,
} from "react-icons/fa";
import { MdDashboardCustomize } from "react-icons/md";
import $ from "jquery";
import logo from "../../../Images/MedAssist.png";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { StateContext } from "../../../Context/StateContext";
import { useContext, useState, useEffect } from "react";

export default function Navbar() {
  const router = useRouter();
  const { state } = useContext(StateContext);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    $(
      `[page*=${
        !router.pathname.split("/")[2] ? "home" : router.pathname.split("/")[2]
      }]`
    )
      .addClass(`${classes.active}`)
      .siblings()
      .removeClass(`${classes.active}`);
  }, [router.pathname]);

  return (
    <main className={classes.main}>
      <nav
        className={`${classes.sidebar} ${collapsed ? classes.collapsed : ""}`}
      >
        <div className={classes.top}>
          <div className={classes.text}>
            <Image
              src={logo}
              alt="logo"
              width={collapsed ? 40 : 100}
              className={classes.logo}
              priority="performance"
            />
          </div>
          <button
            className={classes.toggleBtn}
            onClick={() => setCollapsed(!collapsed)}
          >
            <FaBars />
          </button>
        </div>
        <ul>
          <li page="home">
            <Link href="/user">
              <MdDashboardCustomize />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>
          <li page="items">
            <Link href="/user/items">
              <FaShapes />
              {!collapsed && <span>Items</span>}
            </Link>
          </li>
          <li page="purchase">
            <Link href="/user/purchase">
              <FaCartPlus />
              {!collapsed && <span>Purchase</span>}
            </Link>
          </li>
          <li page="sale">
            <Link href="/user/sale">
              <FaFileInvoice />
              {!collapsed && <span>Sale</span>}
            </Link>
          </li>
          <li className={classes.noti} page="notification">
            <Link href="/user/notification">
              <FaBell />
              {!collapsed && <span>Notification</span>}
            </Link>
            {state.number_of_notifications !== 0 && (
              <span className={classes.count}>
                {state.number_of_notifications >= 10
                  ? "9+"
                  : state.number_of_notifications}
              </span>
            )}
          </li>
        </ul>
      </nav>
    </main>
  );
}
