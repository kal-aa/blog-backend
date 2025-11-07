import bcrypt from "bcrypt";

async function hashPassword(password, saltRounds = 10) {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error("Error comparing password:", error);
    throw new Error("Password hashing failed");
  }
}

export default hashPassword;
