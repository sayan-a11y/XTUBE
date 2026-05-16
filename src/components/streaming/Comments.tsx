'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, ThumbsDown, Reply, MessageCircle, ChevronDown, Send } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Comment {
  id: string
  content: string
  likes: number
  createdAt: string
  user: {
    id: string
    username: string
    avatar: string | null
  }
  replies?: Comment[]
}

interface CommentsProps {
  videoId: string
  comments: Comment[]
  onAddComment: (content: string, parentId?: string) => void
  loading?: boolean
}

type SortMode = 'top' | 'newest'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffMinutes > 0) return `${diffMinutes} min ago`
  return 'Just now'
}

function formatLikes(count: number): string {
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return count.toString()
}

// ─── Single Comment Component ────────────────────────────────────────────────

function CommentItem({
  comment,
  onAddComment,
  depth = 0,
}: {
  comment: Comment
  onAddComment: (content: string, parentId?: string) => void
  depth?: number
}) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.likes)

  const handleLike = useCallback(() => {
    if (liked) {
      setLiked(false)
      setLikeCount((c) => c - 1)
    } else {
      setLiked(true)
      setLikeCount((c) => c + 1)
      if (disliked) setDisliked(false)
    }
  }, [liked, disliked])

  const handleDislike = useCallback(() => {
    if (disliked) {
      setDisliked(false)
    } else {
      setDisliked(true)
      if (liked) {
        setLiked(false)
        setLikeCount((c) => c - 1)
      }
    }
  }, [disliked, liked])

  const handleSubmitReply = useCallback(() => {
    if (!replyText.trim()) return
    onAddComment(replyText.trim(), comment.id)
    setReplyText('')
    setShowReplyInput(false)
  }, [replyText, comment.id, onAddComment])

  // Get user initial for avatar placeholder
  const initial = comment.user.username.charAt(0).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${depth > 0 ? 'ml-8 sm:ml-12' : ''}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        {comment.user.avatar ? (
          <img
            src={comment.user.avatar}
            alt={comment.user.username}
            className="h-8 w-8 flex-shrink-0 rounded-full object-cover sm:h-10 sm:w-10"
          />
        ) : (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-xtube-red/20 text-sm font-bold text-xtube-red sm:h-10 sm:w-10">
            {initial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Username + time */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{comment.user.username}</span>
            <span className="text-xs text-xtube-text-secondary">
              {formatRelativeDate(comment.createdAt)}
            </span>
          </div>

          {/* Comment text */}
          <p className="mt-1 text-sm leading-relaxed text-white/80">{comment.content}</p>

          {/* Action row */}
          <div className="mt-2 flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs transition-colors ${
                liked ? 'text-xtube-red' : 'text-xtube-text-secondary hover:text-white'
              }`}
              aria-label="Like comment"
            >
              <ThumbsUp className="h-3.5 w-3.5" fill={liked ? 'currentColor' : 'none'} />
              {likeCount > 0 && <span>{formatLikes(likeCount)}</span>}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDislike}
              className={`flex items-center gap-1 text-xs transition-colors ${
                disliked ? 'text-xtube-red' : 'text-xtube-text-secondary hover:text-white'
              }`}
              aria-label="Dislike comment"
            >
              <ThumbsDown className="h-3.5 w-3.5" fill={disliked ? 'currentColor' : 'none'} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 text-xs text-xtube-text-secondary transition-colors hover:text-white"
              aria-label="Reply to comment"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </motion.button>
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-xtube-card text-[10px] font-bold text-xtube-text-secondary sm:h-8 sm:w-8">
                    U
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Add a reply..."
                      className="w-full resize-none rounded-lg border border-xtube-border bg-xtube-card px-3 py-2 text-sm text-white placeholder:text-xtube-text-secondary focus:border-xtube-red focus:outline-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleSubmitReply()
                        }
                      }}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmitReply}
                        disabled={!replyText.trim()}
                        className="flex items-center gap-1.5 rounded-full bg-xtube-red px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-xtube-red-hover disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send className="h-3 w-3" />
                        Reply
                      </motion.button>
                      <button
                        onClick={() => {
                          setShowReplyInput(false)
                          setReplyText('')
                        }}
                        className="rounded-full px-3 py-1.5 text-xs font-medium text-xtube-text-secondary transition-colors hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onAddComment={onAddComment}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full bg-xtube-card" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24 rounded bg-xtube-card" />
        <Skeleton className="h-4 w-full rounded bg-xtube-card" />
        <Skeleton className="h-4 w-3/4 rounded bg-xtube-card" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-4 w-10 rounded bg-xtube-card" />
          <Skeleton className="h-4 w-10 rounded bg-xtube-card" />
          <Skeleton className="h-4 w-10 rounded bg-xtube-card" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Comments Component ─────────────────────────────────────────────────

export function Comments({ comments, onAddComment, loading }: CommentsProps) {
  const [sortMode, setSortMode] = useState<SortMode>('top')
  const [newComment, setNewComment] = useState('')
  const [showSortMenu, setShowSortMenu] = useState(false)

  const sortedComments = [...comments].sort((a, b) => {
    if (sortMode === 'top') {
      return b.likes - a.likes
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const handleSubmitComment = useCallback(() => {
    if (!newComment.trim()) return
    onAddComment(newComment.trim())
    setNewComment('')
  }, [newComment, onAddComment])

  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length ?? 0),
    0
  )

  return (
    <div className="mt-6 px-2 sm:px-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
          <MessageCircle className="h-5 w-5 text-xtube-red" />
          {totalComments} Comment{totalComments !== 1 ? 's' : ''}
        </h2>

        {/* Sort dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1 rounded-full bg-xtube-card px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-xtube-card-hover hover:text-white sm:text-sm"
            aria-label="Sort comments"
          >
            Sort by
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.button>

          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-10 mt-1 min-w-[150px] overflow-hidden rounded-lg bg-xtube-card py-1 shadow-xl"
              >
                <button
                  onClick={() => {
                    setSortMode('top')
                    setShowSortMenu(false)
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                    sortMode === 'top' ? 'text-xtube-red' : 'text-white/80'
                  }`}
                >
                  Top Comments
                </button>
                <button
                  onClick={() => {
                    setSortMode('newest')
                    setShowSortMenu(false)
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                    sortMode === 'newest' ? 'text-xtube-red' : 'text-white/80'
                  }`}
                >
                  Newest First
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add comment input */}
      <div className="mb-6 flex gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-xtube-red/20 text-sm font-bold text-xtube-red sm:h-10 sm:w-10">
          U
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full resize-none rounded-lg border border-xtube-border bg-xtube-card px-3 py-2.5 text-sm text-white placeholder:text-xtube-text-secondary focus:border-xtube-red focus:outline-none"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmitComment()
              }
            }}
          />
          {newComment.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center justify-end gap-2"
            >
              <button
                onClick={() => setNewComment('')}
                className="rounded-full px-4 py-1.5 text-xs font-medium text-xtube-text-secondary transition-colors hover:text-white sm:text-sm"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmitComment}
                className="flex items-center gap-1.5 rounded-full bg-xtube-red px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-xtube-red-hover sm:text-sm"
              >
                <Send className="h-3.5 w-3.5" />
                Comment
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      ) : sortedComments.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-xtube-card">
            <MessageCircle className="h-8 w-8 text-xtube-text-secondary" />
          </div>
          <p className="text-base font-medium text-white">No comments yet</p>
          <p className="mt-1 text-sm text-xtube-text-secondary">
            Be the first to share your thoughts!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onAddComment={onAddComment}
            />
          ))}
        </div>
      )}
    </div>
  )
}
