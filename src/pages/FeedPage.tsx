import React, { useState, useEffect } from 'react';
import type { PostItem, FeedResponse } from '../../shared/schema.ts';
import { PostCard } from '../components/PostCard.tsx';
import { Sparkles } from 'lucide-react';

interface FeedPageProps {
  currentUserId: string;
  onNavigateToCompose: () => void;
  onViewAuthorProfile: (username: string) => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({
  currentUserId,
  onNavigateToCompose,
  onViewAuthorProfile,
}) => {
  const [feedMode, setFeedMode] = useState<'for_you' | 'following'>('for_you');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runningJob, setRunningJob] = useState(false);
  const [jobNotice, setJobNotice] = useState<string | null>(null);

  const fetchFeed = async (cursor?: string) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const modeParam = feedMode === 'for_you' ? 'mode=for_you' : 'mode=following';
      const url = cursor
        ? `/api/feed?${modeParam}&cursor=${encodeURIComponent(cursor)}&limit=10`
        : `/api/feed?${modeParam}&limit=10`;

      const res = await fetch(url);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Failed to load posts');
      }

      const data = (await res.json()) as FeedResponse & { posts: PostItem[] };
      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts || []);
      }
      setNextCursor(data.next_cursor || null);
      setHasMore(!!data.has_more);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [feedMode]);

  const handlePostDeleted = (deletedId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  // DEV-ONLY: remove before launch
  const handleTriggerExpiryJob = async () => {
    setRunningJob(true);
    setJobNotice(null);
    try {
      const res = await fetch('/api/jobs/cleanup-expired', { method: 'POST' });
      if (res.ok) {
        const result = (await res.json()) as { checked: number; extended: number; deleted: number; prunedOrphanMedia: number };
        setJobNotice(`Expiry completed: checked ${result.checked}, extended ${result.extended}, deleted ${result.deleted}, pruned ${result.prunedOrphanMedia} orphan media.`);
        setTimeout(() => setJobNotice(null), 4000);
        fetchFeed();
      }
    } catch (err) {
      setJobNotice(`Job error: ${(err as Error).message}`);
    } finally {
      setRunningJob(false);
    }
  };

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 py-2 space-y-2">
      {/* Feed Tabs: small text tabs with 2px blue underline on active */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex space-x-6">
          <button
            type="button"
            onClick={() => setFeedMode('for_you')}
            className={`pb-2.5 text-[14px] font-semibold transition-colors cursor-pointer border-b-2 min-h-[44px] flex items-center ${
              feedMode === 'for_you'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            For you
          </button>
          <button
            type="button"
            onClick={() => setFeedMode('following')}
            className={`pb-2.5 text-[14px] font-semibold transition-colors cursor-pointer border-b-2 min-h-[44px] flex items-center ${
              feedMode === 'following'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Following
          </button>
        </div>

        {/* DEV-ONLY: remove before launch */}
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={handleTriggerExpiryJob}
            disabled={runningJob}
            title="Run daily expiry job manually"
            className="text-[11px] font-medium text-text-muted hover:text-text px-2 py-1 rounded border border-border bg-surface cursor-pointer min-h-[32px] flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3 text-accent" />
            <span>{runningJob ? 'Running...' : 'Run Expiry'}</span>
          </button>
        )}
      </div>

      {/* DEV notice */}
      {import.meta.env.DEV && jobNotice && (
        <div className="p-2 text-[12px] text-primary bg-primary-tint rounded-sm border border-border">
          {jobNotice}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="py-4 text-center text-danger text-[14px]">
          {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4 space-y-3 animate-skeleton">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-pill bg-border shrink-0" />
                <div className="space-y-1">
                  <div className="w-24 h-3.5 bg-border rounded-sm" />
                  <div className="w-16 h-3 bg-border rounded-sm" />
                </div>
              </div>
              <div className="w-full h-4 bg-border rounded-sm" />
              <div className="w-3/4 h-4 bg-border rounded-sm" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State: one short line, one subtle button */}
      {!loading && posts.length === 0 && !error && (
        <div className="py-16 text-center space-y-2">
          <p className="text-[15px] text-text-muted">No posts in this feed yet.</p>
          <button
            type="button"
            onClick={onNavigateToCompose}
            className="text-[13px] font-semibold text-primary hover:underline cursor-pointer min-h-[44px] px-3"
          >
            Create a post
          </button>
        </div>
      )}

      {/* Posts List */}
      {!loading && posts.length > 0 && (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onPostDeleted={handlePostDeleted}
              onViewAuthorProfile={onViewAuthorProfile}
            />
          ))}

          {/* Load More Pagination */}
          {hasMore && (
            <div className="text-center py-4">
              <button
                type="button"
                onClick={() => nextCursor && fetchFeed(nextCursor)}
                disabled={loadingMore}
                className="text-[13px] font-semibold text-primary hover:underline cursor-pointer min-h-[44px] px-4"
              >
                {loadingMore ? 'Loading older posts...' : 'Older posts'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
