import { useMicLevel } from "../../hooks/useMicLevel";
import "./MicAnimation.css";

const MicAnimation = () => {
  const level = useMicLevel(); // returns 0–100
  const n = Math.min(level / 100, 1);

  return (
    <div className="gm-mic-container">
      <div className="gm-bar" style={{ transform: `scaleY(${0.3 + n * 0.7})` }} />
      <div className="gm-bar" style={{ transform: `scaleY(${0.15 + n * 0.85})` }} />
      <div className="gm-bar" style={{ transform: `scaleY(${0.4 + n * 0.6})` }} />
    </div>
  );
};

export default MicAnimation;
