import React, { useState, useEffect } from 'react';
import type { PublicProfileResponse } from '../../shared/schema.ts';
import { LogOut } from 'lucide-react';

interface ProfileViewPageProps {
  initialUsername?: string;
  currentUserId?: string;
  onNavigateToEditProfile?: () => void;
  onLogout?: () => Promise<void> | void;
}

export const ProfileViewPage: React.FC<ProfileViewPageProps> = ({
  initialUsername = '',
  currentUserId,
  onNavigateToEditProfile,
  onLogout,
}) => {
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingFollow, setTogglingFollow] = useState(false);

  const fetchProfile = async (u: string) => {
    if (!u.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(u.trim())}`);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please sign in to view profiles.');
        }
        if (res.status === 404) {
          throw new Error(`@${u.trim()} not found.`);
        }
        throw new Error(`Failed to load profile (${res.status})`);
      }
      const data = (await res.json()) as PublicProfileResponse;
      setProfile(data);
    } catch (err) {
      setProfile(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUsername) {
      fetchProfile(initialUsername);
    }
  }, [initialUsername]);

  const handleToggleFollow = async () => {
    if (!profile || !profile.username) return;
    setTogglingFollow(true);

    const isCurrentlyFollowing = !!profile.is_following;
    const method = isCurrentlyFollowing ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(profile.username)}/follow`, { method });
      if (res.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                is_following: !isCurrentlyFollowing,
                followers_count: Math.max(
                  0,
                  (prev.followers_count || 0) + (isCurrentlyFollowing ? -1 : 1)
                ),
              }
            : null
        );
      }
    } catch {
      // Ignore network error on follow toggle
    } finally {
      setTogglingFollow(false);
    }
  };

  const isSelf = profile?.username === currentUserId;

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 py-4 space-y-5">
      {/* Loading Skeleton */}
      {loading && (
        <div className="py-6 space-y-4 animate-skeleton">
          <div className="flex items-center space-x-4">
            <div className="w-18 h-18 rounded-pill bg-border shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-32 h-4 bg-border rounded-sm" />
              <div className="w-24 h-3.5 bg-border rounded-sm" />
            </div>
          </div>
          <div className="w-full h-12 bg-border rounded-sm" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="py-8 text-center space-y-2">
          <p className="text-[15px] text-danger">{error}</p>
        </div>
      )}

      {/* Profile: large avatar, name, @username, bio, follower counts in one line, one outlined Edit profile or Follow button */}
      {profile && !loading && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            {/* Large avatar circle */}
            <div className="w-18 h-18 rounded-pill bg-primary-tint text-primary flex items-center justify-center font-semibold text-[26px] shrink-0">
              {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
            </div>

            {/* Follower counts in one line */}
            <div className="flex-1 flex items-center justify-around py-3 text-center">
              <div>
                <span className="block font-semibold text-text text-[16px]">
                  {profile.followers_count ?? 0}
                </span>
                <span className="text-[13px] text-text-muted">followers</span>
              </div>
              <div>
                <span className="block font-semibold text-text text-[16px]">
                  {profile.following_count ?? 0}
                </span>
                <span className="text-[13px] text-text-muted">following</span>
              </div>
            </div>
          </div>

          {/* Identity: name, @username */}
          <div>
            <h1 className="text-[17px] font-semibold text-text tracking-tight">
              {profile.display_name}
            </h1>
            <p className="text-[14px] text-text-muted font-normal">
              @{profile.username}
            </p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-[15px] text-text whitespace-pre-wrap leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Action Row: One outlined Edit profile or Follow button + Logout */}
          <div className="flex items-center space-x-2 pt-1">
            {isSelf ? (
              <>
                <button
                  type="button"
                  onClick={onNavigateToEditProfile}
                  className="flex-1 min-h-[44px] px-4 rounded-sm border border-border bg-surface hover:bg-bg text-text text-[14px] font-semibold transition-colors cursor-pointer flex items-center justify-center"
                >
                  Edit profile
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Log out"
                    aria-label="Log out"
                    className="min-h-[44px] px-3 rounded-sm border border-border bg-surface hover:bg-danger-tint hover:text-danger hover:border-danger text-text-muted text-[13px] font-medium transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={togglingFollow}
                className={`w-full min-h-[44px] px-4 rounded-sm font-semibold text-[14px] transition-colors cursor-pointer flex items-center justify-center ${
                  profile.is_following
                    ? 'border border-border bg-surface text-text hover:bg-bg hover:text-danger'
                    : 'border border-primary bg-primary text-on-primary hover:bg-primary-hover'
                }`}
              >
                {profile.is_following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!profile && !error && !loading && (
        <div className="py-16 text-center space-y-2">
          <p className="text-[15px] text-text-muted">No profile selected.</p>
        </div>
      )}
    </div>
  );
};
