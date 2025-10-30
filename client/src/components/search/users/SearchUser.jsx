import { useNavigate } from "react-router-dom";

const SearchUser = ({ user, searchType }) => {
  const navigate = useNavigate();
  
  return (
    <div
      className="search-user"
      key={user.id}
      onClick={() => navigate(`/before-call/${user.id}`)}
    >
      <img src={user.profile} className="profile-img" alt={user.fullName} />
      <div className="search-username">
        <span className="search-name">{user.fullName}</span>
        {searchType === "text" ? (
          <span className="sub-info">{user.email}</span>
        ) : (
          <span className="sub-info">{user.phone}</span>
        )}
      </div>
    </div>
  );
};

export default SearchUser;
