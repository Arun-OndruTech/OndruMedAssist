// Existing imports
import { v4 as uuidv4 } from "uuid";
import User from "../../../Models/user";

// ...existing imports...
import connectMongo from "../../../utils/connectMongo"; // Make sure you have this import

export default async function handler(req, res) {
  try {
    await connectMongo();
    const { uid, sales } = req.body;
    const user = await User.findById(uid);

    if (!user) return res.status(404).json({ msg: "User not found" });

    let totalAmount = 0;
    let items = [];
    let salesToPush = [];

    // Process each sale item
    for (const sale of sales) {
      const { _id, name, quantity, price } = sale;
      const stockItem = user.stock.find((item) => item._id.toString() === _id);

      if (!stockItem) {
        return res.status(404).json({ msg: `Medicine ${name} not found` });
      }
      if (stockItem.quantity < quantity) {
        return res.status(400).json({ msg: `Not enough stock for ${name}` });
      }

      stockItem.quantity -= quantity;
      totalAmount += quantity * price;

      // Add to invoice items
      items.push({
        name,
        quantity,
        unitPrice: price,
        totalPrice: quantity * price,
      });

      // --- Add to sales array ---
      salesToPush.push({
        name,
        quantity,
        price,
        date: new Date(), // <-- Make sure date is set!
        type: "sale",
        medicineId: _id,
      });
    }

    const invoiceNumber = `INV-${Date.now()}-${uuidv4().slice(0, 4)}`;
    // Generate invoice
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const invoice = {
      invoiceNumber,
      orderId: `ORD-${Date.now()}`,
      orderDate: new Date(),
      orderStatus: "Completed",
      orderType: "Retail",
      items,
      charges: [
        { description: "Service Charge", amount: 50 },
        { description: "GST", amount: subtotal * 0.05 },
      ],
      subtotal,
      totalAmount: subtotal + 50 + subtotal * 0.05,
    };

    // Update user with invoice and sales data
    user.invoices.unshift(invoice);
    user.markModified("invoices");
    user.totalSale = (user.totalSale || 0) + invoice.totalAmount;

    // --- Push sales to user.sales array ---
    user.sales = [...salesToPush, ...user.sales];
    user.markModified("sales");

    await user.save();

    res.status(200).json({
      msg: "Sales recorded successfully",
      invoiceNumber,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
}
