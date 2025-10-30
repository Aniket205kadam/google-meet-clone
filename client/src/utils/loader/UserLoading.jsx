import React from "react";
import "./UserLoading.css";

const UserLoading = ({ width, height, key }) => {
  return (
    <div className="user-create-call" key={key} style={{ width, height }}>
      <div className="profile"></div>
      <div className="name"></div>
    </div>
  );
};

export default UserLoading;
