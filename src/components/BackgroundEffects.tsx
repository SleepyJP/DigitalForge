'use client';

export default function BackgroundEffects() {
  return (
    <>
      {/* Simple static gradient - no animations */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none z-0" />
    </>
  );
}
