import { ApiError } from "./client.js";

interface UploadParams {
  baseUrl: string;
  fileBuffer: Buffer;
  filename: string;
  authHeaders: Record<string, string>;
}

interface UploadResult {
  temp_file_id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  session_token: string | null;
  gif_frame_count?: number;
  gif_fps?: number;
}

export async function uploadFile(params: UploadParams): Promise<UploadResult> {
  const { baseUrl, fileBuffer, filename, authHeaders } = params;

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer]),
    filename,
  );

  const headers: Record<string, string> = { ...authHeaders };

  const response = await fetch(`${baseUrl}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 413) {
      throw new ApiError("File exceeds maximum size limit.", response.status, body.detail);
    }
    if (response.status === 415 || body.detail?.includes("Unsupported")) {
      throw new ApiError(
        "Unsupported image format. Supported: JPEG, PNG, WebP, AVIF, GIF, HEIC, TIFF, BMP.",
        response.status,
        body.detail,
      );
    }
    throw new ApiError(
      body.detail || "Upload failed",
      response.status,
      body.detail,
    );
  }

  return response.json();
}
