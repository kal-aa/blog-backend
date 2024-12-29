function isValidEmailSyntax(email, res) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailRegex.test(email)) {
    return false;
  } else {
    res.status(400).json({ mssg: "❌ The email syntax is invalid." });
    return true;
  }
}

export default isValidEmailSyntax