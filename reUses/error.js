const error = (err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ mssg: err.message || "Server processing error" });
};
export default error;
