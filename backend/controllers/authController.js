import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// Register
export const registerUser = async (req, res) => {
  let { name, email, password, role } = req.body;

  console.log("🧩 Registration request:", { name, email, role });

  if (role) {
    let normalizedRole = role.toLowerCase();
    role = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
  }
  
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("⚠️ User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user._id, user.role);

    console.log("✅ User registered:", email);

    res.status(201).json({
      message: "✅ User registered successfully",
      token,
      user: {
        _id: user._id,
        id: user._id, 
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: messages,
      });
    }
    
    res.status(500).json({
      message: "Server error during registration",
      error: error.message, 
    });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("🔐 Login attempt:", email);

    if (!email || !password) {
      console.log("⚠️ Missing credentials");
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("⚠️ User not found:", email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password); 
    
    if (!isMatch) {
      console.log("⚠️ Invalid password for:", email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

   
    const token = generateToken(user._id, user.role);
    
    console.log("✅ Login successful:", email);
    console.log("  User ID:", user._id);
    console.log("  Role:", user.role);
    console.log("  Token generated:", token.substring(0, 20) + "...");

    
    res.json({
      message: 'Login successful',
      token, // ✅ Must return token
      user: { 
        _id: user._id,
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        address: user.address || "",
        active: user.active !== false,
      },
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message 
    });
  }
};