import connectMongo from "../../../utils/connectMongo";
import User from "../../../Models/user";

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  try {
    await connectMongo();

    const { uid, _id, name, quantity, price, type, uploadOn, date } = req.body;

    // 1. Find the user
    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 2. Update inventory (reduce quantity)
    const stockItem = user.stock.find((item) => item._id.toString() === _id);

    if (!stockItem)
      return res.status(404).json({ msg: "Medicine not found in stock" });

    if (stockItem.quantity < quantity) {
      return res.status(400).json({ msg: "Not enough quantity in stock" });
    }

    stockItem.quantity -= quantity;

    // 3. Add to history
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

    // 4. Increase totalSale
    user.totalSale = (user.totalSale || 0) + quantity * price;

    // 5. Save changes
    await user.save();

    res.status(200).json({ msg: "Sale recorded and stock updated" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
}
