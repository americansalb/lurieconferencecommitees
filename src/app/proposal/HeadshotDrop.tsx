"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Upload, X } from "lucide-react";

const GOLD = "#C9A14B";
const GOLD_SOFT = "#F4E9CD";
const TEAL = "#0E4456";
const HAIRLINE = "#E6EBEE";
const PAPER = "#FAFBFC";
const INK = "#0B1F25";
const MUTED = "#5A6E76";

type Props = {
  dataUrl: string;
  fileName: string;
  onSelect: (dataUrl: string, name: string) => void;
  onClear: () => void;
  onSizeError: (msg: string) => void;
};

export function HeadshotDrop({ dataUrl, fileName, onSelect, onClear, onSizeError }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onSizeError("Please choose a photo under 5 MB.");
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      onSizeError("JPG, PNG, or WebP works best.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      onSelect(result, file.name);
    };
    reader.readAsDataURL(file);
  }

  // When the photo is loaded, the SpeakerCard owns the rendered circle via
  // its own layoutId. This zone just shows a hairline confirmation chip.
  if (dataUrl) {
    return (
      <div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{ border: `1px solid ${HAIRLINE}`, background: PAPER }}
      >
        <div className="relative w-12 h-12 rounded-full overflow-hidden" style={{ border: `1px solid ${GOLD_SOFT}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold truncate" style={{ color: INK }}>{fileName || "Photo loaded"}</div>
          <div className="text-[11px]" style={{ color: MUTED }}>Now showing on your card.</div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          aria-label="Remove photo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all"
        style={{
          borderColor: dragOver ? GOLD : HAIRLINE,
          background: dragOver ? "rgba(201,161,75,0.06)" : "transparent",
        }}
      >
        <AnimatePresence>
          <motion.span
            key="icon"
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${TEAL}10`, color: TEAL }}
            animate={{ scale: dragOver ? 1.08 : 1 }}
          >
            <ImageIcon className="w-5 h-5" />
          </motion.span>
        </AnimatePresence>
        <span className="flex-1 text-left">
          <span className="block text-[13px] font-semibold" style={{ color: INK }}>
            Drop a photo, or browse
          </span>
          <span className="block text-[11px]" style={{ color: MUTED }}>
            JPG / PNG / WebP, under 5 MB. Lands inside the gold ring.
          </span>
        </span>
        <Upload className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </>
  );
}
