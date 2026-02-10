import Encoding from "encoding-japanese";

function toUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

export function decodeTextAuto(data: ArrayBuffer | Uint8Array): string {
  const bytes = toUint8Array(data);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    const codeArray = Array.from(bytes);
    const detected = (Encoding.detect(codeArray) ?? "AUTO") as string;
    return Encoding.convert(codeArray, {
      to: "UNICODE",
      from: detected,
      type: "string",
    }) as string;
  }
}

export function encodeShiftJis(text: string): Uint8Array {
  const unicodeArray = Array.from(text).map((char) => char.charCodeAt(0));
  const sjisArray = Encoding.convert(unicodeArray, {
    from: "UNICODE",
    to: "SJIS",
    type: "array",
  }) as number[];
  return new Uint8Array(sjisArray);
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
