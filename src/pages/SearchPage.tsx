import React, { useState, useEffect } from 'react';
import type { PostItem, TrendItem } from '../../shared/schema.ts';
import { PostCard } from '../components/PostCard.tsx';
import { Search, X, TrendingUp } from 'lucide-react';

interface SearchPageProps {
  currentUserId: string;
  onViewAuthorProfile: (username: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  currentUserId,
  onViewAuthorProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [results, setResults] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trends?window=24h')
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { trends?: TrendItem[] };
        setTrends(data.trends || []);
      })
      .catch(() => {});
  }, []);

  const executeSearch = async (query: string) => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setActiveSearch('');
      return;
    }
    setActiveSearch(q);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=30`);
      if (!res.ok) {
        throw new Error('Search failed');
      }
      const data = (await res.json()) as { posts: PostItem[] };
      setResults(data.posts || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    setActiveSearch('');
    setResults([]);
  };

  const handleTrendClick = (slug: string) => {
    setSearchQuery(slug);
    executeSearch(slug);
  };

  const handlePostDeleted = (deletedId: string) => {
    setResults((prev) => prev.filter((p) => p.id !== deletedId));
  };

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 py-4 space-y-4">
      {/* Clean search field */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <label htmlFor="search-input" className="sr-only">Search</label>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords or #topics..."
            className="w-full min-h-[44px] pl-9 pr-10 py-2 rounded-sm border border-border bg-surface text-text text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear search"
              aria-label="Clear search"
              className="absolute right-3 p-1 text-text-muted hover:text-text cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Trending Topics List */}
      {!activeSearch && trends.length > 0 && (
        <div className="py-2 space-y-2">
          <div className="flex items-center space-x-1.5 text-text-muted text-[13px] font-semibold">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Trending Topics</span>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {trends.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => handleTrendClick(t.slug)}
                className="w-full py-2.5 flex items-center justify-between text-left hover:bg-surface transition-colors cursor-pointer min-h-[44px]"
              >
                <div>
                  <span className="text-[15px] font-semibold text-primary">#{t.slug}</span>
                  <span className="block text-[13px] text-text-muted">{t.display_name}</span>
                </div>
                <span className="text-[13px] text-text-muted font-mono">{t.score.toFixed(1)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Search Meta */}
      {activeSearch && !loading && (
        <div className="flex items-center justify-between text-[13px] text-text-muted pb-1 border-b border-border">
          <span>Results for &ldquo;{activeSearch}&rdquo;</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-primary hover:underline text-[13px] cursor-pointer"
          >
            Clear
          </button>
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
        <div className="space-y-4 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4 border-b border-border space-y-3 animate-skeleton">
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

      {/* Empty State */}
      {!loading && activeSearch && results.length === 0 && !error && (
        <div className="py-12 text-center space-y-2">
          <p className="text-[15px] text-text-muted">No posts found for this search.</p>
          <button
            type="button"
            onClick={handleClear}
            className="text-[13px] font-semibold text-primary hover:underline cursor-pointer min-h-[44px] px-3"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Results List */}
      {!loading && results.length > 0 && (
        <div className="divide-y divide-border">
          {results.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onPostDeleted={handlePostDeleted}
              onViewAuthorProfile={onViewAuthorProfile}
              onTopicClick={(slug) => {
                setSearchQuery(slug);
                executeSearch(slug);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
