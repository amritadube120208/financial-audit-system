"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

export interface DeckItem {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  risk_score: number;
  monetary_exposure: number | string;
  anomaly_type: string;
  evidence_count: number;
  primary_entity?: string;
}

interface FindingDeckProps {
  items: DeckItem[];
  activeRunId: string;
}

export function FindingDeck({ items, activeRunId }: FindingDeckProps) {
  const [deck, setDeck] = useState<DeckItem[]>(items);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length > 0) {
      setDeck(items);
    }
  }, [items]);

  const popTopCard = (direction: "left" | "right") => {
    if (deck.length <= 1) return;
    setDeck((prev) => {
      const top = prev[0];
      return [...prev.slice(1), top];
    });
    setDragOffset(0);
    setIsDragging(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (deck.length === 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startXRef.current;
    setDragOffset(diff);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    const deckWidth = deckRef.current?.offsetWidth || 340;
    const threshold = deckWidth * 0.12;

    if (dragOffset > threshold) {
      popTopCard("right");
    } else if (dragOffset < -threshold) {
      popTopCard("left");
    } else {
      setDragOffset(0);
      setIsDragging(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      popTopCard("right");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      popTopCard("left");
    }
  };

  if (deck.length === 0) {
    return (
      <div className="p-8 border border-[rgba(237,231,220,0.13)] bg-[#101317] text-center text-xs font-mono text-[#9EA5A8]">
        NO INVESTIGATION CARDS ACTIVE
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Interactive Deck Viewport */}
      <div
        ref={deckRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative h-[340px] w-full max-w-md mx-auto select-none focus:outline-none focus:ring-1 focus:ring-[#E8913C] rounded-sm"
        style={{ touchAction: "pan-y" }}
        aria-label="Physical audit findings deck. Use arrow keys or drag horizontally to throw cards."
      >
        {deck.slice(0, 4).map((card, idx) => {
          const isTop = idx === 0;
          const rotationOffset = isTop ? dragOffset * 0.06 : (idx % 2 === 0 ? idx * 2.5 : -idx * 2.5);
          const xOffset = isTop ? dragOffset : idx * 6;
          const yOffset = idx * 8;
          const scale = isTop ? (isDragging ? 1.02 : 1) : 1 - idx * 0.04;
          const opacity = 1 - idx * 0.18;

          return (
            <div
              key={card.id}
              onPointerDown={isTop ? handlePointerDown : undefined}
              onPointerMove={isTop ? handlePointerMove : undefined}
              onPointerUp={isTop ? handlePointerUp : undefined}
              onPointerCancel={isTop ? handlePointerUp : undefined}
              style={{
                transform: `translate3d(${xOffset}px, ${yOffset}px, 0) rotate(${rotationOffset}deg) scale(${scale})`,
                zIndex: 10 - idx,
                opacity,
                transition: isDragging && isTop ? "none" : "transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
              className={`absolute inset-0 p-6 rounded-sm bg-[#101317] border border-[rgba(237,231,220,0.16)] shadow-[0_18px_36px_rgba(0,0,0,0.65)] flex flex-col justify-between ${
                isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#9EA5A8]">
                    CASE 0{idx + 1} {"//"} {card.id}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-[0.12em] px-2 py-0.5 border ${
                    card.severity === "critical"
                      ? "text-[#E8913C] border-[#E8913C]/40 bg-[#E8913C]/10"
                      : "text-[#EDE7DC] border-[rgba(237,231,220,0.2)] bg-[#0A0C0E]"
                  }`}
                >
                  {card.severity}
                </span>
              </div>

              {/* Card Title & Anomaly Type */}
              <div className="space-y-2 my-auto">
                <span className="text-[11px] font-mono text-[#2E6B72] uppercase tracking-[0.12em] block">
                  DETECTOR: {card.anomaly_type.replace(/_/g, " ")}
                </span>
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#EDE7DC] leading-snug tracking-[-0.02em] line-clamp-2">
                  {card.title}
                </h3>
                {card.primary_entity && (
                  <p className="text-xs font-body text-[#9EA5A8] truncate">
                    Counterparty: <span className="text-[#EDE7DC]">{card.primary_entity}</span>
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-[rgba(237,231,220,0.1)] flex items-end justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-[0.12em] text-[#6C7378] block">
                    MONETARY EXPOSURE
                  </span>
                  <span className="font-display font-bold text-base sm:text-lg text-[#EDE7DC]">
                    {formatINR(card.monetary_exposure)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono tracking-[0.12em] text-[#6C7378] block">
                    RISK PRIORITY
                  </span>
                  <span className="font-mono font-bold text-base text-[#E8913C]">
                    {card.risk_score}<span className="text-xs text-[#6C7378]">/100</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deck Controls & Instructions */}
      <div className="flex items-center justify-between max-w-md mx-auto px-1 text-[11px] font-mono text-[#6C7378]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => popTopCard("left")}
            className="p-1.5 border border-[rgba(237,231,220,0.13)] hover:border-[#EDE7DC] text-[#9EA5A8] hover:text-[#EDE7DC] transition-colors"
            title="Throw left (Previous)"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => popTopCard("right")}
            className="p-1.5 border border-[rgba(237,231,220,0.13)] hover:border-[#EDE7DC] text-[#9EA5A8] hover:text-[#EDE7DC] transition-colors"
            title="Throw right (Next)"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <span>SWIPE / ARROW KEYS TO CYCLE</span>
        </div>

        <Link
          href={`/audit?run=${activeRunId}`}
          className="text-[#EDE7DC] hover:text-[#E8913C] inline-flex items-center gap-1 transition-colors"
        >
          VIEW ALL CASES <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
