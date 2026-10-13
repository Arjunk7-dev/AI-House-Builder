
import React, { useMemo, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Line,
  Group,
} from "react-konva";

const colors = {
  living: "#d9c7a4",
  kitchen: "#c7d9c2",
  dining: "#d6c4e8",
  bedroom: "#b9cee8",
  bathroom: "#a8d8df",
  parking: "#b8b8b8",
  garden: "#b7d6ad",
  balcony: "#d9c6a7",
  pooja: "#e4c3a1",
  study: "#c4d6e6",
  store: "#cfcfcf",
  utility: "#c5d5c8",
};

const CANVAS_WIDTH = 820;
const CANVAS_HEIGHT = 610;
const PADDING_X = 35;
const PADDING_Y = 58;

export default function FloorCanvas({ rooms = [], plan = {} }) {
  const [selectedFloor, setSelectedFloor] = useState(0);

  const plotWidth = Number(plan.plotWidth) || 30;
  const plotLength = Number(plan.plotLength) || 40;

  // Backend formatRooms() converts x, y and width to canvas units
  // by multiplying feet by 10. canvasHeight is also in canvas units.
  const floorRooms = useMemo(
    () =>
      rooms.filter(
        (room) => Number(room.floor ?? 0) === selectedFloor
      ),
    [rooms, selectedFloor]
  );

  const floorCount = Math.max(
    1,
    Number(plan.floors) || 1,
    ...rooms.map((room) => Number(room.floor ?? 0) + 1)
  );

  const plotCanvasWidth = plotWidth * 10;
  const plotCanvasHeight = plotLength * 10;

  const scale = Math.min(
    (CANVAS_WIDTH - PADDING_X * 2) / plotCanvasWidth,
    (CANVAS_HEIGHT - PADDING_Y - 55) / plotCanvasHeight
  );

  const drawnWidth = plotCanvasWidth * scale;
  const drawnHeight = plotCanvasHeight * scale;

  function getRoomWidth(room) {
    // The backend sends width multiplied by 10.
    if (room.canvasHeight !== undefined) {
      return Number(room.width) || 0;
    }

    // Fallback for room objects expressed in feet.
    return (Number(room.width ?? room.breadth) || 0) * 10;
  }

  function getRoomHeight(room) {
    if (room.canvasHeight !== undefined) {
      return Number(room.canvasHeight) || 0;
    }

    return (Number(room.length) || 0) * 10;
  }

  function getRoomX(room) {
    if (room.canvasHeight !== undefined) {
      return Number(room.x) || 0;
    }

    return (Number(room.x) || 0) * 10;
  }

  function getRoomY(room) {
    if (room.canvasHeight !== undefined) {
      return Number(room.y) || 0;
    }

    return (Number(room.y) || 0) * 10;
  }

  return (
    <div className="floor-wrap">
      <div className="floor-toolbar">
        <div>
          <strong>Floor Plan</strong>
          <p>
            {plan.plotSize || `${plotWidth} × ${plotLength} ft`}
          </p>
        </div>

        <label className="floor-select">
          <span>View floor</span>
          <select
            value={selectedFloor}
            onChange={(event) =>
              setSelectedFloor(Number(event.target.value))
            }
          >
            {Array.from({ length: floorCount }, (_, index) => (
              <option key={index} value={index}>
                {index === 0
                  ? "Ground Floor"
                  : `Floor ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="floor-canvas">
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          scaleX={1}
          scaleY={1}
        >
          <Layer>
            <Text
              x={PADDING_X}
              y={16}
              text={`PLOT: ${plotWidth} × ${plotLength} ft`}
              fontSize={17}
              fill="#e2e8f0"
              fontStyle="bold"
            />

            <Text
              x={CANVAS_WIDTH - 90}
              y={15}
              text="N ↑"
              fontSize={15}
              fill="#22d3ee"
              fontStyle="bold"
            />

            <Rect
              x={PADDING_X}
              y={PADDING_Y}
              width={drawnWidth}
              height={drawnHeight}
              fill="#0b1423"
              stroke="#94a3b8"
              strokeWidth={2}
            />

            {floorRooms.map((room, index) => {
              const x = PADDING_X + getRoomX(room) * scale;
              const y = PADDING_Y + getRoomY(room) * scale;
              const width = getRoomWidth(room) * scale;
              const height = getRoomHeight(room) * scale;

              // Ignore malformed dimensions instead of drawing misleading rooms.
              if (
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                width <= 0 ||
                height <= 0
              ) {
                return null;
              }

              const name = String(room.name || room.type || "Room");
              const feetWidth =
                room.breadth ?? (
                  Number(room.width) / (room.canvasHeight !== undefined ? 10 : 1)
                );
              const feetLength = room.length ?? (
                Number(room.canvasHeight) / 10
              );

              return (
                <Group key={`${room.name || "room"}-${room.floor}-${index}`}>
                  <Rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={
                      colors[String(room.type || "").toLowerCase()] ||
                      "#d5d5d5"
                    }
                    stroke="#334155"
                    strokeWidth={1.5}
                  />

                  {width >= 38 && height >= 30 && (
                    <Text
                      x={x + 3}
                      y={y + 3}
                      width={Math.max(10, width - 6)}
                      height={Math.max(10, height - 6)}
                      text={`${name}\n${feetWidth} × ${feetLength} ft`}
                      fontSize={Math.max(
                        8,
                        Math.min(13, width / 9, height / 4)
                      )}
                      fill="#0f172a"
                      align="center"
                      verticalAlign="middle"
                      wrap="word"
                    />
                  )}
                </Group>
              );
            })}

            <Line
              points={[
                PADDING_X,
                PADDING_Y + drawnHeight + 13,
                PADDING_X + drawnWidth,
                PADDING_Y + drawnHeight + 13,
              ]}
              stroke="#64748b"
              strokeWidth={1}
              dash={[5, 5]}
            />

            <Text
              x={PADDING_X}
              y={PADDING_Y + drawnHeight + 20}
              text={`ROAD / MAIN ENTRY: ${plan.facing || "East"}`}
              fontSize={12}
              fill="#94a3b8"
            />
          </Layer>
        </Stage>
      </div>

      <div className="floor-legend">
        {Object.entries(colors).map(([type, color]) => (
          <div key={type} className="floor-legend-item">
            <span style={{ background: color }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        ))}
      </div>

      {floorRooms.length === 0 && (
        <p className="floor-empty">
          No rooms were generated for this floor. Check the design warnings.
        </p>
      )}
    </div>
  );
}
