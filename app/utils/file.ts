import type { ApiFile, FileType } from "~/types/file";
import mime from "mime-types";
export const determineFileType = (file: ApiFile | File): FileType => {
  const type = "contentType" in file ? file.contentType : file.type;
  const name = ("filename" in file ? file.filename : file.name).toLowerCase();

  if (type.startsWith("directory")) return "folder";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf") return "pdf";

  // Document formats
  if (
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".txt") ||
    name.endsWith(".rtf") ||
    name.endsWith(".odt")
  )
    return "doc";

  // Spreadsheet formats
  if (
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv") ||
    name.endsWith(".ods")
  )
    return "sheet";

  // Presentation formats
  if (name.endsWith(".ppt") || name.endsWith(".pptx") || name.endsWith(".odp"))
    return "slide";

  // Archive formats
  if (
    name.endsWith(".zip") ||
    name.endsWith(".rar") ||
    name.endsWith(".7z") ||
    name.endsWith(".tar") ||
    name.endsWith(".gz") ||
    name.endsWith(".bz2")
  )
    return "archive";

  // Code formats
  if (
    name.endsWith(".js") ||
    name.endsWith(".ts") ||
    name.endsWith(".vue") ||
    name.endsWith(".html") ||
    name.endsWith(".css") ||
    name.endsWith(".json") ||
    name.endsWith(".py") ||
    name.endsWith(".java") ||
    name.endsWith(".c") ||
    name.endsWith(".cpp") ||
    name.endsWith(".php") ||
    name.endsWith(".rb") ||
    name.endsWith(".go") ||
    name.endsWith(".rs") ||
    name.endsWith(".swift") ||
    name.endsWith(".sql") ||
    name.endsWith(".md")
  )
    return "code";
  return "file";
};

export const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  // 1 PB = 1024 * 1024 * 1024 * 1024 * 1024 = 1125899906842624
  if (bytes >= 1125899906842624) return "Unlimited";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
