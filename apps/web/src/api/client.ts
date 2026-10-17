import {
  CreateShareResult,
  CreateTextSharePayload,
  FinalizeImageUploadResult,
  InitImageUploadPayload,
  InitImageUploadResult,
  PlanLimits,
  PlanType,
  ShareContentResponse,
  ShareMetadata,
  UserProfile,
  UserShareItem,
} from '@blinkshare/shared';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('blinkshare_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('blinkshare_token', token);
  } else {
    localStorage.removeItem('blinkshare_token');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData) && !(options.body instanceof Blob)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.error || (typeof data === 'string' ? data : 'Request failed');
    const err = new Error(errorMsg);
    (err as any).status = res.status;
    (err as any).details = data?.details;
    (err as any).retryAfter = data?.retryAfter;
    (err as any).isPasswordRequired = data?.isPasswordRequired;
    (err as any).metadata = data?.metadata;
    throw err;
  }

  return data as T;
}

export const api = {
  // Text share
  createTextShare: (payload: CreateTextSharePayload) =>
    request<CreateShareResult>('/shares/text', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Share viewing & unlocking
  getShare: (id: string) =>
    request<{ metadata: ShareMetadata; isPasswordRequired?: boolean }>(`/shares/${id}`),

  getShareContent: (id: string, password?: string) => {
    const url = password ? `/shares/${id}/content?password=${encodeURIComponent(password)}` : `/shares/${id}/content`;
    return request<ShareContentResponse>(url);
  },

  unlockShare: (id: string, password: string) =>
    request<ShareContentResponse>(`/shares/${id}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  deleteShare: (id: string, deletionToken?: string) => {
    const url = deletionToken ? `/shares/${id}?deletionToken=${encodeURIComponent(deletionToken)}` : `/shares/${id}`;
    return request<{ success: boolean; message: string }>(url, {
      method: 'DELETE',
    });
  },

  reportAbuse: (shareId: string, reason: string, details?: string) =>
    request<{ success: boolean; message: string }>(`/shares/${shareId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, details }),
    }),

  // Image Upload Workflow
  initImageUpload: (payload: InitImageUploadPayload) =>
    request<InitImageUploadResult>('/uploads/init', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  uploadImageBinary: (
    uploadUrl: string,
    file: File | Blob,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);

      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload canceled'));
        });
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during image upload'));
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
  },

  finalizeImageUpload: (uploadToken: string) =>
    request<FinalizeImageUploadResult>(`/uploads/${uploadToken}/finalize`, {
      method: 'POST',
    }),

  // Plans & Usage
  getPlans: () =>
    request<{ plans: Record<PlanType, PlanLimits>; fixedLifetimeSeconds: number }>('/plans'),

  getUsage: () =>
    request<{ plan: PlanType; sharesCreatedToday: number; dailyQuotaLimit: number; dailyQuotaRemaining: number }>('/usage'),

  // Account
  register: (email: string, passwordPlain: string) =>
    request<{ token: string; user: UserProfile }>('/account/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: passwordPlain }),
    }),

  login: (email: string, passwordPlain: string) =>
    request<{ token: string; user: UserProfile }>('/account/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: passwordPlain }),
    }),

  getProfile: () => request<UserProfile>('/account/profile'),

  getUserShares: () => request<{ shares: UserShareItem[] }>('/account/shares'),

  deleteUserShare: (id: string) =>
    request<{ success: boolean; message: string }>(`/account/shares/${id}`, {
      method: 'DELETE',
    }),

  // Billing & Free Tier status
  getBillingStatus: () => request<any>('/billing'),

  // Health & Storage Info
  getStorageHealth: () =>
    request<{ status: string; storageMode: string; storageAvailable: boolean; message: string; storage: string }>('/health/storage'),
};
