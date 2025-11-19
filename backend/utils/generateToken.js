// utils/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is not defined in environment variables!");
    throw new Error("JWT_SECRET is not configured");
  }

  const payload = {
    id: id,
    role: role || "User",
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: "30d" } // Token valid for 30 days
  );

  console.log("🔑 Token generated for:", id, "Role:", role);
  
  return token;
};

export default generateToken;