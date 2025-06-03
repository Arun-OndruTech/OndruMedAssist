import connectMongo from "../../../utils/connectMongo";
import User from "../../../Models/user";
import { v4 as uuidv4 } from "uuid";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  try {
    await connectMongo();
    const { uid, invoice } = req.body;

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Generate unique invoice number (INV-YYYYMMDD-XXXX)
    // const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    // const randomPart = Math.floor(1000 + Math.random() * 9000);
    // invoice.invoiceNumber = `INV-${randomUUID()}`;
    // Generate invoice number like INV-20250603-83c9fbc9
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const uniquePart = randomUUID().split("-")[0]; // short, readable
    invoice.invoiceNumber = `INV-${uniquePart}-${datePart}`;

    // Ensure required fields are set
    invoice.uid = uid;
    if (!invoice.date) invoice.date = new Date();

    user.invoices.unshift(invoice);
    await user.save();

    res.status(200).json({ msg: "Invoice saved successfully", invoice });
  } catch (error) {
    console.error("Invoice save error:", error);
    res
      .status(500)
      .json({ msg: "Invoice creation failed", error: error.message });
  }
}
