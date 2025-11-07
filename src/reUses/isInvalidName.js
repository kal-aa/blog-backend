import constErr from "./constErr.js";

function isInvalidName(name, next) {
  const nameRegex = /^[A-Za-z]+$/;

  if (nameRegex.test(name.replace(/\s+/g, ""))) {
    return false;
  } else {
    constErr(
      400,
      "Name can only contain letters, no symbols or charaters are allowed.",
      next
    );
    return true;
  }
}

export default isInvalidName;
