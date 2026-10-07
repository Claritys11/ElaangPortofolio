"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getLenis } from "@/components/motion/smooth-scroll";
import { cn } from "@/lib/utils";

// MediaItemType defines the structure of a media item
export interface MediaItemType {
  id: string;
  type: "image" | "video";
  title: string;
  desc: string;
  url: string;
  span: string;
  /** Optional original document (e.g. a PDF certificate) shown as "Open PDF" in the preview. */
  link?: string;
}

// MediaItem renders either a video or an image based on item.type
const MediaItem = ({ item, className, onClick }: { item: MediaItemType; className?: string; onClick?: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  // Play videos only while they are in view
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => setIsInView(entry.isIntersecting)), {
      root: null,
      rootMargin: "50px",
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let mounted = true;
    const play = async () => {
      try {
        if (el.readyState < 3) {
          setIsBuffering(true);
          await new Promise((resolve) => (el.oncanplay = resolve));
        }
        if (mounted) {
          setIsBuffering(false);
          await el.play();
        }
      } catch (error) {
        console.warn("Video playback failed:", error);
      }
    };
    if (isInView) play();
    else el.pause();
    return () => {
      mounted = false;
      el.pause();
    };
  }, [isInView]);

  if (item.type === "video") {
    return (
      <div className={cn(className, "relative overflow-hidden")}>
        <video ref={videoRef} className="h-full w-full object-cover" onClick={onClick} playsInline muted loop preload="auto" style={{ opacity: isBuffering ? 0.8 : 1, transition: "opacity 0.2s" }}>
          <source src={item.url} type="video/mp4" />
        </video>
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.url} alt={item.title} className={cn(className, "cursor-pointer object-cover")} onClick={onClick} loading="lazy" decoding="async" draggable={false} />
  );
};

// GalleryModal displays the selected item full-size with a draggable thumbnail dock
interface GalleryModalProps {
  selectedItem: MediaItemType;
  onClose: () => void;
  setSelectedItem: (item: MediaItemType | null) => void;
  mediaItems: MediaItemType[];
}

export const GalleryModal = ({ selectedItem, onClose, setSelectedItem, mediaItems }: GalleryModalProps) => {
  const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 });

  // Escape closes; page scroll pauses while the modal is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const i = mediaItems.findIndex((m) => m.id === selectedItem.id);
        const next = mediaItems[(i + (e.key === "ArrowRight" ? 1 : -1) + mediaItems.length) % mediaItems.length];
        setSelectedItem(next);
      }
    };
    window.addEventListener("keydown", onKey);
    getLenis()?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      getLenis()?.start();
      document.body.style.overflow = prev;
    };
  }, [mediaItems, onClose, selectedItem.id, setSelectedItem]);

  // Portal to <body>: the page content sits in a z-10 stacking context below the fixed nav.
  return createPortal(
    <>
      {/* Main Modal */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={selectedItem.title}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-lg"
        onClick={onClose}
      >
        <div className="flex h-full flex-col">
          <div className="flex flex-1 items-center justify-center p-3 pb-28 md:p-8 md:pb-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedItem.id}
                className="relative max-h-[78vh] w-full max-w-[95%] overflow-hidden rounded-md border border-border bg-card shadow-2xl sm:max-w-[85%] md:max-w-4xl"
                initial={{ y: 20, scale: 0.97, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 } }}
                exit={{ y: 20, scale: 0.97, opacity: 0, transition: { duration: 0.15 } }}
                onClick={(e) => e.stopPropagation()}
              >
                <MediaItem item={selectedItem} className="max-h-[78vh] w-full object-contain" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 md:p-5">
                  <h3 className="font-display text-base font-semibold text-white sm:text-lg md:text-xl">{selectedItem.title}</h3>
                  {selectedItem.desc && <p className="mt-1 font-mono text-[11px] tracking-[0.14em] text-white/70 uppercase">{selectedItem.desc}</p>}
                  {selectedItem.link && (
                    <a
                      href={selectedItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="pointer-events-auto mt-3 inline-block rounded-full bg-primary px-4 py-1.5 font-mono text-[11px] tracking-[0.14em] text-primary-foreground uppercase"
                    >
                      Open PDF ↗
                    </a>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Close Button */}
        <motion.button
          type="button"
          aria-label="Close preview"
          className="absolute top-4 right-4 rounded-full border border-border bg-card/80 p-2.5 text-muted-foreground backdrop-blur-sm hover:text-foreground"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="h-4 w-4" />
        </motion.button>
      </motion.div>

      {/* Draggable Dock */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        initial={false}
        animate={{ x: dockPosition.x, y: dockPosition.y }}
        onDragEnd={(_, info) => setDockPosition((prev) => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }))}
        className="fixed bottom-4 left-1/2 z-[71] max-w-[94vw] -translate-x-1/2 touch-none"
      >
        <motion.div className="relative cursor-grab overflow-x-auto rounded-xl border border-border bg-card/70 shadow-lg backdrop-blur-xl active:cursor-grabbing">
          <div className="flex items-center -space-x-2 px-3 py-2">
            {mediaItems.map((item, index) => (
              <motion.div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                }}
                style={{ zIndex: selectedItem.id === item.id ? 30 : mediaItems.length - index }}
                className={cn(
                  "group relative h-8 w-8 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg hover:z-20 sm:h-9 sm:w-9 md:h-10 md:w-10",
                  selectedItem.id === item.id ? "shadow-lg ring-2 ring-primary" : "hover:ring-2 hover:ring-foreground/30",
                )}
                initial={{ rotate: index % 2 === 0 ? -15 : 15 }}
                animate={{
                  scale: selectedItem.id === item.id ? 1.2 : 1,
                  rotate: selectedItem.id === item.id ? 0 : index % 2 === 0 ? -15 : 15,
                  y: selectedItem.id === item.id ? -8 : 0,
                }}
                whileHover={{ scale: 1.3, rotate: 0, y: -10, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              >
                <MediaItem item={item} className="h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20" />
                {selectedItem.id === item.id && (
                  <motion.div layoutId="activeGlow" className="absolute -inset-2 bg-primary/20 blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </>,
    document.body,
  );
};

interface InteractiveBentoGalleryProps {
  mediaItems: MediaItemType[];
  title: string;
  description: string;
  /** Controlled selection, so other parts of the page (e.g. a timeline) can open the same preview. */
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
}

const InteractiveBentoGallery: React.FC<InteractiveBentoGalleryProps> = ({ mediaItems, title, description, selectedId, onSelectedIdChange }) => {
  const [localId, setLocalId] = useState<string | null>(null);
  const [items, setItems] = useState(mediaItems);
  const [isDragging, setIsDragging] = useState(false);
  const controlled = selectedId !== undefined;
  const currentId = controlled ? selectedId : localId;
  const select = (item: MediaItemType | null) => (controlled ? onSelectedIdChange?.(item?.id ?? null) : setLocalId(item?.id ?? null));
  const selectedItem = items.find((m) => m.id === currentId) ?? null;

  return (
    <div className="w-full">
      <div className="mb-8">
        <motion.h2
          className="font-display text-4xl font-bold tracking-tight md:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="meta mt-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {description}
        </motion.p>
      </div>
      <AnimatePresence>
        {selectedItem && <GalleryModal selectedItem={selectedItem} onClose={() => select(null)} setSelectedItem={select} mediaItems={items} />}
      </AnimatePresence>
      <motion.div
        className="grid grid-flow-row-dense auto-rows-[60px] grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layoutId={`media-${item.id}`}
            className={cn("relative cursor-move overflow-hidden rounded-md border border-border", item.span)}
            onClick={() => !isDragging && select(item)}
            variants={{
              hidden: { y: 50, scale: 0.9, opacity: 0 },
              visible: { y: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 350, damping: 25, delay: Math.min(index, 12) * 0.04 } },
            }}
            whileHover={{ scale: 1.02 }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_, info) => {
              setIsDragging(false);
              const moveDistance = info.offset.x + info.offset.y;
              if (Math.abs(moveDistance) > 50) {
                const newItems = [...items];
                const draggedItem = newItems[index];
                const targetIndex = moveDistance > 0 ? Math.min(index + 1, items.length - 1) : Math.max(index - 1, 0);
                newItems.splice(index, 1);
                newItems.splice(targetIndex, 0, draggedItem);
                setItems(newItems);
              }
            }}
          >
            <MediaItem item={item} className="absolute inset-0 h-full w-full" onClick={() => !isDragging && select(item)} />
            <motion.div className="absolute inset-0 flex flex-col justify-end p-2 sm:p-3 md:p-4" initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <h3 className="relative line-clamp-1 text-xs font-medium text-white sm:text-sm md:text-base">{item.title}</h3>
              <p className="relative mt-0.5 line-clamp-2 font-mono text-[10px] tracking-wider text-white/70 uppercase sm:text-xs">{item.desc}</p>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default InteractiveBentoGallery;
