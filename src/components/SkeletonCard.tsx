export default function SkeletonCard({
  height = 220,
  className = '',
}: { height?: number; className?: string }) {
  return (
    <>
      <style>{`
        @keyframes mb-skeleton-pulse {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
      <div
        className={className}
        style={{
          height,
          background: 'linear-gradient(180deg, #ECECEC 0%, #F4F4F4 100%)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          animation: 'mb-skeleton-pulse 1.5s ease-in-out infinite alternate',
        }}
        aria-hidden="true"
      />
    </>
  );
}
