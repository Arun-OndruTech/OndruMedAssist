import { Schema } from "mongoose";

const invoiceSchema = new Schema({
  invoiceNumber: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
      total: Number,
    },
  ],
  paymentMethod: String,
  totalAmount: Number,
  customerName: String,
  customerPhone: String,
  uid: { type: String, required: true },
});

export default invoiceSchema;
