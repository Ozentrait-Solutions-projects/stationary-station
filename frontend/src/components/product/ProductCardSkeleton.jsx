export default function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-xs animate-pulse">
      {/* Image */}
      <div className="skeleton aspect-square w-full" />

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="skeleton h-4 w-1/2 rounded mt-1" />
        <div className="skeleton h-7 w-full rounded mt-2" />
      </div>
    </div>
  );
}
