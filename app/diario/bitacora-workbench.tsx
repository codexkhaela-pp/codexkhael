"use client";

import { useRouter } from "next/navigation";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthSession } from "@/lib/use-auth-session";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { tarotCards, type TarotCard } from "@/src/data/tarotCards";
import { JOURNAL_SPREADS } from "@/app/diario/spreads";
import { createJournalEntryInApi } from "@/app/diario/api-client";
import { canUseSpread } from "@/lib/features";
import type {
  JournalCardPlacement,
  JournalCanvasSnapshot,
  JournalEntry,
  JournalFlipEvent,
  JournalFlipStat,
  JournalReadingMetadata,
  JournalReadingReflection,
  JournalSpreadDefinition,
  JournalSpreadPosition,
} from "@/app/diario/types";

const FREE_CANVAS_DROP_ID = "journal-free-canvas";
const TRAY_DROP_ID = "journal-tray";

const CARD_WIDTH_MIN = 78;
const CARD_WIDTH_MAX = 112;
const CARD_RATIO = 4.75 / 2.75;

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function buildInitialMetadata(spreadName: string): JournalReadingMetadata {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return {
    consultantName: "",
    date,
    time,
    place: "",
    emotionalState: "",
    spreadType: spreadName,
    question: "",
  };
}

function buildEmptyReflection(): JournalReadingReflection {
  return {
    personalInterpretation: "",
    finalMessage: "",
    suggestedAction: "",
  };
}

function getSpreadById(id: string): JournalSpreadDefinition {
  return JOURNAL_SPREADS.find((spread) => spread.id === id) ?? JOURNAL_SPREADS[0];
}

function pickKeywords(card: TarotCard, isReversed: boolean): string[] {
  const raw = isReversed ? card.keywordsReversed : card.keywordsUpright;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getCanvasDropPosition(event: DragEndEvent, container: HTMLElement) {
  const initialRect = event.active.rect.current.initial;
  const translatedRect = event.active.rect.current.translated;
  const sourceRect = translatedRect ?? initialRect;

  if (!sourceRect) {
    return { x: 16, y: 16 };
  }

  const canvasRect = container.getBoundingClientRect();
  const width = clamp(sourceRect.width, CARD_WIDTH_MIN, CARD_WIDTH_MAX);
  const height = width * CARD_RATIO;

  const centerX = sourceRect.left + sourceRect.width / 2;
  const centerY = sourceRect.top + sourceRect.height / 2;

  const x = clamp(centerX - canvasRect.left - width / 2, 0, Math.max(0, canvasRect.width - width));
  const y = clamp(centerY - canvasRect.top - height / 2, 0, Math.max(0, canvasRect.height - height));

  return { x: Math.round(x), y: Math.round(y) };
}

type ActiveDragPayload =
  | {
      origin: "tray";
      card?: TarotCard;
    }
  | {
      origin: "canvas";
      placementId: string;
      card?: TarotCard;
    };

type DragGroupState = {
  activeId: string;
  ids: string[];
  originById: Record<string, { x: number; y: number }>;
};

interface SpreadDropdownProps {
  spreadId: string;
  onSelect: (spreadId: string) => void;
  currentPlan: string | null;
}

function SpreadDropdown({ spreadId, onSelect, currentPlan }: SpreadDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedSpread = JOURNAL_SPREADS.find((spread) => spread.id === spreadId) ?? JOURNAL_SPREADS[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!dropdownRef.current) {
        return;
      }

      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} className="deck-dropdown journal-spread-dropdown">
      <button
        type="button"
        className="deck-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selectedSpread.name}</span>
        <span className={`deck-chevron${isOpen ? " deck-chevron-open" : ""}`}>v</span>
        </button>
        {isOpen ? (
          <ul className="deck-menu" role="listbox" aria-label="Seleccionar tipo de tirada">
          {JOURNAL_SPREADS.filter((option) => currentPlan && canUseSpread(currentPlan, option.id)).map((option) => (
              <li key={option.id}>
                <button
                type="button"
                className={`deck-option${spreadId === option.id ? " deck-option-active" : ""}`}
                onClick={() => {
                  onSelect(option.id);
                  setIsOpen(false);
                }}
              >
                {option.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

interface TrayCardProps {
  card: TarotCard;
}

function TrayCard({ card }: TrayCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tray-${card.id}`,
    data: {
      origin: "tray",
      card,
    } satisfies ActiveDragPayload,
  });

  const style = transform
    ? {
        transform: `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`,
      }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`journal-tray-card${isDragging ? " is-dragging" : ""}`}
      style={style}
      {...listeners}
      {...attributes}
    >
      <span className="journal-card">
        <img src={card.image} alt={card.nameEs} />
      </span>
      <span className="journal-tray-card-title">{card.nameEs}</span>
    </button>
  );
}

interface PositionSlotProps {
  position: JournalSpreadPosition;
  isOver?: boolean;
  children?: React.ReactNode;
}

function PositionSlot({ position, isOver, children }: PositionSlotProps) {
  return (
    <article className={`journal-position-slot${isOver ? " is-over" : ""}`}>
      <header>
        <h3>{position.name}</h3>
        {position.subtitle && <p>{position.subtitle}</p>}
      </header>
      <div className="journal-position-body">{children}</div>
    </article>
  );
}

interface DroppablePositionProps {
  position: JournalSpreadPosition;
  children?: React.ReactNode;
}

function DroppablePosition({ position, children }: DroppablePositionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${position.id}` });

  return (
    <div
      ref={setNodeRef}
      className="journal-grid-position"
      style={{
        gridRow: position.row,
        gridColumn: position.column,
      }}
    >
      <PositionSlot position={position} isOver={isOver}>
        {children}
      </PositionSlot>
    </div>
  );
}

interface PlacedCardProps {
  placement: JournalCardPlacement;
  spreadType: string;
  isFlipped: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  keywords: string[];
  onFlipToBack: (placement: JournalCardPlacement) => void;
  onFlipToFront: (placementId: string) => void;
  onRotate: (placementId: string) => void;
  onToggleSelected?: (placementId: string) => void;
}

function PlacedCard({
  placement,
  spreadType,
  isFlipped,
  isSelected = false,
  selectionMode = false,
  keywords,
  onFlipToBack,
  onFlipToFront,
  onRotate,
  onToggleSelected,
}: PlacedCardProps) {
  const card = tarotCards.find((item) => item.id === placement.cardId);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `placed-${placement.id}`,
    data: {
      origin: "canvas",
      placementId: placement.id,
      card,
    } satisfies ActiveDragPayload,
  });

  if (!card) {
    return null;
  }

  const style = transform
    ? {
        transform: `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`,
      }
    : undefined;

  function handleCardPrimaryAction() {
    if (selectionMode) {
      onToggleSelected?.(placement.id);
      return;
    }

    if (isFlipped) {
      onFlipToFront(placement.id);
      return;
    }

    onFlipToBack(placement);
  }

  function handleRotate(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onRotate(placement.id);
  }

  return (
    <article
      ref={setNodeRef}
      className={`journal-placement${isDragging ? " is-dragging" : ""}${isSelected ? " is-selected" : ""}`}
      style={style}
      {...listeners}
      {...attributes}
    >
      <button type="button" className="journal-card-rotate-toggle" onClick={handleRotate}>
        Girar
      </button>
      <button type="button" className="journal-card journal-flip-card" onClick={handleCardPrimaryAction}>
        <div className={`journal-flip-inner${isFlipped ? " is-flipped" : ""}`}>
          <div className="journal-flip-face journal-flip-front">
            <img src={placement.image} alt={placement.cardName} className={placement.isReversed ? "is-reversed" : ""} />
          </div>
          <div className="journal-flip-face journal-flip-back">
            <div className="journal-flip-back-content">
              <strong>{placement.cardName}</strong>
              <span>{placement.isReversed ? "Invertida" : "Derecha"}</span>
              <small>{keywords.join(", ")}</small>
              <small>{placement.positionName ? `Posicion: ${placement.positionName}` : `Modo: ${spreadType}`}</small>
            </div>
          </div>
        </div>
      </button>
    </article>
  );
}

function getGridTemplate(positions: JournalSpreadPosition[]) {
  const maxRow = Math.max(...positions.map((position) => position.row ?? 1), 1);
  const maxColumn = Math.max(...positions.map((position) => position.column ?? 1), 1);

  return {
    rows: maxRow,
    cols: maxColumn,
  };
}

function buildEntryPayload(params: {
  entryId: string;
  metadata: JournalReadingMetadata;
  canvas: JournalCanvasSnapshot;
  reflection: JournalReadingReflection;
  flipStats: JournalFlipStat[];
  flipEvents: JournalFlipEvent[];
  rereadings: JournalEntry["rereadings"];
  createdAt: string;
}): JournalEntry {
  return {
    id: params.entryId,
    metadata: params.metadata,
    canvas: params.canvas,
    reflection: params.reflection,
    flipStats: params.flipStats,
    rereadings: params.rereadings,
    flipEvents: params.flipEvents,
    createdAt: params.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

function normalizePlacementsForSpread(
  previousPlacements: JournalCardPlacement[],
  spread: JournalSpreadDefinition,
): JournalCardPlacement[] {
  if (spread.mode === "free") {
    return previousPlacements.map((placement, index) => ({
      ...placement,
      positionId: undefined,
      positionName: undefined,
      x: placement.x ?? 24 + (index % 4) * 28,
      y: placement.y ?? 24 + Math.floor(index / 4) * 32,
    }));
  }

  const openPositions = [...spread.positions];
  const normalized: JournalCardPlacement[] = [];

  for (const placement of previousPlacements.slice(0, spread.positions.length)) {
    const exact = openPositions.find((position) => position.id === placement.positionId);
    const target = exact ?? openPositions.shift();

    if (!target) {
      continue;
    }

    normalized.push({
      ...placement,
      positionId: target.id,
      positionName: target.name,
      x: target.column ? (target.column - 1) * 140 : 0,
      y: target.row ? (target.row - 1) * 220 : 0,
    });
  }

  return normalized;
}

type BitacoraWorkbenchProps = {
  onSaved?: (entry: JournalEntry) => void;
  onBack?: () => void;
};

export function BitacoraWorkbench({ onSaved, onBack }: BitacoraWorkbenchProps) {
  const initialSpread = JOURNAL_SPREADS[0];
  const [entryId] = useState(() => makeId("journal-entry"));
  const [createdAt] = useState(() => new Date().toISOString());
  const [selectedSpreadId, setSelectedSpreadId] = useState(initialSpread.id);
  const [metadata, setMetadata] = useState<JournalReadingMetadata>(() => buildInitialMetadata(initialSpread.name));
  const [reflection, setReflection] = useState<JournalReadingReflection>(buildEmptyReflection);
  const [placements, setPlacements] = useState<JournalCardPlacement[]>([]);
  const [flippedPlacementIds, setFlippedPlacementIds] = useState<string[]>([]);
  const [interpretationResult, setInterpretationResult] = useState<any | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretationError, setInterpretationError] = useState<string | null>(null);
  const [flipStats, setFlipStats] = useState<JournalFlipStat[]>([]);
  const [flipEvents, setFlipEvents] = useState<JournalFlipEvent[]>([]);
  const [activeDragCard, setActiveDragCard] = useState<TarotCard | null>(null);
  const [activeDragOrigin, setActiveDragOrigin] = useState<"tray" | "canvas" | null>(null);
  const [dragGroup, setDragGroup] = useState<DragGroupState | null>(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPlacementIds, setSelectedPlacementIds] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [trayQuery, setTrayQuery] = useState("");
  const authSession = useAuthSession();
  const router = useRouter();
  const currentPlan = authSession.plan;

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const spread = useMemo(() => getSpreadById(selectedSpreadId), [selectedSpreadId]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
  );

  const usedCardIds = useMemo(() => new Set(placements.map((placement) => placement.cardId)), [placements]);
  const trayCards = useMemo(
    () => tarotCards.filter((card) => card.deck === "rider-waite" && !usedCardIds.has(card.id)),
    [usedCardIds],
  );

  const filteredTrayCards = useMemo(() => {
    const query = trayQuery.trim().toLowerCase();
    if (!query) {
      return trayCards;
    }

    return trayCards.filter((card) =>
      `${card.nameEs} ${card.nameEn} ${card.slug}`.toLowerCase().includes(query),
    );
  }, [trayCards, trayQuery]);

  const placementsByPosition = useMemo(() => {
    const map = new Map<string, JournalCardPlacement>();
    for (const placement of placements) {
      if (placement.positionId) {
        map.set(placement.positionId, placement);
      }
    }
    return map;
  }, [placements]);

  const gridTemplate = useMemo(() => getGridTemplate(spread.positions), [spread.positions]);

  function updateSpread(spreadId: string) {
    const nextSpread = getSpreadById(spreadId);
    setSelectedSpreadId(spreadId);
    setMetadata((previous) => ({
      ...previous,
      spreadType: nextSpread.name,
    }));
    setPlacements((previous) => normalizePlacementsForSpread(previous, nextSpread));
    setFlippedPlacementIds([]);
    setSelectedPlacementIds([]);
    setSelectionMode(false);
    setDragGroup(null);
    setDragDelta({ x: 0, y: 0 });
  }

  function addPlacementFromCard(card: TarotCard, targetPosition?: JournalSpreadPosition, coords?: { x: number; y: number }) {
    const id = makeId("placement");
    const fallbackX = targetPosition?.column ? (targetPosition.column - 1) * 140 : 0;
    const fallbackY = targetPosition?.row ? (targetPosition.row - 1) * 220 : 0;
    const nextPlacement: JournalCardPlacement = {
      id,
      cardId: card.id,
      cardName: card.nameEs,
      image: card.image,
      isReversed: false,
      positionId: targetPosition?.id,
      positionName: targetPosition?.name,
      x: coords?.x ?? fallbackX,
      y: coords?.y ?? fallbackY,
      order: placements.length,
    };

    setPlacements((previous) => [...previous, nextPlacement]);
  }

  function removePlacement(placementId: string) {
    setPlacements((previous) => previous.filter((placement) => placement.id !== placementId));
    setFlippedPlacementIds((previous) => previous.filter((id) => id !== placementId));
    setSelectedPlacementIds((previous) => previous.filter((id) => id !== placementId));
  }

  function togglePlacementSelection(placementId: string) {
    setSelectedPlacementIds((previous) =>
      previous.includes(placementId) ? previous.filter((id) => id !== placementId) : [...previous, placementId],
    );
  }

  function togglePlacementRotation(placementId: string) {
    setPlacements((previous) =>
      previous.map((placement) =>
        placement.id === placementId
          ? {
              ...placement,
              isReversed: !placement.isReversed,
            }
          : placement,
      ),
    );
  }

  function registerFlipToBack(placement: JournalCardPlacement) {
    const event: JournalFlipEvent = {
      journalEntryId: entryId,
      cardId: placement.cardId,
      cardName: placement.cardName,
      positionId: placement.positionId,
      positionName: placement.positionName,
      spreadType: spread.name,
      flippedAt: new Date(),
    };

    setFlipEvents((previous) => [...previous, event]);
    setFlippedPlacementIds((previous) => [...previous, placement.id]);
    setFlipStats((previous) => {
      const index = previous.findIndex((item) => item.cardId === placement.cardId);
      const positionKey = placement.positionId ?? "free-canvas";

      if (index === -1) {
        return [
          ...previous,
          {
            cardId: placement.cardId,
            cardName: placement.cardName,
            totalFlips: 1,
            positions: {
              [positionKey]: 1,
            },
          },
        ];
      }

      const clone = [...previous];
      const current = clone[index];
      clone[index] = {
        ...current,
        totalFlips: current.totalFlips + 1,
        positions: {
          ...current.positions,
          [positionKey]: (current.positions[positionKey] ?? 0) + 1,
        },
      };

      return clone;
    });
  }

  function registerFlipToFront(placementId: string) {
    setFlippedPlacementIds((previous) => previous.filter((id) => id !== placementId));
  }

  function clearDragState() {
    setActiveDragCard(null);
    setActiveDragOrigin(null);
    setDragGroup(null);
    setDragDelta({ x: 0, y: 0 });
  }

  function onDragCancel() {
    clearDragState();
  }

  function onDragStart(event: DragStartEvent) {
    const payload = event.active.data.current as ActiveDragPayload | undefined;
    if (!payload) {
      return;
    }

    setActiveDragOrigin(payload.origin);
    setActiveDragCard(payload.card ?? null);
    setDragDelta({ x: 0, y: 0 });

    if (spread.mode === "free" && payload.origin === "canvas") {
      const groupedIds =
        selectedPlacementIds.includes(payload.placementId) && selectedPlacementIds.length > 0
          ? selectedPlacementIds
          : [payload.placementId];

      const originById: Record<string, { x: number; y: number }> = {};
      for (const placement of placements) {
        if (groupedIds.includes(placement.id)) {
          originById[placement.id] = {
            x: placement.x ?? 16,
            y: placement.y ?? 16,
          };
        }
      }

      setSelectedPlacementIds(groupedIds);
      setDragGroup({
        activeId: payload.placementId,
        ids: groupedIds,
        originById,
      });
      return;
    }

    setDragGroup(null);
  }

  function onDragMove(event: DragMoveEvent) {
    if (spread.mode !== "free" || !dragGroup) {
      return;
    }

    if (!event?.delta || typeof event.delta.x !== "number" || typeof event.delta.y !== "number") {
      return;
    }

    setDragDelta({
      x: Math.round(event.delta.x),
      y: Math.round(event.delta.y),
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const payload = event.active.data.current as ActiveDragPayload | undefined;
    const overId = event.over?.id ? String(event.over.id) : "";
    const dragGroupSnapshot = dragGroup;
    const dragDeltaSnapshot = dragDelta;

    if (!payload || !overId) {
      clearDragState();
      return;
    }

    if (spread.mode === "fixed") {
      if (overId === TRAY_DROP_ID && payload.origin === "canvas") {
        removePlacement(payload.placementId);
        clearDragState();
        return;
      }

      if (!overId.startsWith("slot-")) {
        clearDragState();
        return;
      }

      const positionId = overId.slice(5);
      const targetPosition = spread.positions.find((position) => position.id === positionId);
      if (!targetPosition) {
        clearDragState();
        return;
      }

      if (payload.origin === "tray") {
        if (!payload.card) {
          return;
        }
        const draggedCard = payload.card;
        setPlacements((previous) => {
          const existingAtSlot = previous.find((placement) => placement.positionId === positionId);
          const cleaned = previous.filter((placement) => placement.positionId !== positionId);
          const nextPlacement: JournalCardPlacement = {
            id: makeId("placement"),
            cardId: draggedCard.id,
            cardName: draggedCard.nameEs,
            image: draggedCard.image,
            isReversed: false,
            positionId,
            positionName: targetPosition.name,
            x: targetPosition.column ? (targetPosition.column - 1) * 140 : 0,
            y: targetPosition.row ? (targetPosition.row - 1) * 220 : 0,
            order: previous.length,
          };

          if (!existingAtSlot) {
            return [...cleaned, nextPlacement];
          }

          return [...cleaned.filter((placement) => placement.id !== existingAtSlot.id), nextPlacement];
        });
        clearDragState();
        return;
      }

      if (payload.origin === "canvas") {
        setPlacements((previous) => {
          const dragged = previous.find((placement) => placement.id === payload.placementId);
          if (!dragged) {
            return previous;
          }

          const occupying = previous.find((placement) => placement.positionId === positionId && placement.id !== dragged.id);

          return previous.map((placement) => {
            if (placement.id === dragged.id) {
              return {
                ...placement,
                positionId,
                positionName: targetPosition.name,
                x: targetPosition.column ? (targetPosition.column - 1) * 140 : 0,
                y: targetPosition.row ? (targetPosition.row - 1) * 220 : 0,
              };
            }

            if (occupying && placement.id === occupying.id) {
              return {
                ...placement,
                positionId: dragged.positionId,
                positionName: dragged.positionName,
              };
            }

            return placement;
          });
        });
      }

      clearDragState();
      return;
    }

    if (spread.mode === "free") {
      if (overId === TRAY_DROP_ID && payload.origin === "canvas") {
        removePlacement(payload.placementId);
        clearDragState();
        return;
      }

      if (overId !== FREE_CANVAS_DROP_ID) {
        clearDragState();
        return;
      }

      if (payload.origin === "tray") {
        const container = canvasRef.current;
        if (!container) {
          clearDragState();
          return;
        }

        const coords = getCanvasDropPosition(event, container);
        if (!payload.card) {
          clearDragState();
          return;
        }
        addPlacementFromCard(payload.card, undefined, coords);
        clearDragState();
        return;
      }

      if (payload.origin === "canvas") {
        if (dragGroupSnapshot && dragGroupSnapshot.ids.includes(payload.placementId)) {
          const container = canvasRef.current;
          const canvasRect = container?.getBoundingClientRect();
          const maxX = Math.max(0, (canvasRect?.width ?? 0) - CARD_WIDTH_MAX);
          const maxY = Math.max(0, (canvasRect?.height ?? 0) - CARD_WIDTH_MAX * CARD_RATIO);

          setPlacements((previous) =>
            previous.map((placement) => {
              if (!dragGroupSnapshot.ids.includes(placement.id)) {
                return placement;
              }

              const origin = dragGroupSnapshot.originById[placement.id];
              if (!origin) {
                return placement;
              }

              return {
                ...placement,
                x: clamp(origin.x + dragDeltaSnapshot.x, 0, maxX),
                y: clamp(origin.y + dragDeltaSnapshot.y, 0, maxY),
              };
            }),
          );
        } else {
          const container = canvasRef.current;
          if (!container) {
            clearDragState();
            return;
          }

          const coords = getCanvasDropPosition(event, container);
          setPlacements((previous) =>
            previous.map((placement) =>
              placement.id === payload.placementId
                ? {
                    ...placement,
                    x: coords.x,
                    y: coords.y,
                  }
                : placement,
            ),
          );
        }
      }

      clearDragState();
    }
  }

  function serializePlacements(): JournalCardPlacement[] {
    return placements.map((placement, index) => {
      const spreadPosition = spread.positions.find((position) => position.id === placement.positionId);
      const fallbackX = spreadPosition?.column ? (spreadPosition.column - 1) * 140 : 0;
      const fallbackY = spreadPosition?.row ? (spreadPosition.row - 1) * 220 : 0;

      return {
        ...placement,
        x: typeof placement.x === "number" ? placement.x : fallbackX,
        y: typeof placement.y === "number" ? placement.y : fallbackY,
        order: index,
      };
    });
  }

  function buildCanvasSnapshot(): JournalCanvasSnapshot {
    return {
      spreadType: spread.name,
      spreadId: spread.id,
      canvasWidth: canvasRef.current?.clientWidth,
      canvasHeight: canvasRef.current?.clientHeight,
      placements: serializePlacements(),
    };
  }

  async function persistEntry() {
    const payload = buildEntryPayload({
      entryId,
      metadata,
      canvas: buildCanvasSnapshot(),
      reflection,
      flipStats,
      flipEvents,
      rereadings: [],
      createdAt,
    });

    try {
      const placementsWithMeaning = payload.canvas.placements.map((placement) => {
        const card = tarotCards.find((item) => item.id === placement.cardId);
        const meaningUsed = placement.isReversed ? card?.keywordsReversed ?? "" : card?.keywordsUpright ?? "";
        return {
          ...placement,
          orientation: placement.isReversed ? ("invertida" as const) : ("derecha" as const),
          rotation: placement.isReversed ? 180 : 0,
          meaningUsed,
        };
      });

      const savedEntry = await createJournalEntryInApi({
        metadata: payload.metadata,
        reflection: payload.reflection,
        canvas: {
          ...payload.canvas,
          placements: placementsWithMeaning,
        },
        flipStats: payload.flipStats,
        flipEvents: payload.flipEvents,
        notes: payload.reflection.personalInterpretation,
        createdAt: payload.createdAt,
      });

      setSaveMessage("Entrada guardada en base de datos.");
      onSaved?.(savedEntry);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudo guardar la entrada.";
      if (msg === "LIMIT_REACHED") {
        setSaveMessage("Has alcanzado el límite de bitácoras de tu plan. Mejora a Básico o Pro.");
      } else {
        setSaveMessage(msg);
      }
    }
  }

  async function handleInterpret() {
    if (placements.length === 0) {
      alert("Coloca al menos una carta para interpretar.");
      return;
    }

    setIsInterpreting(true);
    setInterpretationError(null);
    setInterpretationResult(null);

    try {
      const response = await fetch("/api/tiradas/interpretar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: metadata.question || null,
          cards: placements.map((p) => ({
            cardId: p.cardId,
            name: p.cardName,
            orientation: p.isReversed ? "REVERSED" : "UPRIGHT",
            positionName: p.positionName || null,
            order: p.order,
          })),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Error al obtener la interpretación.");
      }

      const data = await response.json();
      setInterpretationResult(data);
    } catch (err: any) {
      console.error("Error al interpretar tirada:", err);
      setInterpretationError(err.message || "Error interno al conectar con los astros.");
    } finally {
      setIsInterpreting(false);
    }
  }

  return (
    <section className="journal-tool" aria-label="Diario / Bitácora">
      <div className="journal-topbar">
        <article className="journal-metadata-panel">
          <h2>Datos básicos</h2>
          <div className="journal-form-grid journal-metadata-grid">
            <label>
              Consultante
              <input
                value={metadata.consultantName}
                onChange={(event) => setMetadata((prev) => ({ ...prev, consultantName: event.target.value }))}
              />
            </label>
            <label>
              Fecha
              <input
                type="date"
                value={metadata.date}
                onChange={(event) => setMetadata((prev) => ({ ...prev, date: event.target.value }))}
              />
            </label>
            <label>
              Hora
              <input
                type="time"
                value={metadata.time}
                onChange={(event) => setMetadata((prev) => ({ ...prev, time: event.target.value }))}
              />
            </label>
            <label>
              Lugar
              <input value={metadata.place} onChange={(event) => setMetadata((prev) => ({ ...prev, place: event.target.value }))} />
            </label>
            <label className="journal-metadata-emotion">
              Estado emocional
              <input
                value={metadata.emotionalState}
                onChange={(event) => setMetadata((prev) => ({ ...prev, emotionalState: event.target.value }))}
              />
            </label>
            <div className="journal-dropdown-field journal-metadata-spread">
              <span>Tipo de tirada</span>
              <SpreadDropdown spreadId={selectedSpreadId} onSelect={updateSpread} currentPlan={currentPlan} />
            </div>
            <label className="journal-metadata-question">
              Pregunta / tema
              <input
                value={metadata.question ?? ""}
                onChange={(event) => setMetadata((prev) => ({ ...prev, question: event.target.value }))}
              />
            </label>
          </div>
        </article>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="journal-compose-grid">
          <div className="journal-compose-left">
            <section className="journal-canvas-shell" aria-label="Mapa de tirada">
              <header>
                <h2>Mapa de tirada</h2>
                <p>
                  {spread.mode === "free"
                    ? "Modo libre: arrastra cartas y sueltalas en cualquier zona del mapa."
                    : "Arrastra cartas desde la bandeja y sueltalas en las posiciones de la tirada."}
                </p>
                {spread.mode === "free" ? (
                  <div className="journal-selection-controls">
                    <button
                      type="button"
                      className={`btn btn-secondary${selectionMode ? " journal-btn-active" : ""}`}
                      onClick={() => {
                        if (selectionMode) {
                          setSelectedPlacementIds([]);
                        }
                        setSelectionMode(!selectionMode);
                      }}
                    >
                      {selectionMode ? "Seleccion multiple activa" : "Activar seleccion multiple"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedPlacementIds([])}
                      disabled={selectedPlacementIds.length === 0}
                    >
                      Limpiar seleccion
                    </button>
                  </div>
                ) : null}
              </header>

              <div className="journal-canvas">
                {spread.mode === "fixed" ? (
                  <div
                    className="journal-fixed-grid"
                    style={{
                      gridTemplateColumns: `repeat(${gridTemplate.cols}, minmax(120px, 1fr))`,
                      gridTemplateRows: `repeat(${gridTemplate.rows}, auto)`,
                    }}
                  >
                    {spread.positions.map((position) => {
                      const placement = placementsByPosition.get(position.id);
                      const flipped = placement ? flippedPlacementIds.includes(placement.id) : false;

                      return (
                        <DroppablePosition key={position.id} position={position}>
                          {placement ? (
                            <PlacedCard
                              placement={placement}
                              spreadType={spread.name}
                              isFlipped={flipped}
                              isSelected={selectedPlacementIds.includes(placement.id)}
                              selectionMode={selectionMode && spread.mode === "free"}
                              keywords={pickKeywords(
                                tarotCards.find((card) => card.id === placement.cardId) ?? tarotCards[0],
                                placement.isReversed,
                              )}
                              onFlipToBack={registerFlipToBack}
                              onFlipToFront={registerFlipToFront}
                              onRotate={togglePlacementRotation}
                              onToggleSelected={togglePlacementSelection}
                            />
                          ) : (
                            <div className="journal-slot-placeholder">Suelta aqui</div>
                          )}
                        </DroppablePosition>
                      );
                    })}
                  </div>
                ) : (
                  <FreeCanvas
                    canvasRef={canvasRef}
                    placements={placements}
                    spreadName={spread.name}
                    flippedPlacementIds={flippedPlacementIds}
                    selectedPlacementIds={selectedPlacementIds}
                    selectionMode={selectionMode}
                    dragGroup={dragGroup}
                    dragDelta={dragDelta}
                    onFlipToBack={registerFlipToBack}
                    onFlipToFront={registerFlipToFront}
                    onRotate={togglePlacementRotation}
                    onToggleSelected={togglePlacementSelection}
                  />
                )}
              </div>
            </section>

            <section className="journal-reflection-panel" aria-label="Registro interpretativo">
              <h2>Reflexión personal</h2>
              <div className="journal-reflection-grid journal-reflection-grid-compact">
                <label className="journal-reflection-wide">
                  Interpretación personal
                  <textarea
                    className="journal-textarea-main"
                    value={reflection.personalInterpretation}
                    onChange={(event) => setReflection((prev) => ({ ...prev, personalInterpretation: event.target.value }))}
                  />
                </label>
                <label>
                  Mensaje final / conclusión
                  <textarea
                    className="journal-textarea-compact"
                    value={reflection.finalMessage}
                    onChange={(event) => setReflection((prev) => ({ ...prev, finalMessage: event.target.value }))}
                  />
                </label>
                <label>
                  Acción o consejo
                  <textarea
                    className="journal-textarea-compact"
                    value={reflection.suggestedAction}
                    onChange={(event) => setReflection((prev) => ({ ...prev, suggestedAction: event.target.value }))}
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="journal-side-panel">
            <TrayDroppable>
              <h2>Bandeja / mazo de cartas</h2>
              <input
                type="text"
                placeholder="Buscar carta..."
                value={trayQuery}
                onChange={(event) => setTrayQuery(event.target.value)}
                className="journal-tray-search"
              />
              <p>
                Cartas visibles: {filteredTrayCards.length} / {trayCards.length}
              </p>
              <div className="cards-grid">
                {filteredTrayCards.map((card) => (
                  <TrayCard key={card.id} card={card} />
                ))}
              </div>
            </TrayDroppable>
          </aside>
        </div>

        <DragOverlay>
          {activeDragCard && activeDragOrigin === "tray" ? (
            <div className="journal-card journal-overlay-card">
              <img src={activeDragCard.image} alt={activeDragCard.nameEs} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <section className="journal-footer-actions">
        <div className="journal-save-actions">
          <button type="button" className="btn btn-primary" onClick={persistEntry}>
            Guardar entrada
          </button>
          {spread.id === "free" && (
            <button
              type="button"
              className="btn btn-primary"
              style={{
                background: "linear-gradient(135deg, #c9a66b, #af8a4a)",
                color: "#141118",
                border: "none",
                fontWeight: "bold",
                boxShadow: "0 4px 14px rgba(201, 166, 107, 0.3)",
                marginLeft: "8px",
              }}
              onClick={handleInterpret}
            >
              ✨ Interpretar tirada
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onBack} style={{ marginLeft: "8px" }}>
            Volver al historial
          </button>
          {saveMessage && <p>{saveMessage}</p>}
        </div>
      </section>

      {/* Modal de Lectura Guiada */}
      {interpretationResult && (
        <div className="card-modal-backdrop" style={{ zIndex: 90 }} onClick={() => setInterpretationResult(null)}>
          <div className="card-modal" style={{ width: "min(680px, 95vw)", maxWidth: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", padding: "20px" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-modal-header" style={{ paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h3 style={{ fontSize: "22px", color: "#f0dcae" }}>✨ Lectura Guiada PRO</h3>
                <p className="card-modal-subtitle" style={{ margin: "4px 0 0 0" }}>Interpretación automatizada local de tu tirada libre</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary card-modal-close"
                onClick={() => setInterpretationResult(null)}
                style={{ borderRadius: "50%", width: "36px", height: "36px", padding: 0, display: "grid", placeItems: "center" }}
              >
                ✕
              </button>
            </div>
            
            <div className="card-modal-body" style={{ overflowY: "auto", flex: 1, paddingRight: "8px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Tono dominante */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <strong style={{ fontSize: "14px" }}>Tono dominante:</strong>
                <span className="interpretation-tone-pill-active" style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", background: "rgba(201, 166, 107, 0.15)", color: "#e8c789", border: "1px solid rgba(201, 166, 107, 0.3)", fontWeight: "bold" }}>
                  {interpretationResult.dominantTone}
                </span>
              </div>

              {/* Resumen */}
              <div style={{ background: "rgba(201, 166, 107, 0.05)", borderLeft: "4px solid #c9a66b", padding: "14px", borderRadius: "0 12px 12px 0" }}>
                <h4 style={{ color: "#e8c789", margin: "0 0 6px 0", fontSize: "15px" }}>Resumen General</h4>
                <p style={{ margin: 0, color: "rgba(231, 227, 242, 0.9)", fontSize: "14px", lineHeight: "1.6" }}>{interpretationResult.summary}</p>
              </div>

              {/* Carta por carta */}
              <div>
                <h4 style={{ color: "#e8c789", margin: "0 0 12px 0", fontSize: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "6px" }}>Interpretación Carta por Carta</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {interpretationResult.cards.map((c: any, i: number) => {
                    const matchingPlacement = placements.find(p => p.cardName === c.name);
                    const cardImg = matchingPlacement?.image || "/tarot/the_fool.jpg";
                    const isReversed = c.orientation === "Invertida";
                    
                    return (
                      <div key={i} style={{ display: "flex", gap: "14px", flexWrap: "wrap", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "12px" }}>
                        <div style={{ width: "50px", flexShrink: 0, height: "86px", overflow: "hidden", borderRadius: "6px", border: "1px solid rgba(201, 166, 107, 0.3)" }}>
                          <img src={cardImg} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", transform: isReversed ? "rotate(180deg)" : "none" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", gap: "8px", flexWrap: "wrap" }}>
                            <strong style={{ fontSize: "14px", color: "#f4ead3" }}>{i + 1}. {c.name}</strong>
                            <span style={{ 
                              fontSize: "11px", 
                              padding: "2px 8px", 
                              borderRadius: "12px", 
                              background: isReversed ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                              color: isReversed ? "#ef4444" : "#22c55e",
                              border: `1px solid ${isReversed ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
                              fontWeight: "bold"
                            }}>
                              {c.orientation}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: "rgba(231, 227, 242, 0.85)", fontSize: "13.5px", lineHeight: "1.5" }}>{c.interpretation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conexiones */}
              <div style={{ background: "rgba(34, 197, 94, 0.03)", border: "1px solid rgba(34, 197, 94, 0.15)", padding: "14px", borderRadius: "12px" }}>
                <h4 style={{ color: "#86efac", margin: "0 0 6px 0", fontSize: "15px" }}>Relaciones y Elementos</h4>
                <p style={{ margin: 0, color: "rgba(231, 227, 242, 0.9)", fontSize: "14px", lineHeight: "1.6" }}>{interpretationResult.connections}</p>
              </div>

              {/* Bloqueos */}
              <div style={{ background: "rgba(239, 68, 68, 0.03)", border: "1px solid rgba(239, 68, 68, 0.15)", padding: "14px", borderRadius: "12px" }}>
                <h4 style={{ color: "#fca5a5", margin: "0 0 6px 0", fontSize: "15px" }}>Posibles Bloqueos</h4>
                <p style={{ margin: 0, color: "rgba(231, 227, 242, 0.9)", fontSize: "14px", lineHeight: "1.6" }}>{interpretationResult.blockages}</p>
              </div>

              {/* Consejo */}
              <div style={{ 
                background: "linear-gradient(135deg, rgba(109, 40, 217, 0.15), rgba(192, 132, 252, 0.05))", 
                border: "1px solid rgba(168, 85, 247, 0.3)", 
                padding: "16px", 
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(168, 85, 247, 0.08)"
              }}>
                <h4 style={{ color: "#d8b4fe", margin: "0 0 6px 0", fontSize: "15px" }}>Consejo del Tarot</h4>
                <p style={{ margin: 0, color: "rgba(231, 227, 242, 0.95)", fontSize: "14px", lineHeight: "1.6", fontWeight: "500" }}>{interpretationResult.advice}</p>
              </div>

            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setInterpretationResult(null)}
              >
                Cerrar lectura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error */}
      {interpretationError && (
        <div className="card-modal-backdrop" style={{ zIndex: 100 }} onClick={() => setInterpretationError(null)}>
          <div className="card-modal" style={{ width: "min(400px, 95vw)", maxWidth: "100%", padding: "20px", border: "1px solid rgba(239, 68, 68, 0.4)", background: "linear-gradient(180deg, #1f1115, #0f0709)" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "#ef4444", fontSize: "20px", margin: 0 }}>⚠️ Error</h3>
              <button type="button" className="btn btn-secondary card-modal-close" onClick={() => setInterpretationError(null)} style={{ borderRadius: "50%", width: "30px", height: "30px", padding: 0, display: "grid", placeItems: "center" }}>✕</button>
            </div>
            <div className="card-modal-body" style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ color: "rgba(255,255,255,0.9)", margin: 0, fontSize: "14px", lineHeight: "1.5" }}>{interpretationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Loading */}
      {isInterpreting && (
        <div className="card-modal-backdrop" style={{ zIndex: 100 }}>
          <div className="card-modal" style={{ textAlign: "center", width: "min(320px, 92vw)", maxWidth: "100%", padding: "30px 20px" }}>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <div className="tarot-loader" style={{ margin: "0 auto 20px auto", width: "50px", height: "50px", border: "3px solid rgba(201, 166, 107, 0.2)", borderTop: "3px solid #c9a66b", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            <h4 style={{ color: "#e8c789", margin: "0 0 8px 0" }}>Consultando los astros...</h4>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>Conectando simbolismo e interpretando el mapa de tu tirada.</p>
          </div>
        </div>
      )}
    </section>
  );
}

interface TrayDroppableProps {
  children: React.ReactNode;
}

function TrayDroppable({ children }: TrayDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({ id: TRAY_DROP_ID });

  return (
    <section ref={setNodeRef} className={`journal-tray-shell${isOver ? " is-over" : ""}`}>
      {children}
    </section>
  );
}

interface FreeCanvasProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  placements: JournalCardPlacement[];
  spreadName: string;
  flippedPlacementIds: string[];
  selectedPlacementIds: string[];
  selectionMode: boolean;
  dragGroup: DragGroupState | null;
  dragDelta: { x: number; y: number };
  onFlipToBack: (placement: JournalCardPlacement) => void;
  onFlipToFront: (placementId: string) => void;
  onRotate: (placementId: string) => void;
  onToggleSelected: (placementId: string) => void;
}

function FreeCanvas({
  canvasRef,
  placements,
  spreadName,
  flippedPlacementIds,
  selectedPlacementIds,
  selectionMode,
  dragGroup,
  dragDelta,
  onFlipToBack,
  onFlipToFront,
  onRotate,
  onToggleSelected,
}: FreeCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: FREE_CANVAS_DROP_ID });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (canvasRef) {
          canvasRef.current = node;
        }
      }}
      className={`journal-free-canvas${isOver ? " is-over" : ""}`}
    >
      {placements.map((placement) => {
        const card = tarotCards.find((item) => item.id === placement.cardId);
        if (!card) {
          return null;
        }

        return (
          <div
            key={placement.id}
            className="journal-free-card-anchor"
            style={{
              left: placement.x ?? 16,
              top: placement.y ?? 16,
              transform:
                dragGroup &&
                dragGroup.ids.includes(placement.id) &&
                dragGroup.activeId !== placement.id &&
                (dragDelta.x !== 0 || dragDelta.y !== 0)
                  ? `translate3d(${dragDelta.x}px, ${dragDelta.y}px, 0)`
                  : undefined,
            }}
          >
            <PlacedCard
              placement={placement}
              spreadType={spreadName}
              isFlipped={flippedPlacementIds.includes(placement.id)}
              isSelected={selectedPlacementIds.includes(placement.id)}
              selectionMode={selectionMode}
              keywords={pickKeywords(card, placement.isReversed)}
              onFlipToBack={onFlipToBack}
              onFlipToFront={onFlipToFront}
              onRotate={onRotate}
              onToggleSelected={onToggleSelected}
            />
          </div>
        );
      })}
    </div>
  );
}


