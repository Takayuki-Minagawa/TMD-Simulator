import Encoding from "encoding-japanese";

function toUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

/**
 * Automatically detects and decodes text from various encodings
 * Supports: UTF-8 (with/without BOM), Shift-JIS, and other encodings
 */
export function decodeTextAuto(data: ArrayBuffer | Uint8Array): string {
  const bytes = toUint8Array(data);

  // Check if data is empty
  if (bytes.length === 0) {
    return "";
  }

  // Check for UTF-8 BOM (0xEF 0xBB 0xBF) and strip it
  let workingBytes = bytes;
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    workingBytes = bytes.slice(3);
  }

  // Try UTF-8 decoding first (most common for modern files)
  try {
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const decoded = decoder.decode(workingBytes);

    // Verify the decoded text doesn't contain replacement characters
    // which would indicate encoding issues
    if (!decoded.includes('\uFFFD') || workingBytes.length < 100) {
      return decoded;
    }
  } catch (error) {
    console.warn("UTF-8 decoding failed, trying auto-detection:", error);
  }

  // Fall back to auto-detection for Shift-JIS and other encodings
  try {
    const codeArray = Array.from(workingBytes);
    const detected = Encoding.detect(codeArray);
    const encoding = detected || "SJIS"; // Default to Shift-JIS for Japanese content

    console.info(`Auto-detected encoding: ${encoding}`);

    const converted = Encoding.convert(codeArray, {
      to: "UNICODE",
      from: encoding,
      type: "string",
    });

    if (typeof converted === 'string') {
      return converted;
    }

    throw new Error("Encoding conversion failed to produce a string");
  } catch (error) {
    console.error("All encoding attempts failed:", error);

    // Last resort: try to decode as UTF-8 ignoring errors
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(workingBytes);
    } catch {
      throw new Error(
        "ファイルのエンコーディングを検出できませんでした。UTF-8、Shift-JIS、またはその他のサポートされているエンコーディングで保存されているか確認してください。"
      );
    }
  }
}

export function triggerDownload(
  blob: Blob,
  fileName: string,
): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
