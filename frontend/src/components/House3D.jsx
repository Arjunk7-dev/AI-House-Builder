
import React, { useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import "./House3D.css";

const THEMES = {
  Modern: {
    wall: "#f1f1ed",
    wallSide: "#c8ccc8",
    floor: "#dedfd7",
    door: "#b87946",
    window: "#35bdf2",
    gate: "#16864b",
    road: "#42474f",
    plot: "#bfc8b1",
  },
  Luxury: {
    wall: "#eee4d3",
    wallSide: "#c8bba8",
    floor: "#bba58b",
    door: "#55372c",
    window: "#247ba0",
    gate: "#252d35",
    road: "#42474f",
    plot: "#c8c0ae",
  },
  Minimalist: {
    wall: "#ffffff",
    wallSide: "#cbd0d5",
    floor: "#dedfe2",
    door: "#9ca3af",
    window: "#7dd3fc",
    gate: "#64748b",
    road: "#42474f",
    plot: "#d4d9d4",
  },
  Traditional: {
    wall: "#f3dfbd",
    wallSide: "#d1b48c",
    floor: "#c98f60",
    door: "#7b3f24",
    window: "#3794bd",
    gate: "#246b45",
    road: "#42474f",
    plot: "#c4cbaa",
  },
};

function Box({ position, size, color, ...props }) {
  return (
    <mesh position={position} {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Label({
  children,
  position,
  color = "#17202a",
  size = 0.5,
}) {
  return (
    <Text
      position={position}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      maxWidth={10}
      outlineWidth={0.015}
      outlineColor="#ffffff"
    >
      {children}
    </Text>
  );
}

// Backend returns x, y and width in canvas units (x10).
// breadth and length retain dimensions in feet.
function getRoomDimensions(room) {
  return {
    x: Number(room.x ?? 0) / 10,
    z: Number(room.y ?? 0) / 10,
    width: Number(
      room.breadth ?? Number(room.width ?? 0) / 10
    ),
    depth: Number(
      room.length ?? Number(room.canvasHeight ?? 0) / 10
    ),
  };
}

function Room({ room, plotWidth, plotLength, showLabels, theme }) {
  const d = getRoomDimensions(room);

  if (
    !Number.isFinite(d.x) ||
    !Number.isFinite(d.z) ||
    d.width <= 0 ||
    d.depth <= 0 ||
    d.x < 0 ||
    d.z < 0 ||
    d.x + d.width > plotWidth + 0.01 ||
    d.z + d.depth > plotLength + 0.01
  ) {
    return null;
  }

  const cx = -plotWidth / 2 + d.x + d.width / 2;
  const cz = -plotLength / 2 + d.z + d.depth / 2;
  const wallH = 2.8;
  const wallT = 0.13;

  const floorColors = {
    living: "#d9d5c8",
    kitchen: "#d3e0df",
    dining: "#e9dfc9",
    bedroom: "#d9dfec",
    bathroom: "#cce8ed",
    parking: "#b8bdc3",
    garden: "#b8d7a4",
    balcony: "#e6d8c7",
    pooja: "#f0ddbb",
    study: "#d4dfd1",
    store: "#dedede",
    utility: "#d1d9dc",
    passage: "#d5d9d0",
  };

  const floorColor =
    room.type === "passage"
      ? "#d5d9d0"
      : floorColors[room.type] || theme.floor;

  return (
    <group>
      {/* Room floor */}
      <Box
        position={[cx, 0.12, cz]}
        size={[d.width, 0.18, d.depth]}
        color={floorColor}
      />

      {/* Perimeter walls */}
      <Box
        position={[cx, wallH / 2, cz - d.depth / 2]}
        size={[d.width, wallH, wallT]}
        color={theme.wallSide}
      />
      <Box
        position={[cx, wallH / 2, cz + d.depth / 2]}
        size={[d.width, wallH, wallT]}
        color={theme.wall}
      />
      <Box
        position={[cx - d.width / 2, wallH / 2, cz]}
        size={[wallT, wallH, d.depth]}
        color={theme.wall}
      />
      <Box
        position={[cx + d.width / 2, wallH / 2, cz]}
        size={[wallT, wallH, d.depth]}
        color={theme.wallSide}
      />

      {/* Door marker */}
      {d.width >= 4 && (
        <Box
          position={[cx, 1.0, cz - d.depth / 2 - 0.1]}
          size={[Math.min(2.4, d.width * 0.35), 1.9, 0.09]}
          color={theme.door}
        />
      )}

      {/* Front window marker */}
      {d.width >= 6 && (
        <Box
          position={[cx, 1.8, cz + d.depth / 2 + 0.1]}
          size={[Math.min(3.2, d.width * 0.4), 0.8, 0.09]}
          color={theme.window}
        />
      )}

      {/* Side window marker */}
      {d.depth >= 7 && (
        <Box
          position={[cx + d.width / 2 + 0.1, 1.8, cz]}
          size={[0.09, 0.8, Math.min(2.5, d.depth * 0.35)]}
          color={theme.window}
        />
      )}

      {showLabels && (
        <>
          <Label
            position={[cx, 0.34, cz - 0.2]}
            size={Math.max(0.28, Math.min(0.58, d.width / 7))}
          >
            {room.name || room.type}
          </Label>
          <Label
            position={[cx, 0.34, cz + 0.55]}
            size={0.32}
          >
            {`${d.width} x ${d.depth} ft`}
          </Label>
        </>
      )}
    </group>
  );
}

// Draw the plot boundary in segments, leaving an opening for the gate.
function PlotBoundary({ width, length, facing, theme }) {
  const wallHeight = 1.1;
  const wallThickness = 0.18;
  const gateWidth = Math.min(10, width * 0.35);
  const side = String(facing || "East").toLowerCase();

  const horizontalWall = (z, key) => (
    <group key={key}>
      <Box
        position={[-(width + gateWidth) / 4, wallHeight / 2, z]}
        size={[(width - gateWidth) / 2, wallHeight, wallThickness]}
        color={theme.wallSide}
      />
      <Box
        position={[(width + gateWidth) / 4, wallHeight / 2, z]}
        size={[(width - gateWidth) / 2, wallHeight, wallThickness]}
        color={theme.wallSide}
      />
    </group>
  );

  const verticalWall = (x, key) => (
    <group key={key}>
      <Box
        position={[x, wallHeight / 2, -(length + gateWidth) / 4]}
        size={[wallThickness, wallHeight, (length - gateWidth) / 2]}
        color={theme.wallSide}
      />
      <Box
        position={[x, wallHeight / 2, (length + gateWidth) / 4]}
        size={[wallThickness, wallHeight, (length - gateWidth) / 2]}
        color={theme.wallSide}
      />
    </group>
  );

  return (
    <group>
      {side === "south" ? (
        <>
          {horizontalWall(-length / 2, "north")}
          <Box
            position={[-width / 2, wallHeight / 2, 0]}
            size={[wallThickness, wallHeight, length]}
            color={theme.wallSide}
          />
          <Box
            position={[width / 2, wallHeight / 2, 0]}
            size={[wallThickness, wallHeight, length]}
            color={theme.wallSide}
          />
        </>
      ) : side === "north" ? (
        <>
          {horizontalWall(length / 2, "south")}
          <Box
            position={[-width / 2, wallHeight / 2, 0]}
            size={[wallThickness, wallHeight, length]}
            color={theme.wallSide}
          />
          <Box
            position={[width / 2, wallHeight / 2, 0]}
            size={[wallThickness, wallHeight, length]}
            color={theme.wallSide}
          />
        </>
      ) : side === "west" ? (
        <>
          {verticalWall(width / 2, "east")}
          <Box
            position={[0, wallHeight / 2, -length / 2]}
            size={[width, wallHeight, wallThickness]}
            color={theme.wallSide}
          />
          <Box
            position={[0, wallHeight / 2, length / 2]}
            size={[width, wallHeight, wallThickness]}
            color={theme.wallSide}
          />
        </>
      ) : (
        <>
          {verticalWall(-width / 2, "west")}
          <Box
            position={[0, wallHeight / 2, -length / 2]}
            size={[width, wallHeight, wallThickness]}
            color={theme.wallSide}
          />
          <Box
            position={[0, wallHeight / 2, length / 2]}
            size={[width, wallHeight, wallThickness]}
            color={theme.wallSide}
          />
        </>
      )}
    </group>
  );
}

function Entrance({ width, length, facing, theme }) {
  const side = String(facing || "East").toLowerCase();
  const gateWidth = Math.min(10, width * 0.35);
  const rotation =
    side === "east" || side === "west" ? Math.PI / 2 : 0;

  let x = 0;
  let z = 0;

  if (side === "north") z = -length / 2;
  if (side === "south") z = length / 2;
  if (side === "east") x = width / 2;
  if (side === "west") x = -width / 2;

  return (
    <group position={[x, 0.2, z]} rotation={[0, rotation, 0]}>
      {/* Gate leaves */}
      <Box
        position={[-gateWidth / 4, 0.85, 0]}
        size={[gateWidth / 2 - 0.1, 1.5, 0.12]}
        color={theme.gate}
      />
      <Box
        position={[gateWidth / 4, 0.85, 0]}
        size={[gateWidth / 2 - 0.1, 1.5, 0.12]}
        color={theme.gate}
      />

      {/* Gate pillars */}
      <Box
        position={[-gateWidth / 2, 0.9, 0]}
        size={[0.35, 1.8, 0.35]}
        color={theme.wall}
      />
      <Box
        position={[gateWidth / 2, 0.9, 0]}
        size={[0.35, 1.8, 0.35]}
        color={theme.wall}
      />

      <Label
        position={[0, 2.35, 0]}
        size={0.65}
        color={theme.gate}
      >
        MAIN GATE
      </Label>
      <Label
        position={[0, 1.95, 0]}
        size={0.34}
        color={theme.gate}
      >
        ENTRY
      </Label>
    </group>
  );
}

function DirectionLabels({ width, length }) {
  return (
    <group>
      <Label position={[0, 0.25, -length / 2 - 1.5]} size={0.55}>
        NORTH
      </Label>
      <Label position={[0, 0.25, length / 2 + 1.5]} size={0.55}>
        SOUTH
      </Label>
      <Label position={[-width / 2 - 1.5, 0.25, 0]} size={0.55}>
        WEST
      </Label>
      <Label position={[width / 2 + 1.5, 0.25, 0]} size={0.55}>
        EAST
      </Label>
    </group>
  );
}

function Road({ width, length, facing, theme }) {
  const side = String(facing || "East").toLowerCase();
  const horizontal = side === "north" || side === "south";

  const position =
    side === "north"
      ? [0, -0.02, -length / 2 - 4]
      : side === "south"
      ? [0, -0.02, length / 2 + 4]
      : side === "west"
      ? [-width / 2 - 4, -0.02, 0]
      : [width / 2 + 4, -0.02, 0];

  const roadWidth = horizontal ? width + 8 : 7;
  const roadLength = horizontal ? 7 : length + 8;
  const dashCount = Math.max(3, Math.floor((horizontal ? width : length) / 4));

  return (
    <group>
      <Box
        position={position}
        size={[roadWidth, 0.12, roadLength]}
        color={theme.road}
      />

      {Array.from({ length: dashCount }, (_, i) => {
        const distance = (i + 0.5) / dashCount;
        const dashPosition = horizontal
          ? [
              -width / 2 + distance * width,
              0.05,
              position[2],
            ]
          : [
              position[0],
              0.05,
              -length / 2 + distance * length,
            ];

        return (
          <Box
            key={i}
            position={dashPosition}
            size={horizontal ? [1, 0.03, 0.12] : [0.12, 0.03, 1]}
            color="#f8f8f2"
          />
        );
      })}

      <Label
        position={[
          position[0],
          0.08,
          position[2],
        ]}
        size={0.45}
        color="#ffffff"
      >
        ROAD
      </Label>
    </group>
  );
}

function HouseScene({ rooms, plan, showLabels, theme }) {
  const width = Math.max(10, Number(plan?.plotWidth) || 30);
  const length = Math.max(10, Number(plan?.plotLength) || 40);
  const facing = plan?.facing || "East";

  return (
    <>
      <color attach="background" args={["#e9edf0"]} />
      <ambientLight intensity={1.6} />
      <directionalLight
        position={[width, 35, length]}
        intensity={2}
        castShadow
      />

      {/* Plot base */}
      <Box
        position={[0, -0.18, 0]}
        size={[width, 0.3, length]}
        color={theme.plot}
      />

      {/* Boundary walls with gate opening on selected side */}
      <PlotBoundary
        width={width}
        length={length}
        facing={facing}
        theme={theme}
      />

      <gridHelper
        args={[
          Math.max(width, length) + 8,
          Math.max(width, length),
          "#87918a",
          "#d4d9d4",
        ]}
        position={[0, 0.01, 0]}
      />

      <Road
        width={width}
        length={length}
        facing={facing}
        theme={theme}
      />

      {rooms.map((room, index) => (
        <Room
          key={`${room.name}-${room.floor}-${index}`}
          room={room}
          plotWidth={width}
          plotLength={length}
          showLabels={showLabels}
          theme={theme}
        />
      ))}

      <Entrance
        width={width}
        length={length}
        facing={facing}
        theme={theme}
      />

      {showLabels && <DirectionLabels width={width} length={length} />}

      <OrbitControls
        target={[0, 0, 0]}
        enablePan
        enableZoom
        enableRotate
        minDistance={8}
        maxDistance={Math.max(width, length) * 4}
        maxPolarAngle={Math.PI / 2.02}
      />
    </>
  );
}

export default function House3D({ rooms = [], plan = {} }) {
  const [view, setView] = useState("3d");
  const [showLabels, setShowLabels] = useState(true);
  const [designTheme, setDesignTheme] = useState("Modern");

  const theme = THEMES[designTheme] || THEMES.Modern;
  const width = Math.max(10, Number(plan?.plotWidth) || 30);
  const length = Math.max(10, Number(plan?.plotLength) || 40);
  const maxSize = Math.max(width, length);
  const facing = String(plan?.facing || "East").toLowerCase();

  const cameraPosition = useMemo(() => {
    if (view === "top") {
      return [0, maxSize * 1.7, 0.01];
    }

    if (view === "front") {
      if (facing === "north") return [0, maxSize * 0.8, -maxSize * 1.7];
      if (facing === "east") return [maxSize * 1.7, maxSize * 0.8, 0];
      if (facing === "west") return [-maxSize * 1.7, maxSize * 0.8, 0];
      return [0, maxSize * 0.8, maxSize * 1.7];
    }

    return [maxSize * 1.25, maxSize * 1.1, maxSize * 1.4];
  }, [view, maxSize, facing]);

  const roomDetails = rooms.map((room) => ({
    name: room.name || room.type || "Room",
    doors: Array.isArray(room.doors) ? room.doors : [],
    windows: Array.isArray(room.windows) ? room.windows : [],
  }));

  const totalDoors = roomDetails.reduce(
    (sum, room) => sum + room.doors.length,
    0
  );
  const totalWindows = roomDetails.reduce(
    (sum, room) => sum + room.windows.length,
    0
  );

  return (
    <div className="house3d">
      <div className="house3d-header">
        <div>
          <h3>3D Architectural Floor Plan</h3>
          <p>{plan?.plotSize || `${width} x ${length} feet`}</p>
        </div>

        <button
          type="button"
          className="house3d-label-toggle"
          onClick={() => setShowLabels((value) => !value)}
        >
          {showLabels ? "Hide Labels" : "Show Labels"}
        </button>
      </div>

      <div className="house3d-toolbar">
        <button
          type="button"
          className={view === "3d" ? "active" : ""}
          onClick={() => setView("3d")}
        >
          3D View
        </button>
        <button
          type="button"
          className={view === "top" ? "active" : ""}
          onClick={() => setView("top")}
        >
          Top View
        </button>
        <button
          type="button"
          className={view === "front" ? "active" : ""}
          onClick={() => setView("front")}
        >
          Front / Gate View
        </button>
      </div>

      {/* Functional colour-theme selector */}
      <div className="house3d-theme-picker">
        <label htmlFor="house-theme">Architecture & Colour Theme</label>
        <select
          id="house-theme"
          value={designTheme}
          onChange={(event) => setDesignTheme(event.target.value)}
        >
          <option value="Modern">Modern — White & Grey</option>
          <option value="Luxury">Luxury — Beige & Wood</option>
          <option value="Minimalist">Minimalist — White & Silver</option>
          <option value="Traditional">Traditional — Cream & Brown</option>
        </select>
      </div>

      <div className="house3d-legend">
        <span><i className="legend-gate" /> Main gate</span>
        <span><i className="legend-door" /> Doors</span>
        <span><i className="legend-window" /> Windows</span>
        <span><i className="legend-wall" /> Walls</span>
      </div>

      <div className="house3d-canvas">
        {rooms.length === 0 ? (
          <div className="house3d-empty">
            Generate a house plan to see the 3D architecture.
          </div>
        ) : (
          <Canvas
            key={view}
            camera={{
              position: cameraPosition,
              fov: 42,
              near: 0.1,
              far: 2000,
            }}
            dpr={[1, 2]}
          >
            <HouseScene
              rooms={rooms}
              plan={plan}
              showLabels={showLabels}
              theme={theme}
            />
          </Canvas>
        )}
      </div>

      {/* Counts and room-wise door/window metadata */}
      <div className="house3d-details">
        <h4>Architecture Details</h4>

        <div className="house3d-counts">
          <span>🚪 Doors: {totalDoors}</span>
          <span>🪟 Windows: {totalWindows}</span>
          <span>🟢 Main gate: 1</span>
          <span>🧭 Facing: {plan?.facing || "East"}</span>
        </div>

        <h4>Room-wise placement</h4>

        {roomDetails.map((room, index) => (
          <div
            className="house3d-room-detail"
            key={`${room.name}-${index}`}
          >
            <strong>{room.name}</strong>
            <span>
              Doors:{" "}
              {room.doors.length
                ? room.doors
                    .map((door) => door.side || "unspecified")
                    .join(", ")
                : "Not specified"}
            </span>
            <span>
              Windows:{" "}
              {room.windows.length
                ? room.windows
                    .map((window) => window.side || "unspecified")
                    .join(", ")
                : "Not specified"}
            </span>
          </div>
        ))}
      </div>

      <p className="house3d-note">
        Drag to rotate, scroll to zoom, and use Top View to inspect the layout.
        The displayed doors and windows are conceptual markers, not verified
        construction openings.
      </p>
    </div>
  );
}
