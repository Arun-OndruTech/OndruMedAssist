import connectMongo from "../../../utils/connectMongo";
import User from "../../../Models/user";

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  try {
    await connectMongo();

    const { uid, sales } = req.body;

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ msg: "User not found" });

    let totalAmount = 0;

    for (const sale of sales) {
      const { _id, name, quantity, price, type, uploadOn, date } = sale;

      const stockItem = user.stock.find((item) => item._id.toString() === _id);

      if (!stockItem) {
        return res.status(404).json({ msg: `Medicine ${name} not found` });
      }

      if (stockItem.quantity < quantity) {
        return res.status(400).json({ msg: `Not enough stock for ${name}` });
      }

      stockItem.quantity -= quantity;

      const saleEntry = {
        name,
        quantity,
        price,
        type,
        uploadOn,
        amount: quantity * price,
        updateon: uploadOn,
      };

      user.history.unshift(saleEntry);
      totalAmount += quantity * price;
    }

    user.totalSale = (user.totalSale || 0) + totalAmount;

    await user.save();

    res.status(200).json({ msg: "All sales recorded successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
}
