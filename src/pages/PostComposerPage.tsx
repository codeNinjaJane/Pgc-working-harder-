import React, { useState } from 'react';
import type { MediaItem } from '../../shared/schema.ts';
import { Image, X } from 'lucide-react';

interface PostComposerPageProps {
  onPostCreated: () => void;
  onCancel?: () => void;
}

export const PostComposerPage: React.FC<PostComposerPageProps> = ({
  onPostCreated,
  onCancel,
}) => {
  const [body, setBody] = useState('');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaList.length + files.length > 4) {
      setError('Maximum 4 images allowed.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;

        // Validate size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds 5 MB limit.`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/media/uploads', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = (await res.json()) as { error?: string };
          throw new Error(errData.error || `Upload failed for "${file.name}"`);
        }

        const mediaItem = (await res.json()) as MediaItem;
        setMediaList((prev) => [...prev, mediaItem]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (mediaId: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: body.trim(),
          media_ids: mediaList.map((m) => m.id),
        }),
      });

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error || 'Failed to publish post');
      }

      setBody('');
      setMediaList([]);
      onPostCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 py-3 flex flex-col min-h-[calc(100vh-140px)]">
      {/* Top bar: Cancel on left, Post on right as text button */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <button
          type="button"
          onClick={onCancel || onPostCreated}
          className="text-[15px] text-text-muted hover:text-text cursor-pointer min-h-[44px] flex items-center transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !body.trim() || uploading}
          className="text-[15px] font-semibold text-primary hover:text-primary-hover disabled:opacity-40 cursor-pointer min-h-[44px] flex items-center transition-colors"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {error && (
        <div className="my-2 p-2.5 rounded-sm bg-danger-tint text-danger text-[13px]">
          {error}
        </div>
      )}

      {/* Main Composer Area: borderless textarea */}
      <div className="flex-1 py-4 flex flex-col">
        <textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's happening?"
          maxLength={1000}
          autoFocus
          className="w-full bg-transparent border-0 p-0 text-[15px] text-text placeholder:text-text-muted/60 focus:outline-none resize-none leading-relaxed flex-1"
        />

        {/* Image thumbnails in a row */}
        {mediaList.length > 0 && (
          <div className="flex items-center space-x-2.5 overflow-x-auto py-3">
            {mediaList.map((m) => (
              <div
                key={m.id}
                className="relative w-20 h-20 rounded-sm overflow-hidden border border-border bg-bg shrink-0"
              >
                <img
                  src={`/api/media/${m.id}`}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(m.id)}
                  aria-label="Remove image"
                  className="absolute top-1 right-1 p-1 rounded-pill bg-[#17233A]/70 text-white hover:bg-danger transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="pt-3 border-t border-border flex items-center justify-between text-[13px] text-text-muted">
          <div className="flex items-center space-x-2">
            <label
              htmlFor="composer-file-input"
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center text-primary hover:opacity-80 cursor-pointer transition-opacity ${
                mediaList.length >= 4 || uploading ? 'opacity-40 pointer-events-none' : ''
              }`}
              title="Add photo"
              aria-label="Add photo"
            >
              <Image className="w-5 h-5" />
            </label>
            <input
              id="composer-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploading && <span className="text-[12px] text-text-muted">Uploading...</span>}
          </div>

          <span className="text-[12px] text-text-muted font-mono">
            {body.length} / 1000
          </span>
        </div>
      </div>
    </div>
  );
};
