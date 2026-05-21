import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const leaveAttachmentDir = path.resolve(__dirname, "..", "uploads", "leave-attachments");
export const eventEvidenceDir = path.resolve(__dirname, "..", "uploads", "event-evidence");

fs.mkdirSync(leaveAttachmentDir, { recursive: true });
fs.mkdirSync(eventEvidenceDir, { recursive: true });

export function normalizeOriginalName(originalName) {
  try {
    const decoded = Buffer.from(originalName, "latin1").toString("utf8");
    return decoded.includes("\uFFFD") ? originalName : decoded;
  } catch {
    return originalName;
  }
}

const allowedMimeTypes = new Set(["application/pdf"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, leaveAttachmentDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(normalizeOriginalName(file.originalname)).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  if (file.mimetype.startsWith("image/") || allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error("แนบได้เฉพาะไฟล์รูปภาพหรือ PDF"));
}

export const uploadLeaveAttachments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

const eventEvidenceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, eventEvidenceDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(normalizeOriginalName(file.originalname)).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

export const uploadEventEvidence = multer({
  storage: eventEvidenceStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});
