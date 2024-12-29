function isValidName(name, res) {
  const nameRegex = /^[A-Za-z]+$/;

  if (nameRegex.test(name)) {
    return false;
  } else {
    res.status(400).json({
      mssg: "❌ The name is invalid. It should only contain letters, no symbol or letters are allowed.",
    });
    return true;
  }
}

export default isValidName;
