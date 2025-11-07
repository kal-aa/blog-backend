const error = (err, req, res, next) => {
    console.error(err.stack);
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ mssg: "File size should be bellow 5MB" });
    }
    res
        .status(err.status || 500)
        .json({ mssg: err.message || "Server processing error" });
};
export default error;
//# sourceMappingURL=error.js.map