import bcrypt from "bcrypt";

async function comparePassword(inputPassword, sqlPassword) {
  try {
    const result = await bcrypt.compare(inputPassword, sqlPassword);
    if (!result) {
      console.error("Password Doesn't match");
      throw new Error("Incorrect password");
    }
    console.log("Authenticated!");
    return true;
  } catch (error) {
    throw error;
  }
}

export default comparePassword;
