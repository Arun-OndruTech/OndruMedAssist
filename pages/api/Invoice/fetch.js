import connectMongo from "../../../utils/connectMongo";
import User from "../../../Models/user";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      await connectMongo();
      const { uid } = req.body;
      const user = await User.findById(uid);

      if (!user) return res.status(404).json({ msg: "User not found" });

      // Convert date strings to Date objects
      const invoices = user.invoices.map((inv) => ({
        ...inv.toObject(),
        date: new Date(inv.date),
      }));

      res.status(200).json(invoices);
    } catch (error) {
      console.error("Invoice fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
