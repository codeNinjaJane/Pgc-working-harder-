import React from 'react';

interface ExpiryChipProps {
  expiresAt: string;
}

export const ExpiryChip: React.FC<ExpiryChipProps> = ({ expiresAt }) => {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();

  if (remainingMs <= 0) {
    return <span className="text-[12px] text-danger font-semibold">Expired</span>;
  }

  const hoursRemaining = remainingMs / (1000 * 60 * 60);

  // Red only under 24h
  if (hoursRemaining < 24) {
    const text =
      hoursRemaining < 1
        ? `${Math.max(1, Math.floor(remainingMs / (1000 * 60)))}m`
        : `${Math.floor(hoursRemaining)}h`;
    return <span className="text-[12px] text-danger font-semibold">{text}</span>;
  }

  // Yellow only when under 48h
  if (hoursRemaining < 48) {
    const text = `${Math.floor(hoursRemaining)}h`;
    return <span className="text-[12px] text-[#C29207] font-semibold">{text}</span>;
  }

  // Small muted text (e.g. "6d")
  const days = Math.ceil(hoursRemaining / 24);
  return <span className="text-[12px] text-text-muted font-normal">{days}d</span>;
};
