import type { CodexUploadResult, ChatHistorySnapshot } from '@/app/types/web3-chat';

const CODEX_API_URL = process.env.NEXT_PUBLIC_CODEX_API_URL || 'http://localhost:8080';

type ProgressCallback = (progress: number) => void;

interface CodexError {
  error: string;
}

type CodexResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function codexFetch(
  path: string,
  init?: RequestInit
): Promise<Response | null> {
  try {
    const res = await fetch(`${CODEX_API_URL}${path}`, {
      ...init,
      headers: { ...init?.headers },
    });
    return res;
  } catch {
    return null;
  }
}

// ─── File Upload / Download ──────────────────────────────────────────────────

export async function uploadFile(
  file: File,
  onProgress?: ProgressCallback
): Promise<CodexResult<CodexUploadResult>> {
  try {
    // Use XMLHttpRequest for progress tracking
    const result = await new Promise<CodexResult<CodexUploadResult>>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${CODEX_API_URL}/api/codex/v1/data`);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(e.loaded / e.total);
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const cid = xhr.responseText.trim().replace(/"/g, '');
          resolve({
            ok: true,
            data: { cid, size: file.size, uploadedAt: Date.now() },
          });
        } else {
          resolve({ ok: false, error: `Upload failed: ${xhr.status}` });
        }
      };

      xhr.onerror = () => resolve({ ok: false, error: 'Codex unreachable' });
      xhr.ontimeout = () => resolve({ ok: false, error: 'Upload timed out' });

      xhr.timeout = 120_000; // 2 minutes
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });

    return result;
  } catch {
    return { ok: false, error: 'Codex unreachable' };
  }
}

export async function uploadEncryptedBlob(
  data: Uint8Array,
  metadata?: { fileName?: string; mimeType?: string }
): Promise<CodexResult<CodexUploadResult>> {
  const res = await codexFetch('/api/codex/v1/data', {
    method: 'POST',
    headers: {
      'Content-Type': metadata?.mimeType || 'application/octet-stream',
      ...(metadata?.fileName && { 'Content-Disposition': `attachment; filename="${metadata.fileName}"` }),
    },
    body: new Blob([data as BlobPart]),
  });

  if (!res) return { ok: false, error: 'Codex unreachable' };
  if (!res.ok) return { ok: false, error: `Upload failed: ${res.status}` };

  const cid = (await res.text()).trim().replace(/"/g, '');
  return {
    ok: true,
    data: { cid, size: data.length, uploadedAt: Date.now() },
  };
}

export async function downloadFile(cid: string): Promise<CodexResult<Blob>> {
  const res = await codexFetch(`/api/codex/v1/data/${cid}/network`);

  if (!res) return { ok: false, error: 'Codex unreachable' };
  if (!res.ok) return { ok: false, error: `Download failed: ${res.status}` };

  const blob = await res.blob();
  return { ok: true, data: blob };
}

// ─── Chat History Snapshots ──────────────────────────────────────────────────

export async function uploadChatSnapshot(
  snapshot: ChatHistorySnapshot
): Promise<CodexResult<string>> {
  const json = JSON.stringify(snapshot);
  const blob = new Uint8Array(new TextEncoder().encode(json));

  const result = await uploadEncryptedBlob(blob, {
    mimeType: 'application/json',
    fileName: `snapshot-${snapshot.conversationId}-${snapshot.toTimestamp}.json`,
  });

  if (!result.ok) return result;
  return { ok: true, data: result.data.cid };
}

export async function downloadChatSnapshot(
  cid: string
): Promise<CodexResult<ChatHistorySnapshot>> {
  const result = await downloadFile(cid);
  if (!result.ok) return result;

  try {
    const text = await result.data.text();
    const snapshot = JSON.parse(text) as ChatHistorySnapshot;
    return { ok: true, data: snapshot };
  } catch {
    return { ok: false, error: 'Invalid snapshot data' };
  }
}

// ─── Health Check ────────────────────────────────────────────────────────────

export async function isCodexAvailable(): Promise<boolean> {
  const res = await codexFetch('/api/codex/v1/debug/info');
  return res !== null && res.ok;
}
