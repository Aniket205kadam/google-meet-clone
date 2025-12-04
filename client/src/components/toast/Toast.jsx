import { useEffect, useState } from "react";
import "./Toast.css";

const Toast = ({ img, desc }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => setShow(false), 4000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className={`toast ${show ? "show" : ""}`}>
      <div className="img">
        <img src={img} className="img1" />
      </div>
      <div className="desc">{desc}</div>
    </div>
  );
};

export default Toast;
