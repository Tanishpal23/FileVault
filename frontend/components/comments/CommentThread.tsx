"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { commentApi, CommentItem } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { ConfirmModal, ConfirmVariant } from "@/components/ui/ConfirmModal";

interface CommentThreadProps {
  fileId: string;
  fileName: string;
  currentUserId?: string;
}

export function CommentThread({ fileId, fileName, currentUserId }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: ConfirmVariant;
    action?: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { joinFile, leaveFile, on, off } = useSocket();

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const res = await commentApi.list(fileId);
      setComments(Array.isArray(res) ? res : []);
    } catch (err: any) {
      if (err?.status !== 401 && err?.code !== "NO_TOKEN") {
        console.warn("Failed to load comments:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    joinFile(fileId);

    const handleCommentAdded = (comment: CommentItem) => {
      if (comment.fileId === fileId) {
        setComments((prev) => {
          if (prev.some((c) => c.id === comment.id)) return prev;
          return [...prev, comment];
        });
      }
    };

    const handleCommentUpdated = (comment: CommentItem) => {
      if (comment.fileId === fileId) {
        setComments((prev) =>
          prev.map((c) => (c.id === comment.id ? comment : c))
        );
      }
    };

    const handleCommentDeleted = ({ id, fileId: fId }: { id: string; fileId: string }) => {
      if (fId === fileId) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    };

    on("comment:added", handleCommentAdded);
    on("comment:updated", handleCommentUpdated);
    on("comment:deleted", handleCommentDeleted);

    return () => {
      leaveFile(fileId);
      off("comment:added", handleCommentAdded);
      off("comment:updated", handleCommentUpdated);
      off("comment:deleted", handleCommentDeleted);
    };
  }, [fileId, joinFile, leaveFile, on, off]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const created = await commentApi.add(fileId, trimmed);
      setComments((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev;
        return [...prev, created];
      });
      setNewComment("");
    } catch (err: any) {
      alert(err.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: CommentItem) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setActiveMenuId(null);
  };

  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;

    try {
      const updated = await commentApi.update(commentId, trimmed);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c))
      );
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || "Failed to update comment");
    }
  };

  const handleDelete = (commentId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Comment?",
      description: "Are you sure you want to delete this comment? This action cannot be undone.",
      confirmText: "Delete Comment",
      variant: "danger",
      action: async () => {
        try {
          await commentApi.delete(commentId);
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          setActiveMenuId(null);
        } catch (err: any) {
          alert(err.message || "Failed to delete comment");
        }
      },
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-neutral-900 dark:text-white text-base">
            Comments
          </h3>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-sm text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No comments yet
            </p>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              Leave feedback, notes, or coordinate revisions with your team.
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor = currentUserId ? comment.authorId === currentUserId : true;
            const isEditing = editingId === comment.id;

            return (
              <div
                key={comment.id}
                className="group flex items-start gap-3 text-sm relative"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                  {getInitials(comment.author?.name || "User")}
                </div>

                <div className="flex-1 min-w-0 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-3 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-neutral-900 dark:text-white text-xs">
                        {comment.author?.name || "Anonymous"}
                      </span>
                      {isAuthor && (
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded font-medium">
                          You
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400">
                        • {formatTime(comment.createdAt)}
                      </span>
                      {comment.editedAt && (
                        <span className="text-[10px] text-neutral-400 italic">
                          (edited)
                        </span>
                      )}
                    </div>

                    {/* Actions menu */}
                    {isAuthor && !isEditing && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === comment.id ? null : comment.id
                            )
                          }
                          className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {activeMenuId === comment.id && (
                          <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg py-1 z-10 text-xs">
                            <button
                              onClick={() => handleStartEdit(comment)}
                              className="w-full px-3 py-1.5 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="w-full px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comment Body or Edit Input */}
                  {isEditing ? (
                    <div className="mt-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-indigo-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-1.5 mt-1.5">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 rounded text-xs text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          className="px-2.5 py-1 rounded text-xs bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1 font-medium"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-700 dark:text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50"
      >
        <div className="flex items-end gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Write a comment... (Enter to send)"
            className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-white placeholder-neutral-400 p-2 focus:outline-none resize-none max-h-24"
            rows={1}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-colors shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          if (confirmConfig.action) {
            await confirmConfig.action();
          }
        }}
      />
    </div>
  );
}
