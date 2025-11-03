import React from "react";
import "./SearchUserLoader.css";

const SearchUserLoader = ({ width, height, key }) => {
  return (
    <div className="search-user-load" key={key} style={{ width, height }}>
      <div className="search-profile-load"></div>
      <div className="user-info-load">
        <div className="name-load"></div>
        <div className="subtitle-load"></div>
      </div>
    </div>
  );
};

export default SearchUserLoader;
