'use client';

interface ForgeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function ForgeButton({
  onClick,
  disabled = false,
  isLoading = false,
  children,
}: ForgeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        forge-button relative w-full py-5 rounded-xl font-orbitron font-bold text-xl
        transition-all duration-300 overflow-hidden
        ${
          disabled
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-black hover:scale-[1.02] hover:shadow-glow-cyan'
        }
      `}
    >
      {/* Shimmer Effect */}
      {!disabled && !isLoading && (
        <div className="shimmer-effect" />
      )}

      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-3">
        {isLoading ? (
          <>
            <div className="spinner" />
            <span>FORGING...</span>
          </>
        ) : (
          <>
            <span className="material-icons text-2xl">construction</span>
            {children}
          </>
        )}
      </span>

      {/* Inner Border Glow */}
      {!disabled && (
        <div className="absolute inset-[2px] rounded-[10px] bg-black/80 -z-10" />
      )}
    </button>
  );
}
