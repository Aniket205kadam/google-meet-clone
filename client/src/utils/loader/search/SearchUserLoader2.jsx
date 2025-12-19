import "./SearchUserLoader2.css";

const SearchUserLoader2 = ({ width, height, key }) => {
  return (
    <div className="search-user-load2" key={key} style={{ width, height }}>
      <div className="search-profile-load2"></div>
      <div className="user-info-load2">
        <div className="name-load2"></div>
        <div className="subtitle-load2"></div>
      </div>
    </div>
  );
};

export default SearchUserLoader2;
