'use client';

interface ChatLogButtonProps {
  count: number;
  onClick: () => void;
  hasNew?: boolean;
}

export function ChatLogButton({ count, onClick, hasNew }: ChatLogButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-24 right-6 z-50
        w-14 h-14 rounded-full
        bg-accent text-background
        shadow-lg shadow-accent/30
        flex items-center justify-center
        hover:bg-accent-dim hover:scale-105
        transition-all duration-200
        ${hasNew ? 'animate-pulse' : ''}
      `}
      title="Open Adventure Log"
    >
      {/* Chat bubble icon */}
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>

      {/* Badge */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
