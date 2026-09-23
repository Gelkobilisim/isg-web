import React from "react";
import { Loader2, ChevronDown, Check } from "lucide-react";

/**
 * TaskCardSkeleton: High-performance skeleton loading placeholder for OHS / ISG violation cards.
 */
export const TaskCardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`task-skel-${i}`}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-150 dark:border-gray-700/80 shadow-sm animate-pulse flex flex-col space-y-4 relative overflow-hidden"
        >
          {/* Subtle gradient shimmer overlay */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-4 w-28 bg-gray-200/80 dark:bg-gray-700/70 rounded"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-4 w-full bg-gray-100 dark:bg-gray-750 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-750 rounded"></div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="h-4 w-32 bg-gray-150 dark:bg-gray-700/60 rounded"></div>
            <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * ShipmentCardSkeleton: High-performance skeleton loader for shipment & logistics rows.
 */
export const ShipmentCardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`shipment-skel-${i}`}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-150 dark:border-gray-700/80 shadow-sm animate-pulse flex flex-col md:flex-row justify-between md:items-center gap-3"
        >
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="space-y-1.5 min-w-[100px]">
              <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 w-20 bg-gray-200/80 dark:bg-gray-700/70 rounded-md"></div>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            <div className="space-y-1.5 min-w-[160px]">
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 w-36 bg-gray-200/80 dark:bg-gray-700/70 rounded-md"></div>
            </div>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * PaginationControl: Smooth, interactive load-more controller with animated spinner and live progress.
 */
export const PaginationControl = ({
  currentCount,
  totalCount,
  pageSize = 15,
  isLoading = false,
  onLoadMore,
  label = "Daha Fazla Göster",
}) => {
  if (!totalCount || totalCount <= pageSize) return null;

  const displayedCount = Math.min(currentCount, totalCount);
  const hasMore = displayedCount < totalCount;
  const progressPercent = Math.min(
    100,
    Math.round((displayedCount / totalCount) * 100)
  );

  return (
    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700/60 flex flex-col items-center gap-3 animate-fade-in">
      {/* Progress Counter & Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
        <span>
          Toplam <strong className="text-gray-800 dark:text-gray-200">{totalCount}</strong> kayıttan{" "}
          <strong className="text-gray-800 dark:text-gray-200">{displayedCount}</strong> tanesi listeleniyor
        </span>
        <div className="w-28 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <span className="text-[11px] text-gray-400 font-semibold">%{progressPercent}</span>
      </div>

      {/* Button or Finished Indicator */}
      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-75 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Veriler Yükleniyor...</span>
            </>
          ) : (
            <>
              <span>{label}</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </>
          )}
        </button>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/40">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span>Tüm kayıtlar görüntülendi ({totalCount} kayıt)</span>
        </div>
      )}
    </div>
  );
};
