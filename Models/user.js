import { Schema, model, models } from "mongoose";
import historySchema from "./history";
import medicineSchema from "./medicine";
import salesSchema from "./sales";
import invoiceSchema from "./invoice";

const userSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    totalPurchase: {
      type: Number,
      default: 0,
    },
    totalSale: {
      type: Number,
      default: 0,
    },
    stock: [medicineSchema],
    history: [historySchema],
    sales: [salesSchema],
    invoices: [invoiceSchema],
  },
  { timestamps: true }
);

const User = models.user || model("user", userSchema);

export default User;

// import { Schema, model, models } from "mongoose";
// import historySchema from "./history";
// import medicineSchema from "./medicine";
// import salesSchema from "./sales";
// import invoiceSchema from "./invoiceSchema";

// const userSchema = new Schema({
//   _id: {
//     type: String,
//     required: true,
//   },
//   userName: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//   },
//   totalPurchase: {
//     type: Number,
//     default: 0,
//   },
//   totalSale: {
//     type: Number,
//     default: 0,
//   },
//   stock: [medicineSchema],
//   history: [historySchema],
//   sales: [salesSchema],
//   invoices: [invoiceSchema],
// });

// const User = models.user || model("user", userSchema);

// export default User;
