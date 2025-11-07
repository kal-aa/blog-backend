function constErr(status, message, next) {
    const err = new Error(message);
    err.status = status;
    next(err);
}
export default constErr;
//# sourceMappingURL=constErr.js.map