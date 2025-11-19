import User from "../models/User.js";
import { deleteFromCloudinary, extractPublicId } from "../config/cloudinary.js";

// ============================
// ✅ Get all users (Admin only)
// ============================
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

// ============================
// ✅ Get single user by ID
// ============================
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ message: "Server error fetching user" });
  }
};

// ============================
// ✅ NEW: Update current user's profile
// ============================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, address } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (name) user.name = name.trim();
    if (address !== undefined) user.address = address.trim();

    // Handle avatar upload
    if (req.file) {
      // Delete old avatar from Cloudinary if exists
      if (user.avatar) {
        const publicId = extractPublicId(user.avatar);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (error) {
            console.error("Error deleting old avatar:", error);
          }
        }
      }
      
      // Set new avatar
      user.avatar = req.file.path; // Cloudinary URL
    }

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(userId).select("-password");

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

// ============================
// ✅ Update user details (Admin only)
// ============================
export const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) {
      const normalizedRole = role.toLowerCase();
      user.role = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
    }

    await user.save();
    res.json({ message: "✅ User updated successfully", user });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ message: "Server error updating user" });
  }
};

// ============================
// ✅ Delete user (Admin only)
// ============================
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.deleteOne({ _id: req.params.id });
    res.json({ message: "🗑️ User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ message: "Server error deleting user" });
  }
};

// ============================
// ✅ Toggle Active/Inactive User
// ============================
export const toggleUserActive = async (req, res) => {
  try {
    const { active } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.active = active;
    await user.save();

    res.json({
      message: `✅ User is now ${user.active ? "active" : "inactive"}`,
      user: await User.findById(req.params.id).select("-password")
    });
  } catch (err) {
    console.error("❌ Error toggling user status:", err);
    res.status(500).json({ message: "Server error toggling user status" });
  }
};

// ============================
// ✅ Change user role (Admin only)
// ============================
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: "Role is required" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const normalizedRole = role.toLowerCase();
    user.role = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
    await user.save();

    res.json({ message: `✅ User role updated to ${user.role}`, user });
  } catch (err) {
    console.error("❌ Error updating user role:", err);
    res.status(500).json({ message: "Server error updating user role" });
  }
};