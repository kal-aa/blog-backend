import { ObjectId } from "mongodb";
import constErr from "../reUses/constErr.js";
// DELETE delete-comment/:id
export const deleteComment = async (req, res, next) => {
    const { id } = req.params;
    if (!id || !ObjectId.isValid(id)) {
        console.error("Invalid id");
        return constErr(400, "Invalid or malformed comment ID", next);
    }
    const commentId = new ObjectId(id);
    const db = req.db;
    try {
        // Delete replies first
        await db.collection("replies").deleteMany({ commentId });
        // Delete the comment
        await db.collection("comments").deleteOne({ _id: commentId });
        res
            .status(200)
            .json({ message: "Comment and related replies deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting comment", error);
        return constErr(500, "Internal server error", next);
    }
};
// DELETE delete-reply/:id
export const deleteReply = async (req, res, next) => {
    const { id } = req.params;
    if (!id || !ObjectId.isValid(id)) {
        console.error("Invalid id");
        return constErr(400, "Invalid or malformed reply ID", next);
    }
    try {
        await req.db.collection("replies").deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({ message: "Reply deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting comment");
        return constErr(500, "Internal server error", next);
    }
};
// DELETE /delete-blog/:id
export const deleteBlog = async (req, res, next) => {
    const id = req.params.id; // author ID
    const { blogId } = req.query;
    const db = req.db;
    if (!id ||
        !blogId ||
        !ObjectId.isValid(id) ||
        !ObjectId.isValid(blogId.toString())) {
        console.error("invalid id");
        return constErr(400, "Invalid or malformed user or blog ID", next);
    }
    try {
        const blogObjectId = new ObjectId(blogId.toString());
        const userObjectId = new ObjectId(id);
        // Check if the user exists
        const user = await db.collection("users").findOne({ _id: userObjectId });
        if (!user)
            return constErr(404, "User not found", next);
        // Check if the user actually owns this blog
        const blog = await db
            .collection("blogs")
            .findOne({ _id: blogObjectId, authorId: userObjectId });
        if (!blog)
            return constErr(403, "Unauthorized: You cannot delete this blog", next);
        // Delete the replies associated with the blog
        await db.collection("replies").deleteMany({ blogId: blogObjectId });
        // Delete the comments associated with the blog
        await db.collection("comments").deleteMany({ blogId: blogObjectId });
        // Delete the blog
        const result = await db
            .collection("blogs")
            .deleteOne({ _id: blogObjectId });
        if (result.deletedCount === 0) {
            return constErr(404, "Blog not found", next);
        }
        res.status(200).json({ message: "Blog deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting blog");
        return constErr(500, "Internal server error", next);
    }
};
// DELETE /account/delete/:id
export const accountDelete = async (req, res, next) => {
    const id = req.params.id;
    if (!id || !ObjectId.isValid(id)) {
        console.error("Invalid id");
        return constErr(400, "Invalid or malformed ID", next);
    }
    try {
        const db = req.db;
        const userObjectId = new ObjectId(id);
        // Delete all replies made by the user
        await db.collection("replies").deleteMany({ replierId: userObjectId });
        // Delete all comments made by the user
        await db.collection("comments").deleteMany({ commenterId: userObjectId });
        // Delete all blogs made by the user
        await db.collection("blogs").deleteMany({ authorId: userObjectId });
        // Delete the user
        const result = await db
            .collection("users")
            .deleteOne({ _id: userObjectId });
        if (result.deletedCount === 0)
            return constErr(404, "User not found", next);
        res
            .status(200)
            .json({ message: "Account and related data deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting account:", error);
        return constErr(500, "Internal server error", next);
    }
};
//# sourceMappingURL=deleteController.js.map