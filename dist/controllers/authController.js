import constErr from "../reUses/constErr.js";
export const signupHandler = async (req, res, next) => {
    const { uid, email } = req.user;
    const optName = req.user.name || email?.split("@")[0];
    const name = req.body.name;
    let imageBuffer = null;
    let imageMimetype = null;
    if (req.file) {
        imageBuffer = req.file?.buffer ?? null;
        imageMimetype = req.file?.mimetype ?? null;
    }
    if (!email)
        return constErr(400, "Email missing from token", next);
    try {
        const db = req.db;
        const emailLower = email.toLowerCase();
        let user = await db.collection("users").findOne({ email: emailLower });
        if (!user) {
            const newUser = {
                uid,
                email: emailLower,
                name: name || optName,
                createdAt: new Date(),
                ...(imageBuffer && imageMimetype
                    ? { buffer: imageBuffer, mimetype: imageMimetype }
                    : {}),
            };
            const result = await db.collection("users").insertOne(newUser);
            user = { _id: result.insertedId, ...newUser };
        }
        res.json({
            id: user._id,
            name: user.name || email.split("@")[0],
        });
    }
    catch (err) {
        console.error("Sign-up DB error:", err.message);
        constErr(500, "Internal server error", next);
    }
};
export const loginHandler = async (req, res, next) => {
    const { uid, email } = req.user;
    const name = req.user.name || email?.split("@")[0];
    if (!email)
        return constErr(400, "Email missing from token", next);
    try {
        const db = req.db;
        const emailLower = email.toLowerCase();
        let user = await db.collection("users").findOne({ email: emailLower });
        if (!user) {
            const newUser = {
                uid,
                email: emailLower,
                name,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const result = await db.collection("users").insertOne(newUser);
            user = { _id: result.insertedId, ...newUser };
        }
        res.json({
            id: user._id,
            name: user.name || email.split("@")[0],
        });
    }
    catch (err) {
        console.error("Login DB error:", err.message);
        constErr(500, "Internal server error", next);
    }
};
//# sourceMappingURL=authController.js.map