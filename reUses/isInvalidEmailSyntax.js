import constErr from "./constErr.js";

function isInvalidEmailSyntax(email, next) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailRegex.test(email)) {
    return false;
  } else {
    constErr(
      400,
      "This email syntax is invalid, try something like: sadkalshayee@gmail.com",
      next
    );
    return true;
  }
}

export default isInvalidEmailSyntax;
