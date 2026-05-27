"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import type { Asset } from "@/types/assets";
import { useAssetStore } from "@/store/assetStore";
import { formatBytes } from "@/lib/assetUtils";
import { staggerChild } from "@/lib/motion";

interface AssetCardProps {
  asset:     Asset;
  selected?: boolean;
  compact?:  boolean;
  onSelect?: (asset: Asset) => void;
  onDelete?: (id: string)   => void;
}

export function AssetCard({
  asset,
  selected = false,
  compact  = false,
  onSelect,
  onDelete,
}: AssetCardProps) {
  const getUrl = useAssetStore((s) => s.getUrl);
  const [url, setUrl] = useState<string>(asset.thumbnail);

  useEffect(() => {
    getUrl(asset.id).then((u) => { if (u) setUrl(u); });
  }, [asset.id, getUrl]);

  return (
    <motion.div
      variants={staggerChild}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all
        ${selected
          ? "border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
          : "border-transparent hover:border-gray-200 hover:shadow-sm"}`}
      onClick={() => onSelect?.(asset)}
    >
      {/* Image thumbnail */}
      <div className={`flex items-center justify-center overflow-hidden bg-[#f1f5f9]
        ${compact ? "h-14" : "h-24"}`}
      >
        {url ? (
          <img src={url} alt={asset.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
        )}
      </div>

      {/* Selection check badge */}
      {selected && (
        <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 shadow">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Delete button (hover reveal) */}
      {onDelete && (
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute left-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-500 shadow group-hover:flex hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }}
          type="button"
        >
          <Trash2 className="h-3 w-3" />
        </motion.button>
      )}

      {/* Metadata row */}
      {!compact && (
        <div className="px-2 py-1.5">
          <p className="truncate text-[10px] font-semibold text-gray-700">{asset.name}</p>
          <p className="text-[9px] text-gray-400">{formatBytes(asset.size)}</p>
        </div>
      )}
    </motion.div>
  );
}
