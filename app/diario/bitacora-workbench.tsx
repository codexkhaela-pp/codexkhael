"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { saveJournalEntry } from "@/app/diario/storage";
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
}

function SpreadDropdown({ spreadId, onSelect }: SpreadDropdownProps) {
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
          {JOURNAL_SPREADS.map((option) => (
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

  function persistEntry() {
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

    saveJournalEntry(payload);
    setSaveMessage("Entrada guardada en localStorage.");
    onSaved?.(payload);
  }

  return (
    <section className="journal-tool" aria-label="Diario / Bitácora">
      <div className="journal-topbar">
        <article className="journal-metadata-panel">
          <h2>Datos basicos</h2>
          <div className="journal-form-grid">
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
            <label>
              Estado emocional
              <input
                value={metadata.emotionalState}
                onChange={(event) => setMetadata((prev) => ({ ...prev, emotionalState: event.target.value }))}
              />
            </label>
            <div className="journal-field-wide journal-dropdown-field">
              <span>Tipo de tirada</span>
              <SpreadDropdown spreadId={selectedSpreadId} onSelect={updateSpread} />
              <p className="journal-spread-description">{spread.description}</p>
            </div>
            <label className="journal-field-wide">
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
        <div className="journal-workspace">
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

      <section className="journal-reflection-panel" aria-label="Registro interpretativo">
        <h2>Reflexion personal</h2>
        <div className="journal-reflection-grid">
          <label className="journal-reflection-wide">
            Interpretacion personal
            <textarea
              className="journal-textarea-main"
              value={reflection.personalInterpretation}
              onChange={(event) => setReflection((prev) => ({ ...prev, personalInterpretation: event.target.value }))}
            />
          </label>
          <label>
            Mensaje final / conclusion
            <textarea
              className="journal-textarea-compact"
              value={reflection.finalMessage}
              onChange={(event) => setReflection((prev) => ({ ...prev, finalMessage: event.target.value }))}
            />
          </label>
          <label>
            Accion o consejo
            <textarea
              className="journal-textarea-compact"
              value={reflection.suggestedAction}
              onChange={(event) => setReflection((prev) => ({ ...prev, suggestedAction: event.target.value }))}
            />
          </label>
        </div>
      </section>

      <section className="journal-footer-actions">
        <div className="journal-save-actions">
          <button type="button" className="btn btn-primary" onClick={persistEntry}>
            Guardar entrada
          </button>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Volver al historial
          </button>
          {saveMessage && <p>{saveMessage}</p>}
        </div>
      </section>
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


