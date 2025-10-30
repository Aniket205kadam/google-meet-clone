import React from "react";
import "./BtnLoader.css";

const BtnLoader = ({ backgroundColor, width, height, borderSize }) => {
  return (
    <div
      class="loader"
      style={{
        backgroundColor: backgroundColor,
        width: width,
        height: height,
        borderTop: `10px solid ${backgroundColor}`,
        border: `${borderSize} solid #e0dcdc`
      }}
    ></div>
  );
};

export default BtnLoader;
