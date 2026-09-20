"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  Users,
  Link as LinkIcon,
  Copy,
  Check,
  Lock,
  Clock,
  Download,
  Trash2,
  Shield,
  Loader2,
  UserPlus,
} from "lucide-react";
import {
  shareApi,
  Collaborator,
  ShareLinkItem,
  FileItem,
} from "@/lib/api";

export interface ShareModalProps {
  file?: FileItem | null;
  fileId?: string;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ file, fileId, fileName, isOpen, onClose }: ShareModalProps) {
  const currentFileId = file?.id || fileId;
  const currentFileName = file?.name || fileName || "File";

  const [activeTab, setActiveTab] = useState<"collaborators" | "link">("collaborators");

  // Collaborators State
  const [owner, setOwner] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"VIEWER" | "COMMENTER" | "EDITOR">("VIEWER");
  const [isInviting, setIsInviting] = useState(false);

  // Share Links State
  const [links, setLinks] = useState<ShareLinkItem[]>([]);
  const [linkRole, setLinkRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [linkPassword, setLinkPassword] = useState("");
  const [enablePassword, setEnablePassword] = useState(false);
  const [linkExpiresAt, setLinkExpiresAt] = useState<string>("none");
  const [downloadLimit, setDownloadLimit] = useState<string>("none");
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Feedback State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  useEffect(() => {
    if (isOpen && currentFileId) {
      loadData(currentFileId);
    }
  }, [isOpen, currentFileId]);

  const loadData = async (targetFileId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [collabData, linksData] = await Promise.all([
        shareApi.getCollaborators(targetFileId).catch(() => ({ owner: null, collaborators: [] })),
        shareApi.getLinks(targetFileId).catch(() => []),
      ]);
      setOwner(collabData.owner);
      setCollaborators(collabData.collaborators || []);
      setLinks(linksData || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load sharing details");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !currentFileId) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentFileId) return;

    setIsInviting(true);
    setErrorMsg(null);
    try {
      await shareApi.invite(currentFileId, inviteEmail.trim(), inviteRole);
      setInviteEmail("");
      showSuccess(`Invited ${inviteEmail} as ${inviteRole}`);
      await loadData(currentFileId);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to invite collaborator");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "VIEWER" | "COMMENTER" | "EDITOR") => {
    try {
      await shareApi.updateRole(currentFileId, userId, newRole);
      showSuccess("Updated collaborator role");
      await loadData(currentFileId);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update role");
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      await shareApi.removeCollaborator(currentFileId, userId);
      showSuccess("Removed collaborator");
      await loadData(currentFileId);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove collaborator");
    }
  };

  const handleCreateLink = async () => {
    setIsCreatingLink(true);
    setErrorMsg(null);
    try {
      let expiresAt: string | null = null;
      if (linkExpiresAt === "1h") {
        expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      } else if (linkExpiresAt === "1d") {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (linkExpiresAt === "7d") {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (linkExpiresAt === "30d") {
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const limit = downloadLimit === "none" ? null : parseInt(downloadLimit, 10);

      await shareApi.createLink(currentFileId, {
        role: linkRole,
        password: enablePassword && linkPassword.trim() ? linkPassword.trim() : undefined,
        expiresAt,
        downloadLimit: limit,
      });

      setLinkPassword("");
      setEnablePassword(false);
      showSuccess("Public share link created");
      await loadData(currentFileId);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create share link");
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      await shareApi.revokeLink(currentFileId, linkId);
      showSuccess("Share link revoked");
      await loadData(currentFileId);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to revoke link");
    }
  };

  const copyToClipboard = (linkId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Share "{currentFileName}"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage who has access and create public download links
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("collaborators")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "collaborators"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Collaborators ({collaborators.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "link"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <LinkIcon className="h-4 w-4" />
            <span>Public Links ({links.length})</span>
          </button>
        </div>

        {/* Content Tab 1: Collaborators */}
        {activeTab === "collaborators" && (
          <div className="mt-5 space-y-5">
            {/* Invite Form */}
            <form onSubmit={handleInvite} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  placeholder="Enter email address..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                  required
                />
              </div>

              <select
                value={inviteRole}
                onChange={(e: any) => setInviteRole(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:bg-slate-800"
              >
                <option value="VIEWER">Viewer</option>
                <option value="COMMENTER">Commenter</option>
                <option value="EDITOR">Editor</option>
              </select>

              <button
                type="submit"
                disabled={isInviting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isInviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Invite
              </button>
            </form>

            {/* People List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
              {/* Owner Item */}
              {owner && (
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                      {owner.name ? owner.name[0].toUpperCase() : "O"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {owner.name} <span className="text-[10px] text-slate-400 font-normal">(you)</span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{owner.email}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Owner
                  </span>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {c.name ? c.name[0].toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={c.role}
                      onChange={(e: any) => handleRoleChange(c.userId, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="COMMENTER">Commenter</option>
                      <option value="EDITOR">Editor</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveCollaborator(c.userId)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 cursor-pointer"
                      title="Remove user"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {collaborators.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No collaborators yet. Enter an email above to share.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Tab 2: Public Share Links */}
        {activeTab === "link" && (
          <div className="mt-5 space-y-5">
            {/* Create Link Panel */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40 space-y-3.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Create a New Share Link
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Expiration */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Expiration
                  </label>
                  <select
                    value={linkExpiresAt}
                    onChange={(e) => setLinkExpiresAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <option value="none">No expiration</option>
                    <option value="1h">1 hour</option>
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                  </select>
                </div>

                {/* Download Limit */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Download Limit
                  </label>
                  <select
                    value={downloadLimit}
                    onChange={(e) => setDownloadLimit(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <option value="none">Unlimited</option>
                    <option value="1">1 download</option>
                    <option value="5">5 downloads</option>
                    <option value="10">10 downloads</option>
                    <option value="50">50 downloads</option>
                  </select>
                </div>
              </div>

              {/* Password Protection Toggle */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePassword}
                    onChange={(e) => setEnablePassword(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Protect with password
                  </span>
                </label>

                {enablePassword && (
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700/80 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleCreateLink}
                disabled={isCreatingLink}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isCreatingLink ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
                Generate Secure Link
              </button>
            </div>

            {/* Existing Links List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Active Links
              </h4>
              {links.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No active share links.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                            {link.url}
                          </span>
                          {link.hasPassword && (
                            <span title="Password protected">
                              <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {link.downloadCount} {link.downloadCount === 1 ? "download" : "downloads"}
                          {link.downloadLimit ? ` of ${link.downloadLimit}` : ""}
                          {link.expiresAt ? ` • Expires ${new Date(link.expiresAt).toLocaleDateString()}` : " • Never expires"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(link.id, link.url)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          {copiedLinkId === link.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRevokeLink(link.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 cursor-pointer"
                          title="Revoke link"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
