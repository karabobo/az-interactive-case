import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { getData as getPdfWorkerData } from "pdf-parse/worker";
import { getDb } from "@/lib/server/db";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".docx", ".pdf"]);

export function caseUploadDirectory() {
  return join(process.env.CASE_DATA_DIR ?? join(process.cwd(), "data"), "uploads");
}

function extensionOf(fileName: string) {
  return extname(fileName).toLowerCase();
}

function normalizedName(name: string) {
  return name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || "case-file";
}

async function extractPdfText(bytes: Buffer) {
  // Next.js 会把默认相对 worker 路径改写到服务端 chunk，造成 PDF.js 找不到 worker。
  // 使用库自带的 data URL worker，避免依赖运行时的磁盘路径。
  PDFParse.setWorker(getPdfWorkerData());
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(bytes: Buffer) {
  const result = await mammoth.extractRawText({ buffer: bytes });
  return result.value.trim();
}

export async function storeAndParseCaseFile(userId: string, file: File) {
  const extension = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) throw new Error("仅支持 .docx 或 PDF 格式的病例文档");
  if (file.size === 0) throw new Error("上传文件为空");
  if (file.size > MAX_FILE_SIZE) throw new Error("文件不能超过 20 MB");

  const bytes = Buffer.from(await file.arrayBuffer());
  const rawText = extension === ".pdf" ? await extractPdfText(bytes) : await extractDocxText(bytes);
  if (!rawText) {
    throw new Error(extension === ".pdf"
      ? "该 PDF 未识别到可提取文本；扫描件 PDF 暂不支持，请上传可检索 PDF 或 .docx"
      : "该 Word 文档未识别到可提取文本");
  }

  const id = crypto.randomUUID();
  const storedName = `${id}${extension}`;
  const userDirectory = join(caseUploadDirectory(), userId);
  await mkdir(userDirectory, { recursive: true });
  await writeFile(join(userDirectory, storedName), bytes, { mode: 0o600 });

  const now = new Date().toISOString();
  const mimeType = extension === ".pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  getDb().prepare("INSERT INTO case_files (id, owner_id, original_name, stored_name, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, userId, normalizedName(file.name), storedName, mimeType, bytes.length, now);

  return {
    id,
    fileName: normalizedName(file.name),
    mimeType,
    size: bytes.length,
    uploadedAt: now,
    rawText,
    parseStatus: "parsed" as const,
    parseError: null,
  };
}
