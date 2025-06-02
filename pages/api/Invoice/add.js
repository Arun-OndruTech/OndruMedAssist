import connectMongo from "../../../utils/connectMongo";
import User from "../../../Models/user";

export default async function handler(req, res) {
  try {
    await connectMongo();
    const { uid, invoice } = req.body;

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Generate unique invoice number (INV-YYYYMMDD-XXXX)
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    invoice.invoiceNumber = `INV-${datePart}-${randomPart}`;

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
