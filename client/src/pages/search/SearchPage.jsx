import React, { useEffect, useRef, useState } from "react";
import "./SearchPage.css";
import SearchUserLoader from "../../utils/loader/search/SearchUserLoader";
import { useNavigate } from "react-router-dom";
import UserService from "../../services/UserService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import EmptyState from "../../components/search/empty/EmptyState";
import SearchUser from "../../components/search/users/SearchUser";

const SearchPage = () => {
  const [searchType, setSearchType] = useState("text");
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isShowSearchBtn, setIsShowSearchBtn] = useState(true);
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.authentication.accessToken);

  const userService = new UserService(accessToken);

  const getSuggestedUsers = async () => {
    try {
      setSearchLoading(true);
      const response = await userService.fetchSuggestedUsers(5);
      setSearchedUsers(response || []);
      setSearchLoading(false);
    } catch (error) {
      console.error("Failed to fetch suggested users:", error);
      toast.error("Failed to fetch the suggested users");
    }
  };

  const searchUsers = async () => {
    try {
      setSearchLoading(true);
      const response = await userService.fetchSearchedUsers(search, 5);
      setSearchedUsers(response || []);
      setSearchLoading(false);
    } catch (error) {
      console.log("Failed to fetch the searched users:", error);
      toast.error("Failed to fetch the searched users");
    }
  };

  useEffect(() => {
    if (search.length <= 0) {
      getSuggestedUsers();
    } else {
      searchUsers();
    }
  }, [search]);

  useEffect(() => {
    getSuggestedUsers();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (Math.round(window.scrollY) > 80) {
        setIsShowSearchBtn(true);
      } else {
        setIsShowSearchBtn(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="search-page">
      <div className="search-bar">
        <div className="back-btn" onClick={() => navigate("/")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e3e3e3"
          >
            <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
          </svg>
        </div>
        <div className="search-input-box">
          <input
            type={searchType}
            placeholder="Search contacts or dial a number"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            ref={searchInputRef}
            autoFocus
          />
        </div>
        <div
          className="search-remove-btn"
          style={search.length <= 0 ? { opacity: "0" } : { opacity: "1" }}
          onClick={() => {
            setSearch("");
            searchInputRef.current.focus();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e3e3e3"
          >
            <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
          </svg>
        </div>
        <div className="change-search-type-btn">
          {searchType === "text" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
              onClick={() => setSearchType("number")}
            >
              <path d="M480-40q-33 0-56.5-23.5T400-120q0-33 23.5-56.5T480-200q33 0 56.5 23.5T560-120q0 33-23.5 56.5T480-40ZM240-760q-33 0-56.5-23.5T160-840q0-33 23.5-56.5T240-920q33 0 56.5 23.5T320-840q0 33-23.5 56.5T240-760Zm0 240q-33 0-56.5-23.5T160-600q0-33 23.5-56.5T240-680q33 0 56.5 23.5T320-600q0 33-23.5 56.5T240-520Zm0 240q-33 0-56.5-23.5T160-360q0-33 23.5-56.5T240-440q33 0 56.5 23.5T320-360q0 33-23.5 56.5T240-280Zm480-480q-33 0-56.5-23.5T640-840q0-33 23.5-56.5T720-920q33 0 56.5 23.5T800-840q0 33-23.5 56.5T720-760ZM480-280q-33 0-56.5-23.5T400-360q0-33 23.5-56.5T480-440q33 0 56.5 23.5T560-360q0 33-23.5 56.5T480-280Zm240 0q-33 0-56.5-23.5T640-360q0-33 23.5-56.5T720-440q33 0 56.5 23.5T800-360q0 33-23.5 56.5T720-280Zm0-240q-33 0-56.5-23.5T640-600q0-33 23.5-56.5T720-680q33 0 56.5 23.5T800-600q0 33-23.5 56.5T720-520Zm-240 0q-33 0-56.5-23.5T400-600q0-33 23.5-56.5T480-680q33 0 56.5 23.5T560-600q0 33-23.5 56.5T480-520Zm0-240q-33 0-56.5-23.5T400-840q0-33 23.5-56.5T480-920q33 0 56.5 23.5T560-840q0 33-23.5 56.5T480-760Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
              onClick={() => setSearchType("text")}
            >
              <path d="M160-200q-33 0-56.5-23.5T80-280v-400q0-33 23.5-56.5T160-760h640q33 0 56.5 23.5T880-680v400q0 33-23.5 56.5T800-200H160Zm0-80h640v-400H160v400Zm160-40h320v-80H320v80ZM200-440h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM200-560h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM160-280v-400 400Z" />
            </svg>
          )}
        </div>
      </div>

      {isShowSearchBtn && (
        <button
          className="search-top-icon"
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
            searchInputRef.current.focus();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e3e3e3"
          >
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
          </svg>
        </button>
      )}

      <div className="search-main-container">
        <span>Explore People</span>

        {/* searchedUsers.length <= 0 */}
        {searchLoading ? (
          <div className="searched-users">
            {Array.from({ length: 5 }, (_, idx) => (
              <SearchUserLoader key={idx} width={"100%"} height={"80px"} />
            ))}
          </div>
        ) : (
          <>
            {searchedUsers.length <= 0 ? (
              <EmptyState />
            ) : (
              <div className="searched-users">
                {searchedUsers.map((user) => (
                  <SearchUser
                    user={user}
                    searchType={searchType}
                    key={user.id}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="searched-users"></div>
      </div>
    </div>
  );
};

export default SearchPage;
