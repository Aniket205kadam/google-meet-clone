import { useEffect, useRef, useState } from "react";
import "./CollaborativeWhiteboard.css";

const CollaborativeWhiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const pointsRef = useRef([]);
  const [drawing, setDrawing] = useState(false);
  const strokeColors = ["#1E1E1E", "#E03131", "#2F9E44", "#1971C2", "#F08C00"];
  const backgroundColors = [
    "transparent",
    "#FFC9C9",
    "#B2F2BB",
    "#A5D8FF",
    "#FFEC99",
  ];
  const strokeWidths = [{ label: "thin", value: 2 }, { label: "bold", value: 4 }, { label: "Extra bold", value: 8 }];
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState({ label: "thin", value: 4 });
  const [selectedStrokeColor, setSelectedStrokeColor] = useState("#1E1E1E");
  const [selectedBackgroundColor, setSelectedBackgroundColor] =
    useState("transparent");
  const [strokeOpacity, setStrokeOpacity] = useState(100);
  const [isErasing, setIsErasing] = useState(false);

  const eraserCursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 -960 960 960'><path fill='%23000' d='M690-240h190v80H610l80-80Zm-500 80-85-85q-23-23-23.5-57t22.5-58l440-456q23-24 56.5-24t56.5 23l199 199q23 23 23 57t-23 57L520-160H190Zm296-80 314-322-198-198-442 456 64 64h262Z'/></svg>") 12 12, auto`;

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const ctx = ctxRef.current;
    const { x, y } = getCoords(e);

    pointsRef.current = [{ x, y }];

    ctx.beginPath();
    ctx.moveTo(x, y);

    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;

    const ctx = ctxRef.current;
    const { x, y } = getCoords(e);
    const points = pointsRef.current;

    if (points.length > 0) {
      const last = points[points.length - 1];
      const dx = x - last.x;
      const dy = y - last.y;

      if (dx * dx + dy * dy < 4) return;
    }

    points.push({ x, y });

    if (points.length < 3) return;

    const prev = points[points.length - 2];
    const curr = points[points.length - 1];

    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;

    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
    pointsRef.current = [];
  };

  // Apply style changes WITHOUT clearing the canvas
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineWidth = selectedStrokeWidth.value;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = strokeOpacity / 100;
    ctx.strokeStyle = selectedStrokeColor;

    if (isErasing) {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = selectedStrokeColor;
    }

  }, [selectedStrokeColor, selectedStrokeWidth, strokeOpacity, isErasing]);

  // Handle resize separately, preserving drawn content
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;

    const resizeCanvas = () => {
      const rect = parent.getBoundingClientRect();

      // Save current drawing before resize clears it
      const imageData = ctxRef.current
        ? ctxRef.current.getImageData(0, 0, canvas.width, canvas.height)
        : null;

      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext("2d");
      ctx.lineWidth = selectedStrokeWidth.value;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = strokeOpacity / 100;
      ctx.strokeStyle = selectedStrokeColor;
      ctxRef.current = ctx;

      // Restore drawing after resize
      if (imageData) {
        ctx.putImageData(imageData, 0, 0);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="collaborative-whiteboard-container">
      <canvas
        ref={canvasRef}
        style={{ cursor: isErasing ? eraserCursor : "crosshair" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="drawing-controls-panel">
        <button onClick={(e) => setIsErasing(prev => !prev)}>Eraser</button>
        <div className="stroke-controls">
          <h3>Stroke</h3>
          <div className="stroke-controls-color-info">
            <div className="stroke-color-picker">
              {strokeColors.map((color, index) => (
                <div
                  key={index}
                  className={`stroke-color ${selectedStrokeColor === color ? "current-color-selected" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedStrokeColor(color)}
                />
              ))}
            </div>
            <span>|</span>
            <div
              className="selected-color"
              style={{ backgroundColor: selectedStrokeColor }}
            ></div>
          </div>
        </div>
        <div className="background-controls-panel">
          <h3>Background</h3>
          <div className="stroke-controls-color-info">
            <div className="stroke-color-picker">
              {backgroundColors.map((color, index) => (
                <div
                  key={index}
                  className={`stroke-color ${selectedBackgroundColor === color ? "current-color-selected" : ""} ${color === "transparent" ? "transparent-bg" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedBackgroundColor(color)}
                />
              ))}
            </div>
            <span>|</span>
            <div
              className={`selected-color ${selectedBackgroundColor === "transparent" ? "transparent-bg" : ""}`}
              style={{ backgroundColor: selectedBackgroundColor }}
            ></div>
          </div>
        </div>
        <div className="stroke-width-controls-panel">
          <h3>Stroke width</h3>
          <div className="stroke-width-info">
            {strokeWidths.map(width => (
              <div className={`stroke-width ${selectedStrokeWidth.label === width.label ? "active" : ""}`} onClick={(e) => setSelectedStrokeWidth(width)}>
                <div className="stroke-width-icon" style={{ height: width.value }}>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="stroke-opacity-controls-panel">
          <h3>Opacity</h3>
          <div className="stroke-opacity-container">
            <input
              type="range"
              min="0"
              max="100"
              value={strokeOpacity}
              onChange={(e) => setStrokeOpacity(e.target.value)}
              className="opacity-slider"
            />
            <div className="opacity-labels">
              <span>0</span>
              <span style={{ position: "absolute", left: `${strokeOpacity - (strokeOpacity > 50 ? 8 : 0.85)}%`, opacity: `${strokeOpacity === 0 ? 0 : 100}` }}>{strokeOpacity}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeWhiteboard;
