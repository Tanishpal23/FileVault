const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Attach Bearer token for seamless cross-domain auth (Vercel <-> Render)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("filevault_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Include credentials for HTTP-only cookies
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: {
      code: "PARSE_ERROR",
      message: "Failed to parse server response",
    },
  }));

  if (!response.ok || !json.success) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("filevault_user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("filevault_token");
      const path = window.location.pathname;
      if (
        endpoint !== "/api/auth/me" &&
        !path.startsWith("/login") &&
        !path.startsWith("/register") &&
        !path.startsWith("/s/")
      ) {
        window.location.href = "/login";
      }
    }

    const firstDetail = json.error?.details && typeof json.error.details === "object"
      ? Object.values(json.error.details).flat()[0]
      : null;
    const errorMsg =
      (firstDetail ? String(firstDetail) : null) ||
      json.error?.message ||
      `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.code = json.error?.code || "API_ERROR";
    err.status = response.status;
    err.details = json.error?.details;
    throw err;
  }

  return (json.data !== undefined ? json.data : json) as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    files: number;
    subFolders: number;
  };
}

export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: string;
  storageKey: string;
  status: string;
  isStarred?: boolean;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderContentsResponse {
  success: boolean;
  currentFolder: FolderItem | null;
  breadcrumbs: { id: string; name: string }[];
  folders: FolderItem[];
  files: FileItem[];
  totalFiles: number;
}

export const folderApi = {
  getContents: (folderId: string = "root", search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return api.get<FolderContentsResponse>(`/api/folders/${folderId}/contents${q}`);
  },
  create: (data: { name: string; parentId?: string | null; color?: string }) =>
    api.post<{ success: boolean; folder: FolderItem }>("/api/folders", data),
  rename: (id: string, name: string) =>
    api.patch<{ success: boolean; folder: FolderItem }>(`/api/folders/${id}/rename`, { name }),
  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/folders/${id}`),
};

export const fileApi = {
  get: (id: string) =>
    api.get<{ success: boolean; file: FileItem }>(`/api/files/${id}`),
  rename: (id: string, name: string) =>
    api.patch<{ success: boolean; file: FileItem }>(`/api/files/${id}/rename`, { name }),
  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/files/${id}`),
  toggleStar: (id: string) =>
    api.post<{ success: boolean; fileId: string; isStarred: boolean }>(`/api/files/${id}/star`),
  getDownloadUrl: (id: string, disposition: "inline" | "attachment" = "attachment") =>
    api.get<{
      success: boolean;
      file: { id: string; name: string; mimeType: string; size: string };
      downloadUrl: string;
    }>(`/api/files/${id}/download?disposition=${disposition}`),
  getContent: (id: string) =>
    api.get<{
      content: string;
      mimeType: string;
      name: string;
      size: string;
    }>(`/api/files/${id}/content`),
};

export interface Collaborator {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: "VIEWER" | "COMMENTER" | "EDITOR";
  createdAt: string;
}

export interface ShareLinkItem {
  id: string;
  token: string;
  url: string;
  role: "VIEWER" | "COMMENTER" | "EDITOR";
  hasPassword: boolean;
  expiresAt: string | null;
  downloadLimit: number | null;
  downloadCount: number;
  createdAt: string;
}

export interface PublicSharedDetails {
  token: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  role: string;
  requiresPassword: boolean;
  expiresAt: string | null;
  downloadLimit: number | null;
  downloadCount: number;
  ownerName: string;
}

export const shareApi = {
  getCollaborators: (fileId: string) =>
    api.get<{
      owner: { id: string; name: string; email: string; role: string };
      collaborators: Collaborator[];
    }>(`/api/files/${fileId}/shares`),

  invite: (fileId: string, email: string, role: string = "VIEWER") =>
    api.post(`/api/files/${fileId}/share`, { email, role }),

  updateRole: (fileId: string, userId: string, role: string) =>
    api.patch(`/api/files/${fileId}/shares/${userId}`, { role }),

  removeCollaborator: (fileId: string, userId: string) =>
    api.delete(`/api/files/${fileId}/shares/${userId}`),

  getLinks: (fileId: string) =>
    api.get<ShareLinkItem[]>(`/api/files/${fileId}/links`),

  createLink: (
    fileId: string,
    data: {
      role?: string;
      password?: string;
      expiresAt?: string | null;
      downloadLimit?: number | null;
    }
  ) => api.post<ShareLinkItem>(`/api/files/${fileId}/links`, data),

  revokeLink: (fileId: string, linkId: string) =>
    api.delete(`/api/files/${fileId}/links/${linkId}`),

  getSharedWithMe: () => api.get<any[]>("/api/shares/with-me"),

  getSharedByMe: () => api.get<any[]>("/api/shares/by-me"),

  getPublicDetails: async (token: string) => {
    const res = await fetch(`${API_URL}/api/shared/${token}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to load shared file");
    return data.data as PublicSharedDetails;
  },

  verifyPublicPassword: async (token: string, password?: string) => {
    const res = await fetch(`${API_URL}/api/shared/${token}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Incorrect password");
    return data;
  },

  downloadPublicFile: async (token: string, password?: string) => {
    const q = password ? `?password=${encodeURIComponent(password)}` : "";
    const res = await fetch(`${API_URL}/api/shared/${token}/download${q}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Download failed");
    return data.data as { downloadUrl: string; fileName: string; fileSize: string };
  },
};

export interface FileVersionItem {
  id: string;
  versionNumber: number;
  size: string;
  checksum?: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  isCurrent: boolean;
}

export interface TrashItemFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  storageKey: string;
  deletedAt: string;
  folder?: { id: string; name: string } | null;
}

export interface TrashItemFolder {
  id: string;
  name: string;
  color?: string | null;
  deletedAt: string;
  parent?: { id: string; name: string } | null;
  _count?: { files: number; subFolders: number };
}

export interface SearchResults {
  files: any[];
  folders: any[];
  totalFiles: number;
  totalFolders: number;
  limit: number;
  offset: number;
}

export const searchApi = {
  search: (params: {
    q?: string;
    type?: string;
    folderId?: string;
    minSize?: number;
    maxSize?: number;
    startDate?: string;
    endDate?: string;
    isStarred?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.type) query.set("type", params.type);
    if (params.folderId) query.set("folderId", params.folderId);
    if (params.minSize !== undefined) query.set("minSize", params.minSize.toString());
    if (params.maxSize !== undefined) query.set("maxSize", params.maxSize.toString());
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.isStarred !== undefined) query.set("isStarred", params.isStarred.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.offset) query.set("offset", params.offset.toString());
    return api.get<SearchResults>(`/api/search?${query.toString()}`);
  },

  getRecent: (limit?: number) =>
    api.get<{ files: any[] }>(`/api/search/recent${limit ? `?limit=${limit}` : ""}`),

  getStarred: () => api.get<{ files: any[] }>("/api/search/starred"),
};

export const trashApi = {
  list: () => api.get<{ files: TrashItemFile[]; folders: TrashItemFolder[] }>("/api/trash"),
  restoreFile: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/api/trash/files/${id}/restore`),
  restoreFolder: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/api/trash/folders/${id}/restore`),
  permanentDeleteFile: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/trash/files/${id}/permanent`),
  permanentDeleteFolder: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/trash/folders/${id}/permanent`),
  emptyTrash: () =>
    api.delete<{ success: boolean; message: string; filesPurged: number; foldersPurged: number }>(
      "/api/trash/empty"
    ),
};

export const versionApi = {
  list: (fileId: string) =>
    api.get<{
      fileId: string;
      fileName: string;
      currentVersionId: string | null;
      versions: FileVersionItem[];
    }>(`/api/files/${fileId}/versions`),

  getDownloadUrl: (
    fileId: string,
    versionId: string,
    disposition: "inline" | "attachment" = "attachment"
  ) =>
    api.get<{ versionNumber: number; downloadUrl: string; expiresInSeconds: number }>(
      `/api/files/${fileId}/versions/${versionId}/download?disposition=${disposition}`
    ),

  restore: (fileId: string, versionId: string) =>
    api.post<{ success: boolean; message: string; newVersionNumber: number }>(
      `/api/files/${fileId}/versions/${versionId}/restore`
    ),

  delete: (fileId: string, versionId: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/files/${fileId}/versions/${versionId}`),

  uploadNewVersion: (fileId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ success: boolean; message: string; versionNumber: number }>(
      `/api/files/${fileId}/versions`,
      formData
    );
  },
};

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface CommentItem {
  id: string;
  fileId: string;
  authorId: string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

export const commentApi = {
  list: (fileId: string) => api.get<CommentItem[]>(`/api/files/${fileId}/comments`),
  add: (fileId: string, content: string) =>
    api.post<CommentItem>(`/api/files/${fileId}/comments`, { content }),
  update: (commentId: string, content: string) =>
    api.patch<CommentItem>(`/api/comments/${commentId}`, { content }),
  delete: (commentId: string) => api.delete<{ success: boolean }>(`/api/comments/${commentId}`),
};

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  payload?: any;
  readAt: string | null;
  createdAt: string;
}

export const notificationApi = {
  list: (limit = 30, offset = 0) =>
    api.get<{ notifications: NotificationItem[]; unreadCount: number }>(
      `/api/notifications?limit=${limit}&offset=${offset}`
    ),
  markAsRead: (id: string) => api.patch<NotificationItem>(`/api/notifications/${id}/read`),
  markAllAsRead: () =>
    api.post<{ count: number }>("/api/notifications/read-all"),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/notifications/${id}`),
};

export interface ActivityItem {
  id: string;
  actorId: string;
  action: string;
  resourceId: string;
  resourceType: "FILE" | "FOLDER";
  resourceName: string;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export const activityApi = {
  list: (limit = 20, offset = 0) =>
    api.get<{ activities: ActivityItem[]; total: number }>(
      `/api/activities?limit=${limit}&offset=${offset}`
    ),
  byResource: (resourceId: string, limit = 20) =>
    api.get<ActivityItem[]>(`/api/activities/resource/${resourceId}?limit=${limit}`),
};

export const authApi = {
  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string }>("/api/auth/forgot-password", { email }),

  verifyOtp: (email: string, otp: string) =>
    api.post<{ success: boolean; message: string }>("/api/auth/verify-otp", { email, otp }),

  resetPassword: (data: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.post<{ success: boolean; message: string }>("/api/auth/reset-password", data),

  deleteAccount: (password?: string) =>
    api.delete<{ success: boolean; message: string }>("/api/auth/account", {
      body: JSON.stringify({ password }),
    }),
};

export async function downloadFile(file: { id: string; name: string }) {
  const res = await fileApi.getDownloadUrl(file.id, "attachment");
  try {
    const response = await fetch(res.downloadUrl);
    if (!response.ok) throw new Error("Fetch failed");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    const link = document.createElement("a");
    link.href = res.downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export async function downloadVersion(
  fileId: string,
  version: { id: string; versionNumber: number },
  fileName: string
) {
  const res = await versionApi.getDownloadUrl(fileId, version.id, "attachment");
  const downloadName = `v${version.versionNumber}-${fileName}`;
  try {
    const response = await fetch(res.downloadUrl);
    if (!response.ok) throw new Error("Fetch failed");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    const link = document.createElement("a");
    link.href = res.downloadUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}




