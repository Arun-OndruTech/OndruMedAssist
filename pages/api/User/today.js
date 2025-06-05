import connectMongo from "../../../utils/connectMongo";
import User from "../../../Models/user";

export default async function handler(req, res) {
  try {
    await connectMongo();

    const { uid } = req.query;
    if (!uid) return res.status(400).json({ msg: "UID is required" });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const now = new Date();

    const startOfDay = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0
    );

    const endOfDay = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    );

    // Force UTC interpretation
    const startUTC = new Date(startOfDay.toISOString());
    const endUTC = new Date(endOfDay.toISOString());

    console.log("🕒 Start UTC:", startUTC);
    console.log("🕒 End UTC:", endUTC);

    let totalSales = 0;

    user.invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.date);
      console.log("🧾 Invoice date:", invoiceDate);

      if (invoiceDate >= startUTC && invoiceDate <= endUTC) {
        totalSales += invoice.totalAmount || 0;
      }
    });

    console.log("💰 Total sales today:", totalSales);

    return res.status(200).json({ totalSalesToday: totalSales });
  } catch (error) {
    console.error("❌ Error in sales/today API:", error);
    return res
      .status(500)
      .json({ msg: "Internal error", error: error.message });
  }
}
