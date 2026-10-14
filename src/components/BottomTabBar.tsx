import React from 'react';
import { Home, Search, PlusSquare, User } from 'lucide-react';

export type AppTab = 'feed' | 'search' | 'post' | 'profile' | 'signin';

interface BottomTabBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isAuthenticated: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  setActiveTab,
  isAuthenticated,
}) => {
  if (!isAuthenticated) return null;

  return (
    <nav
      aria-label="Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border"
    >
      <div className="max-w-[640px] mx-auto h-12 px-4 flex items-center justify-around">
        {/* Feed Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          title="Feed"
          aria-label="Feed"
          className={`flex-1 h-full min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'feed'
              ? 'text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Home
            className="w-5 h-5"
            fill={activeTab === 'feed' ? 'currentColor' : 'none'}
            strokeWidth={activeTab === 'feed' ? 2 : 1.75}
          />
        </button>

        {/* Search Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          title="Search"
          aria-label="Search"
          className={`flex-1 h-full min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'search'
              ? 'text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Search
            className="w-5 h-5"
            strokeWidth={activeTab === 'search' ? 2.5 : 1.75}
          />
        </button>

        {/* New Post Composer Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('post')}
          title="New post"
          aria-label="New post"
          className={`flex-1 h-full min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'post'
              ? 'text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <PlusSquare
            className="w-5 h-5"
            fill={activeTab === 'post' ? 'currentColor' : 'none'}
            strokeWidth={activeTab === 'post' ? 2 : 1.75}
          />
        </button>

        {/* Profile Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          title="Profile"
          aria-label="Profile"
          className={`flex-1 h-full min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <User
            className="w-5 h-5"
            fill={activeTab === 'profile' ? 'currentColor' : 'none'}
            strokeWidth={activeTab === 'profile' ? 2 : 1.75}
          />
        </button>
      </div>
    </nav>
  );
};
