import Constants from 'expo-constants';
import { AuthError } from '@/utils/api-client';

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 20; // ~30s max wait

interface AudioUploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
}

interface StartTranscribeResponse {
  jobId: string;
}

interface TranscribeJobResponse {
  jobId: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'FAILED' | 'COMPLETED';
  transcript?: string;
  failureReason?: string;
}

function getApiUrl(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  return (extra.apiUrl ?? '').replace(/\/$/, '');
}

async function authHeaders(getIdToken: () => Promise<string | null>): Promise<Record<string, string>> {
  const token = await getIdToken();
  if (!token) throw new AuthError();
  return {
    Authorization: `Bearer ${token}`,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Full voice-to-text pipeline:
 * 1. Get presigned S3 upload URL
 * 2. Upload audio file
 * 3. Start AWS Transcribe job
 * 4. Poll until complete
 * 5. Return transcript text
 */
export async function transcribeAudio(
  recordingUri: string,
  getIdToken: () => Promise<string | null>,
): Promise<string> {
  const apiUrl = getApiUrl();
  const headers = await authHeaders(getIdToken);

  // 1. Get presigned upload URL
  const uploadUrlRes = await fetch(
    `${apiUrl}/transcribe/audio-upload-url?contentType=${encodeURIComponent('audio/mp4')}`,
    { headers },
  );
  if (uploadUrlRes.status === 401) throw new AuthError();
  if (!uploadUrlRes.ok) throw new Error('Failed to get upload URL');
  const { uploadUrl, s3Key } = (await uploadUrlRes.json()) as AudioUploadUrlResponse;

  // 2. Upload audio file to S3
  const audioResponse = await fetch(recordingUri);
  const audioBlob = await audioResponse.blob();
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'audio/mp4' },
    body: audioBlob,
  });
  if (!uploadRes.ok) throw new Error('Failed to upload audio');

  // 3. Start transcription job
  const startRes = await fetch(`${apiUrl}/transcribe`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ s3Key }),
  });
  if (startRes.status === 401) throw new AuthError();
  if (!startRes.ok) throw new Error('Failed to start transcription');
  const { jobId } = (await startRes.json()) as StartTranscribeResponse;

  // 4. Poll for completion
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS);

    const pollRes = await fetch(`${apiUrl}/transcribe/${encodeURIComponent(jobId)}`, { headers });
    if (pollRes.status === 401) throw new AuthError();
    if (!pollRes.ok) throw new Error('Failed to check transcription status');

    const job = (await pollRes.json()) as TranscribeJobResponse;

    if (job.status === 'COMPLETED') {
      return job.transcript ?? '';
    }
    if (job.status === 'FAILED') {
      throw new Error(job.failureReason ?? 'Transcription failed');
    }
    // QUEUED or IN_PROGRESS — keep polling
  }

  throw new Error('Transcription timed out');
}
