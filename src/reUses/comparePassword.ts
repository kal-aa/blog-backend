import bcrypt from "bcrypt";

async function comparePassword(
  inputPassword: string,
  sqlPassword: string
): Promise<boolean> {
  const match = await bcrypt.compare(inputPassword, sqlPassword);
  if (!match) throw new Error("Incorrect password, please try again");
  return true;
}

export default comparePassword;
