import JSZip from "jszip";
import {
  decodeTextAuto,
  triggerDownload,
} from "@/domain/encoding.ts";
import { listAllFiles, putFiles, normalizePath } from "@/storage/workspaceDb.ts";
import { REQUIRED_FOLDERS } from "@/domain/types.ts";

export async function exportWorkspaceZip(fileName = "tmd-workspace.zip"): Promise<void> {
  const files = await listAllFiles();
  const zip = new JSZip();
  for (const folder of REQUIRED_FOLDERS) {
    zip.folder(folder);
  }
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, fileName);
}

export async function importWorkspaceZip(file: File): Promise<number> {
  const zip = await JSZip.loadAsync(file);
  const loaded: { path: string; content: string }[] = [];

  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  for (const entry of entries) {
    const bytes = await entry.async("uint8array");
    const path = normalizePath(entry.name);
    if (!path || path.endsWith("/")) {
      continue;
    }
    loaded.push({
      path,
      content: decodeTextAuto(bytes),
    });
  }

  await putFiles(loaded);
  return loaded.length;
}
