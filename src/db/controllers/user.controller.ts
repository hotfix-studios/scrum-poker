import { User } from "../models/index.js";

/**
 * This will be the Repository for User Model (CRUD)
 */

// TODO: Abstract this into an interface or base class... (modular for all models)
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);

  } catch (error) {
    console.error('Internal server error when getting user:', error);
    res.sendStatus(500).json({ message: "Internal Server Error Get" });
  }
};