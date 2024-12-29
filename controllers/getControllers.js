import db from "../index.js";

export const welcomeRoute = (req, res) => {
  res.send("This is Kalab: \nWelcome to my blog-backend");
};
