import { useEffect, useRef, useState } from "react";
import "./CollaborativeWhiteboard.css";

const CollaborativeWhiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const pointsRef = useRef([]);
  const [drawing, setDrawing] = useState(false);
  const strokeColors = ["#1E1E1E", "#E03131", "#2F9E44", "#1971C2", "#F08C00"];
  // const backgroundColors = [
  //   "transparent",
  //   "#FFC9C9",
  //   "#B2F2BB",
  //   "#A5D8FF",
  //   "#FFEC99",
  // ];
  const strokeWidths = [{ label: "thin", value: 2 }, { label: "bold", value: 4 }, { label: "Extra bold", value: 8 }];
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState({ label: "thin", value: 4 });
  const [selectedStrokeColor, setSelectedStrokeColor] = useState("#1E1E1E");
  // const [selectedBackgroundColor, setSelectedBackgroundColor] =
  //   useState("transparent");
  const [strokeOpacity, setStrokeOpacity] = useState(100);
  const [currentAction, setCurrentAction] = useState("pen"); // pen, eraser

  const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#000000">
                  <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                </svg>
              `;

  const encoded = encodeURIComponent(svg);

  const eraserCursor = `url("data:image/svg+xml,${encoded}") 12 12, auto`;

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
    console.log("points:", pointsRef.current);
    setDrawing(false);
    pointsRef.current = [];
  };

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineWidth = selectedStrokeWidth.value;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = strokeOpacity / 100;
    ctx.strokeStyle = selectedStrokeColor;

    if (currentAction === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 40;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = selectedStrokeColor;
      ctx.lineWidth = selectedStrokeWidth.value;
    }

  }, [selectedStrokeColor, selectedStrokeWidth, strokeOpacity, currentAction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;

    const resizeCanvas = () => {
      const rect = parent.getBoundingClientRect();

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

      if (imageData) {
        ctx.putImageData(imageData, 0, 0);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return (
    <div className="collaborative-whiteboard-container">
      <canvas
        ref={canvasRef}
        style={{ cursor: currentAction === "eraser" ? eraserCursor : "crosshair" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="drawing-controls-panel">
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
        {/* <div className="background-controls-panel">
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
        </div> */}
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

      <div className="action-controls-panel">
        <div className="action-option">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#000000"
          >
            <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm296.5-143.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z" />
          </svg>
        </div>
        <div className="action-option">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#000000"
          >
            <path d="M512-40q-82 0-154-37.5T240-182L48-464l19-19q20-21 49.5-24t53.5 14l110 76v-383q0-17 11.5-28.5T320-840q17 0 28.5 11.5T360-800v537L212-366l95 138q35 51 89 79.5T512-120q103 0 175.5-72.5T760-368v-392q0-17 11.5-28.5T800-800q17 0 28.5 11.5T840-760v392q0 137-95.5 232.5T512-40Zm-72-440v-400q0-17 11.5-28.5T480-920q17 0 28.5 11.5T520-880v400h-80Zm160 0v-360q0-17 11.5-28.5T640-880q17 0 28.5 11.5T680-840v360h-80ZM486-300Z" />
          </svg>
        </div>
        <div className="action-option">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#000000"
          >
            <path d="m320-410 79-110h170L320-716v306ZM551-80 406-392 240-160v-720l560 440H516l144 309-109 51ZM399-520Z" />
          </svg>
        </div>
        <div className={`action-option ${currentAction === "pen" ? "active" : ""}`} onClick={(e) => setCurrentAction("pen")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e3e3e3"
          >
            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
          </svg>
        </div>
        <div className={`action-option ${currentAction === "eraser" ? "active" : ""}`} onClick={(e) => setCurrentAction("eraser")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#000000"
          >
            <path d="M690-240h190v80H610l80-80Zm-500 80-85-85q-23-23-23.5-57t22.5-58l440-456q23-24 56.5-24t56.5 23l199 199q23 23 23 57t-23 57L520-160H190Zm296-80 314-322-198-198-442 456 64 64h262Zm-6-240Z" />
          </svg>
        </div>
      </div>

      <div className="undo-controls-panel">
        <div className="canvas-zoom-options">
          <div className="zoom-in-option">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#000000"
            >
              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
            </svg>
          </div>
          <div className="zoom-rate">
            100%
          </div>
          <div className="zoom-out-option">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#000000"
            >
              <path d="M200-440v-80h560v80H200Z" />
            </svg>
          </div>
        </div>
        <div className="undo-options">
          <div className="undo-option">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#000000"
            >
              <path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z" />
            </svg></div>
          <div className="redo-option">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#000000"
            >
              <path d="M396-200q-97 0-166.5-63T160-420q0-94 69.5-157T396-640h252L544-744l56-56 200 200-200 200-56-56 104-104H396q-63 0-109.5 40T240-420q0 60 46.5 100T396-280h284v80H396Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeWhiteboard;
