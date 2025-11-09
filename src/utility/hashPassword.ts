import bcrypt from "bcrypt";

async function hashPassword(password: string, saltRounds = 10) {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Password hashing failed");
  }
}

export default hashPassword;
