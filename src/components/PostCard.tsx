import React, { useState, useEffect } from 'react';
import type { PostItem } from '../../shared/schema.ts';
import { ExpiryChip } from './ExpiryChip.tsx';
import { Heart, MessageSquare, Flag, Trash2, ThumbsUp, ThumbsDown, EyeOff, MoreHorizontal } from 'lucide-react';
import { CommentModal } from './CommentModal.tsx';
import { ReportModal } from './ReportModal.tsx';

interface PostCardProps {
  post: PostItem;
  currentUserId: string;
  onPostDeleted?: (postId: string) => void;
  onViewAuthorProfile?: (username: string) => void;
  onTopicClick?: (topicSlug: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onPostDeleted,
  onViewAuthorProfile,
  onTopicClick,
}) => {
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [hasLiked, setHasLiked] = useState(post.has_liked);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Record impression and 3-second dwell signal on mount
  useEffect(() => {
    fetch('/api/impressions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ impressions: [{ post_id: post.id, position: 0 }] }),
    }).catch(() => {});

    const timer = setTimeout(() => {
      fetch('/api/impressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ impressions: [{ post_id: post.id, position: 0, duration_ms: 3000 }] }),
      }).catch(() => {});
    }, 3000);

    return () => clearTimeout(timer);
  }, [post.id]);

  const handleToggleLike = async () => {
    const nextLiked = !hasLiked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    setHasLiked(nextLiked);
    setLikesCount(nextCount);

    try {
      const method = nextLiked ? 'POST' : 'DELETE';
      const res = await fetch(`/api/posts/${post.id}/likes`, { method });
      if (!res.ok) {
        setHasLiked(!nextLiked);
        setLikesCount(likesCount);
      }
    } catch {
      setHasLiked(!nextLiked);
      setLikesCount(likesCount);
    }
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onPostDeleted) onPostDeleted(post.id);
      } else {
        setConfirmDelete(false);
        setDeleting(false);
      }
    } catch {
      setConfirmDelete(false);
      setDeleting(false);
    }
  };

  const handleSendFeedback = async (type: 'more_like_this' | 'show_less' | 'not_interested') => {
    setShowMenu(false);
    if (type === 'not_interested') {
      setHidden(true);
    } else {
      setFeedbackNotice(type === 'more_like_this' ? 'More like this' : 'Showing less');
      setTimeout(() => setFeedbackNotice(null), 3000);
    }

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, type }),
      });
    } catch {
      // Ignored
    }
  };

  if (hidden) {
    return (
      <article className="py-3 border-b border-border text-[13px] text-text-muted flex items-center justify-between">
        <span>Post hidden from feed.</span>
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="text-primary hover:underline text-[13px] font-semibold cursor-pointer min-h-[44px] px-2 flex items-center"
        >
          Undo
        </button>
      </article>
    );
  }

  // Extract initial for avatar
  const authorInitial = (post.author_display_name || post.author_username || 'U')
    .charAt(0)
    .toUpperCase();

  return (
    <article className="py-4 border-b border-border space-y-2.5 relative">
      {/* Post header: 32px avatar circle, bold username, small muted time left */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            type="button"
            onClick={() => onViewAuthorProfile && onViewAuthorProfile(post.author_username)}
            className="w-8 h-8 rounded-pill bg-primary-tint text-primary flex items-center justify-center font-semibold text-[13px] shrink-0 hover:opacity-85 transition-opacity cursor-pointer"
            title={`View @${post.author_username}`}
          >
            {authorInitial}
          </button>
          <div className="min-w-0 flex items-center space-x-1.5 truncate">
            <button
              type="button"
              onClick={() => onViewAuthorProfile && onViewAuthorProfile(post.author_username)}
              className="font-semibold text-text text-[15px] hover:underline truncate cursor-pointer"
            >
              {post.author_username}
            </button>
            {post.author_class_name && (
              <span className="text-[13px] text-text-muted truncate">
                · {post.author_class_name}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center space-x-2">
          {/* Small muted time left */}
          <ExpiryChip expiresAt={post.expires_at} />

          {/* More options menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              title="More options"
              aria-label="More options"
              className="min-h-[44px] min-w-[32px] px-1 flex items-center justify-center text-text-muted hover:text-text cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-surface border border-border rounded-sm shadow-sheet z-20 py-1 text-[13px]">
                <button
                  type="button"
                  onClick={() => handleSendFeedback('more_like_this')}
                  className="w-full text-left px-3 py-2 hover:bg-bg flex items-center space-x-2 text-text cursor-pointer min-h-[44px]"
                >
                  <ThumbsUp className="w-4 h-4 text-primary" />
                  <span>More like this</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendFeedback('show_less')}
                  className="w-full text-left px-3 py-2 hover:bg-bg flex items-center space-x-2 text-text cursor-pointer min-h-[44px]"
                >
                  <ThumbsDown className="w-4 h-4 text-text-muted" />
                  <span>Show less like this</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendFeedback('not_interested')}
                  className="w-full text-left px-3 py-2 hover:bg-bg flex items-center space-x-2 text-danger cursor-pointer min-h-[44px]"
                >
                  <EyeOff className="w-4 h-4 text-danger" />
                  <span>Not interested</span>
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowReport(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-bg flex items-center space-x-2 text-text-muted hover:text-danger cursor-pointer min-h-[44px]"
                >
                  <Flag className="w-4 h-4" />
                  <span>Report post</span>
                </button>
              </div>
            )}
          </div>

          {post.author_id === currentUserId && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              title="Delete post"
              aria-label="Delete post"
              className="min-h-[44px] min-w-[32px] px-1 flex items-center justify-center text-text-muted hover:text-danger cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation inline banner */}
      {confirmDelete && (
        <div className="p-2.5 rounded-sm bg-danger-tint border border-danger text-danger text-[13px] flex items-center justify-between">
          <span>Delete post permanently?</span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDeletePost}
              disabled={deleting}
              className="px-2.5 py-1 rounded-sm bg-danger text-on-primary font-semibold text-[12px] cursor-pointer min-h-[32px]"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 rounded-sm border border-danger text-danger text-[12px] cursor-pointer hover:bg-surface min-h-[32px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedbackNotice && (
        <div className="text-[12px] font-medium text-primary bg-primary-tint px-2.5 py-1 rounded-sm inline-block">
          {feedbackNotice}
        </div>
      )}

      {/* Body text 15px */}
      <p className="text-[15px] text-text whitespace-pre-wrap leading-relaxed break-words">
        {post.body}
      </p>

      {/* Hashtags as plain blue text, not chips */}
      {post.topics && post.topics.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {post.topics.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => onTopicClick && onTopicClick(t.slug)}
              className="text-[14px] text-primary hover:underline cursor-pointer font-normal p-0 bg-transparent border-0"
            >
              #{t.slug}
            </button>
          ))}
        </div>
      )}

      {/* Media gallery (up to 4 images) */}
      {post.media && post.media.length > 0 && (
        <div
          className={`grid gap-1.5 rounded-sm overflow-hidden ${
            post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {post.media.map((img) => (
            <div
              key={img.id}
              className="relative aspect-video bg-bg rounded-sm overflow-hidden border border-border flex items-center justify-center"
            >
              <img
                src={`/api/media/${img.id}`}
                alt="Post media"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Action row: icon-only heart, comment, flag, counts in small muted text; light heart fill animation on like */}
      <div className="pt-1 flex items-center justify-between text-[13px] text-text-muted">
        <div className="flex items-center space-x-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            title={hasLiked ? 'Unlike' : 'Like'}
            aria-label={hasLiked ? 'Unlike' : 'Like'}
            className="min-h-[44px] flex items-center space-x-1.5 text-text-muted hover:text-text cursor-pointer transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                hasLiked ? 'fill-danger text-danger animate-heart-pop' : ''
              }`}
            />
            <span className="text-[13px] text-text-muted font-normal">
              {likesCount}
            </span>
          </button>

          {/* Comment Button */}
          <button
            type="button"
            onClick={() => setShowComments(true)}
            title="Comments"
            aria-label="Comments"
            className="min-h-[44px] flex items-center space-x-1.5 text-text-muted hover:text-text cursor-pointer transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[13px] text-text-muted font-normal">
              {commentsCount}
            </span>
          </button>
        </div>

        {/* Flag / Report Button */}
        <button
          type="button"
          onClick={() => setShowReport(true)}
          title="Report post"
          aria-label="Report post"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-danger cursor-pointer transition-colors"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* Modals */}
      {showComments && (
        <CommentModal
          postId={post.id}
          currentUserId={currentUserId}
          onClose={() => setShowComments(false)}
          onCommentCountChange={(delta) => setCommentsCount((c) => Math.max(0, c + delta))}
        />
      )}

      {showReport && (
        <ReportModal
          targetType="post"
          targetId={post.id}
          onClose={() => setShowReport(false)}
          onReportSubmitted={() => {
            setFeedbackNotice('Report submitted.');
            setTimeout(() => setFeedbackNotice(null), 3000);
          }}
        />
      )}
    </article>
  );
};
