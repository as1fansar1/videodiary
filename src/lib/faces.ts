// Face embedding + clustering API (foundation).
// Uses face-api.js loaded from a CDN. Thumbnail extraction is a TODO.

const MODEL_CDN = 'https://justadudewhohacks.github.io/face-api.js/models';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _faceapi: any = null;

async function loadFaceApi() {
  if (_faceapi) return _faceapi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = (await import('face-api.js')) as any;
  await mod.nets.tinyFaceDetector.loadFromUri(MODEL_CDN);
  await mod.nets.faceLandmark68Net.loadFromUri(MODEL_CDN);
  await mod.nets.faceRecognitionNet.loadFromUri(MODEL_CDN);
  _faceapi = mod;
  return mod;
}

export async function embedFaces(blob: Blob): Promise<Float32Array[]> {
  const faceapi = await loadFaceApi();
  const url = URL.createObjectURL(blob);
  try {
    const v = document.createElement('video');
    v.src = url;
    v.muted = true;
    v.playsInline = true;
    await new Promise<void>((res, rej) => {
      v.onloadeddata = () => res();
      v.onerror = () => rej(new Error('video decode failed'));
    });
    v.currentTime = Math.min(1, (v.duration || 0) / 2);
    await new Promise<void>((res) => { v.onseeked = () => res(); });
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 320;
    canvas.height = v.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const detections = await faceapi
      .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return detections.map((d: any) => d.descriptor as Float32Array);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type FaceCluster = {
  id: string;
  members: number[];
  centroid: Float32Array;
};

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

export function clusterFaces(embeddings: Float32Array[], threshold = 0.6): FaceCluster[] {
  const clusters: FaceCluster[] = [];
  for (let i = 0; i < embeddings.length; i++) {
    const emb = embeddings[i];
    let best: { cluster: FaceCluster; sim: number } | null = null;
    for (const c of clusters) {
      const s = cosine(emb, c.centroid);
      if (s > threshold && (!best || s > best.sim)) best = { cluster: c, sim: s };
    }
    if (best) {
      best.cluster.members.push(i);
      const k = best.cluster.members.length;
      const cent = best.cluster.centroid;
      for (let j = 0; j < cent.length; j++) cent[j] = cent[j] + (emb[j] - cent[j]) / k;
    } else {
      clusters.push({ id: `c${clusters.length}`, members: [i], centroid: new Float32Array(emb) });
    }
  }
  return clusters;
}

// TODO: thumbnail extraction — capture a frame containing the cluster centroid
// from any entry blob, crop to face bbox, store as a thumbnail blob in the
// `blobs` table. Needs canvas frame capture + bbox crop.
export async function extractClusterThumbnail(_blob: Blob, _embedding: Float32Array): Promise<Blob | null> {
  return null;
}
