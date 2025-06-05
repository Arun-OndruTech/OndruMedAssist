import connectMongo from "../../../utils/connectMongo";
import User from "../../../Models/user";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  try {
    await connectMongo();
    const { uid, invoice } = req.body;

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const uniquePart = randomUUID().split("-")[0];
    invoice.invoiceNumber = `INV-${uniquePart}-${datePart}`;

    invoice.uid = uid;
    invoice.date = invoice.date ? new Date(invoice.date) : new Date();

    // Calculate totalAmount if missing
    if (!invoice.totalAmount) {
      invoice.totalAmount =
        invoice.items?.reduce(
          (acc, item) => acc + (item.totalAmount || item.total || 0),
          0
        ) || 0;
    }

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
