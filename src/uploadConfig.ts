import multer, { StorageEngine } from "multer";

const storage: StorageEngine = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
