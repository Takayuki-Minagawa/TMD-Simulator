import { openDB } from "idb";
import { REQUIRED_FOLDERS, type WorkspaceFile } from "@/domain/types.ts";
import {
  createEmptyModel,
  serializeModelDat,
  serializeWaveCsv,
} from "@/domain/format.ts";
import { makeSineWave } from "@/domain/sineWave.ts";

const DB_NAME = "tmd-simulator-workspace";
const DB_VERSION = 1;
const STORE = "files";

type WorkspaceDB = {
  [STORE]: {
    key: string;
    value: WorkspaceFile;
  };
};

const dbPromise = openDB<WorkspaceDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: "path" });
    }
  },
});

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function fileNameFromPath(path: string): string {
  const normalized = normalizePath(path);
  const chunks = normalized.split("/");
  return chunks[chunks.length - 1] ?? normalized;
}

export function folderFromPath(path: string): string {
  const normalized = normalizePath(path);
  const chunks = normalized.split("/");
  chunks.pop();
  return chunks.join("/");
}

export async function listAllFiles(): Promise<WorkspaceFile[]> {
  const db = await dbPromise;
  const files = await db.getAll(STORE);
  return files.sort((lhs, rhs) => lhs.path.localeCompare(rhs.path));
}

export async function listFiles(folderPrefix: string): Promise<WorkspaceFile[]> {
  const normalizedPrefix = normalizePath(folderPrefix);
  const files = await listAllFiles();
  return files.filter((file) => folderFromPath(file.path) === normalizedPrefix);
}

export async function getFile(path: string): Promise<WorkspaceFile | undefined> {
  const db = await dbPromise;
  return db.get(STORE, normalizePath(path));
}

export async function putFile(path: string, content: string): Promise<void> {
  const db = await dbPromise;
  await db.put(STORE, {
    path: normalizePath(path),
    content,
    updatedAt: Date.now(),
  });
}

export async function putFiles(files: { path: string; content: string }[]): Promise<void> {
  if (files.length === 0) {
    return;
  }
  const db = await dbPromise;
  const tx = db.transaction(STORE, "readwrite");
  for (const file of files) {
    await tx.store.put({
      path: normalizePath(file.path),
      content: file.content,
      updatedAt: Date.now(),
    });
  }
  await tx.done;
}

export async function deleteFile(path: string): Promise<void> {
  const db = await dbPromise;
  await db.delete(STORE, normalizePath(path));
}

export async function clearWorkspace(): Promise<void> {
  const db = await dbPromise;
  await db.clear(STORE);
}

function createSampleWave(): number[] {
  const wave: number[] = [];
  for (let i = 0; i < 3000; i += 1) {
    const t = i * 0.01;
    wave.push(120 * Math.sin(2 * Math.PI * 1.2 * t) * Math.exp(-0.001 * i));
  }
  return wave;
}

export async function initializeWorkspace(): Promise<void> {
  const files = await listAllFiles();
  if (files.length > 0) {
    return;
  }

  const model = createEmptyModel("ModelA");
  const sampleWave = createSampleWave();
  const forceWave = makeSineWave({
    freqHz: 3,
    preCycles: 5,
    harmonicCycles: 8,
    postCycles: 5,
    addAfterObservation: true,
  });

  await putFiles([
    {
      path: "model/ModelA.dat",
      content: serializeModelDat(model),
    },
    {
      path: "Wave/SampleWave.csv",
      content: serializeWaveCsv(sampleWave),
    },
    {
      path: "ForceWave/Freq0300_001.csv",
      content: serializeWaveCsv(forceWave),
    },
    {
      path: "DisplacementView/README.txt",
      content:
        "このフォルダーには再読込表示用の結果CSVを配置します。\nResult/his からコピーして利用できます。",
    },
  ]);
}

export function requiredFolders(): readonly string[] {
  return REQUIRED_FOLDERS;
}
