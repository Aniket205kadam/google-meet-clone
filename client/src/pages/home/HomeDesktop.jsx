import { useEffect, useRef, useState } from "react";
import Logo from "../../assets/logo/logo.png";
import { useFormattedDate } from "../../hooks/useFormattedDate";
import "./HomeDesktop.css";
import { HomeSvg } from "../../utils/svg/HomeSvg";
import CallHistoryItem from "../../components/callHistory/CallHistoryItem";
import CallMoreOption from "../../components/callMoreOption/CallMoreOption";
import useClickOutside from "../../hooks/useClickOutside";
import BtnLoader from "../../utils/loader/BtnLoader";
import PageLoader from "../../utils/loader/pageLoader/PageLoader";
import PageDataLoader from "../../utils/loader/pageDataLoader/PageDataLoader";
import UserService from "../../services/UserService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import useDebounce from "../../hooks/useDebounce";
import SearchUserLoader from "../../utils/loader/search/SearchUserLoader";
import SearchUserLoader2 from "../../utils/loader/search/SearchUserLoader2";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import MeetingOption from "../../components/meeting/meetingOption/MeetingOption";
import CreateLink from "../../components/startCall/createLink/CreateLink";
import MeetingService from "../../services/MeetingService";
import InfoToast from "../../components/toast/infoToast/InfoToast";
import { useNavigate } from "react-router-dom";
import AppConfig from "../../config/AppConfig";
import AccountInfo from "../../components/modal/account/AccountInfo";

const HomeDesktop = ({
  currentUser,
  callHistory,
  setMoreLoading,
  setCurrentPageNo,
  moreLoading,
  isLastPage,
}) => {
  const currentDateTime = useFormattedDate();
  const [mainContent, setMainContent] = useState("meetings");
  const [currentWhtCanDoIdx, setCurrentWhtCanDoIdx] = useState(1);
  const [direction, setDirection] = useState("right");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isShowCallMore, setIsShowCallMore] = useState(false);
  const [morePosition, setMorePosition] = useState({
    clientX: "",
    clientY: "",
  });
  const [isShowSearch, setIsShowSearch] = useState(false);
  const { accessToken } = useSelector((state) => state.authentication);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchedUser, setSearchedUser] = useState(null);
  const [meetingCode, setMeetingCode] = useState("");
  const [isShowMenu, setIsShowMenu] = useState(true);
  const [isShowMeetingOption, setIsShowMeetingOption] = useState({
    status: false,
    clientX: 0,
    clientY: 0,
  });
  const [isShowCreateMeetingCode, setIsShowCreateMeetingCode] = useState(false);
  const [customToast, setCustomToast] = useState({ status: false, info: "" });
  const [isShowAccountInfo, setIsShowAccountInfo] = useState(false);

  const userService = new UserService(accessToken);
  const meetingService = new MeetingService(accessToken);
  const APP_ROOT = AppConfig.appRoot;

  const navigate = useNavigate();

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const callMoreRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchMoreContainerRef = useRef(null);
  const meetingOptionRef = useRef(null);
  const createMeetingCodeRef = useRef(null);
  const accountInfoRef = useRef(null);

  useClickOutside(callMoreRef, () => setIsShowCallMore(false));
  useClickOutside(searchMoreContainerRef, () => setIsShowSearch(false));
  useClickOutside(meetingOptionRef, () =>
    setIsShowMeetingOption({ status: false, clientX: 0, clientY: 0 })
  );
  useClickOutside(createMeetingCodeRef, () =>
    setIsShowCreateMeetingCode(false)
  );
  useClickOutside(accountInfoRef, () => setIsShowAccountInfo(false));

  const width = useWindowWidth();

  const swapRight = () => {
    setDirection("right");

    if (currentWhtCanDoIdx >= 3) {
      setCurrentWhtCanDoIdx(1);
      return;
    }
    setCurrentWhtCanDoIdx((prev) => prev + 1);
  };

  const swapLeft = () => {
    setDirection("left");

    if (currentWhtCanDoIdx <= 1) {
      setCurrentWhtCanDoIdx(3);
      return;
    }
    setCurrentWhtCanDoIdx((prev) => prev - 1);
  };

  const whtCanDoInfo = {
    1: (
      <div className="wht-can-do-info">
        <h2>Get a link you can share</h2>
        <p>
          Click <b>New meeting</b> to get a link you can send to people you want
          to meet with
        </p>
      </div>
    ),
    2: (
      <div className="wht-can-do-info">
        <h2>Plan ahead</h2>
        <p>
          Click <b>New meeting</b> to schedule meetings in Google Calendar and
          send invites to participants
        </p>
      </div>
    ),
    3: (
      <div className="wht-can-do-info">
        <h2>Your meeting is safe</h2>
        <p>No one can join a meeting unless invited or admitted by the host</p>
      </div>
    ),
  };

  const getSuggestedUsers = async () => {
    try {
      const response = await userService.fetchSuggestedUsers(2);
      setSuggestedUsers(response || []);
    } catch (error) {
      console.error("Failed to fetch the suggested users:", error);
    }
  };

  const getSearchedUsers = async (keyword, size) => {
    try {
      if (keyword?.length <= 0) {
        return;
      }
      const response = await userService.fetchSearchedUsers(keyword, size);
      setSearchedUser(response);
    } catch (error) {
      console.error("Failed to fetch the searched users:", error);
    }
  };

  const joinMeeting = async () => {
    try {
      const response = await meetingService.isExist(meetingCode);
      if (!response) {
        setCustomToast({
          status: true,
          info: "Couldn't find the meeting you're trying to join. You might not be signed in with the right account.",
        });
      } else {
        localStorage.setItem("meetingCode", meetingCode);
        navigate(`/${meetingCode}`);
      }
    } catch (error) {
      console.error(error.message);
      navigate("/");
    }
  };

  const searchUsers = useDebounce(getSearchedUsers, 1000);

  useEffect(() => {
    searchUsers(searchKeyword, 2);
  }, [searchKeyword]);

  useEffect(() => {
    getSuggestedUsers();
  }, []);

  useEffect(() => {
    let timerId;
    if (timerId) {
      clearTimeout(timerId);
    }
    if (customToast.status) {
      timerId = setTimeout(() => {
        setCustomToast({ status: false, info: "" });
      }, 5000);
    }
  }, [customToast]);

  return (
    <div className="window-home-page-container">
      {isShowCallMore && (
        <CallMoreOption
          ref={callMoreRef}
          top={morePosition.clientY}
          left={morePosition.clientX}
        />
      )}
      {isShowMeetingOption.status && (
        <MeetingOption
          positionX={isShowMeetingOption.clientX}
          positionY={isShowMeetingOption.clientY}
          ref={meetingOptionRef}
          showCreateMeeting={() => {
            setIsShowCreateMeetingCode(true);
            setIsShowMeetingOption(false);
          }}
        />
      )}
      {isShowCreateMeetingCode && (
        <CreateLink
          ref={createMeetingCodeRef}
          onClose={() => setIsShowCreateMeetingCode(false)}
        />
      )}

      {customToast.status && <InfoToast info={customToast.info} />}

      {isShowAccountInfo && (
        <AccountInfo
          profileImg={currentUser.profile}
          fullName={currentUser.fullName}
          email={currentUser.email}
          ref={accountInfoRef}
          onClose={() => setIsShowAccountInfo(false)}
        />
      )}

      <div className="window-home-page-header">
        <div className="menu-header-left">
          <div
            className="menu-more-option"
            onClick={() => setIsShowMenu((prev) => !prev)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
            </svg>
          </div>
          <div className="app-name-header">
            <div className="icon-image">
              <img src={Logo} />
            </div>
            <span className="app-first-name">Google</span>
            <span className="app-second-name">Meet</span>
          </div>
        </div>
        <div className="menu-header-right">
          {width >= 650 && (
            <div className="menu-header-date-time menu-app">
              <span>{currentTime}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="6"></circle>
              </svg>
              <span>{currentDateTime.split("-")[1]}</span>
            </div>
          )}
          <div className="menu-app">
            <div className="menu-header-support">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
              >
                <path d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
              </svg>
            </div>
          </div>
          <div className="menu-app">
            <div className="menu-header-report-problem">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
              >
                <path d="M480-360q17 0 28.5-11.5T520-400q0-17-11.5-28.5T480-440q-17 0-28.5 11.5T440-400q0 17 11.5 28.5T480-360Zm-40-160h80v-240h-80v240ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" />
              </svg>
            </div>
          </div>
          <div className="menu-app">
            <div className="menu-header-setting">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
              </svg>
            </div>
          </div>
          <div
            className="menu-header-profile menu-app"
            onClick={() => setIsShowAccountInfo(true)}
          >
            <img
              src={
                currentUser?.profile ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
              }
            />
          </div>
        </div>
      </div>
      <div className="window-home-page-main">
        {isShowMenu && (
          <div
            className="window-home-page-menubar"
            style={width < 800 ? { width: "50px" } : {}}
          >
            <div
              className={`menubar-option ${
                mainContent === "meetings" ? "menubar-option-select" : ""
              }`}
              onClick={() => setMainContent("meetings")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M360-300q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
              </svg>
              {width > 800 && <span>Meetings</span>}
            </div>
            <div
              className={`menubar-option ${
                mainContent === "calls" ? "menubar-option-select" : ""
              }`}
              onClick={() => setMainContent("calls")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
              </svg>
              {width > 800 && <span>Calls</span>}
            </div>
          </div>
        )}
        {mainContent === "meetings" ? (
          <div className="window-home-page-main-content">
            <div className="main-first-content">
              <h1>Video calls and meetings for everyone</h1>
              <div className="second-msg">
                Connect, collaborate, and celebrate from anywhere with Google
                Meet
              </div>
              <div className="meeting-options">
                <button
                  className="create-meeting-btn"
                  onClick={(e) => {
                    setIsShowMeetingOption({
                      status: true,
                      clientX: e.clientX,
                      clientY: e.clientY,
                    });
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e3e3e3"
                  >
                    <path d="M360-320h80v-120h120v-80H440v-120h-80v120H240v80h120v120ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
                  </svg>
                  <span>New meeting</span>
                </button>
                <div className="enter-code-space">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="M160-200q-33 0-56.5-23.5T80-280v-400q0-33 23.5-56.5T160-760h640q33 0 56.5 23.5T880-680v400q0 33-23.5 56.5T800-200H160Zm0-80h640v-400H160v400Zm160-40h320v-80H320v80ZM200-440h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM200-560h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM160-280v-400 400Z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Enter a code or link"
                    value={meetingCode}
                    onChange={(e) => {
                      const code = e.target.value.replace(`${APP_ROOT}`, "");
                      setMeetingCode(code);
                    }}
                  />
                </div>
                <button
                  className={`join-meeting-btn ${
                    meetingCode?.length > 0 ? "active" : ""
                  }`}
                  onClick={joinMeeting}
                >
                  Join
                </button>
              </div>
            </div>

            <div className="main-second-content">
              <button className="swap-btn" onClick={swapLeft}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z" />
                </svg>
              </button>

              <div className="wht-can-do">
                <div className="wht-can-do-img">
                  {HomeSvg[currentWhtCanDoIdx]}
                </div>
                <div
                  key={currentWhtCanDoIdx}
                  className={`wht-can-do-anim ${
                    direction === "right" ? "slide-right" : "slide-left"
                  }`}
                >
                  <div className="wht-can-do-sub1">
                    {whtCanDoInfo[currentWhtCanDoIdx]}
                  </div>
                </div>
                <div className="wht-can-do-status">
                  <div
                    className={`status1 ${
                      currentWhtCanDoIdx === 1 ? "active" : ""
                    }`}
                  ></div>
                  <div
                    className={`status1 ${
                      currentWhtCanDoIdx === 2 ? "active" : ""
                    }`}
                  ></div>
                  <div
                    className={`status1 ${
                      currentWhtCanDoIdx === 3 ? "active" : ""
                    }`}
                  ></div>
                </div>
              </div>

              <button className="swap-btn" onClick={swapRight}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
                </svg>
              </button>
            </div>

            <div className="home-footer">
              <span className="learn-more">Learn more </span>
              about Google Meet
            </div>
          </div>
        ) : (
          <div className="window-home-page-main-content2">
            <div className="window-home-page-search-container">
              {isShowSearch ? (
                <div
                  className="full-search-option-container"
                  ref={searchMoreContainerRef}
                >
                  <div className="full-search-input-box">
                    {width >= 518 && (
                      <span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#e3e3e3"
                        >
                          <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                        </svg>
                      </span>
                    )}
                    {selectedUser && (
                      <div className="selected-user">
                        <div className="selected-user-profile">
                          <img src={selectedUser.profile} />
                        </div>
                        {width >= 715 && (
                          <div className="selected-user-email">
                            {selectedUser.email}
                          </div>
                        )}
                        <div
                          className="selected-close"
                          onClick={() => setSelectedUser(null)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="16px"
                            viewBox="0 -960 960 960"
                            width="16px"
                            fill="#e3e3e3"
                          >
                            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Search contacts or dial"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      ref={searchInputRef}
                      autoFocus
                    />
                    {searchKeyword?.length > 0 && (
                      <div
                        className="close2"
                        onClick={() => {
                          searchInputRef?.current?.focus();
                          setSearchKeyword("");
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#e3e3e3"
                        >
                          <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="searched-users2">
                    {searchedUser &&
                      searchedUser.map((user) => (
                        <div
                          className="searched-user"
                          onClick={() => {
                            if (searchInputRef.current) {
                              searchInputRef.current.focus();
                            }
                            if (selectedUser !== null) {
                              toast.info(
                                "Selecting multiple users is not supported at the moment."
                              );
                            }
                            setSelectedUser(user);
                          }}
                        >
                          <div className="searched-user-profile">
                            {selectedUser?.id === user.id ? (
                              <div className="selected-img">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="#ffffff"
                                >
                                  <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                                </svg>
                              </div>
                            ) : (
                              <img src={user.profile} />
                            )}
                          </div>
                          <div className="searched-user-email">
                            <span className="s-full-name">{user.fullName}</span>
                            <span className="s-email">{user.email}</span>
                          </div>
                        </div>
                      ))}

                    {searchKeyword.length > 0 && searchedUser === null && (
                      <SearchUserLoader2
                        width={"100%"}
                        height={"50px"}
                        key={1}
                      />
                    )}

                    {searchKeyword.length <= 0 &&
                      suggestedUsers.map((user) => (
                        <div
                          className="searched-user"
                          onClick={() => {
                            if (searchInputRef.current) {
                              searchInputRef.current.focus();
                            }
                            if (selectedUser !== null) {
                              toast.info(
                                "Selecting multiple users is not supported at the moment."
                              );
                            }
                            setSelectedUser(user);
                          }}
                        >
                          <div className="searched-user-profile">
                            {selectedUser?.id === user.id ? (
                              <div className="selected-img">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="#ffffff"
                                >
                                  <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                                </svg>
                              </div>
                            ) : (
                              <img src={user.profile} />
                            )}
                          </div>
                          <div className="searched-user-email">
                            <span className="s-full-name">{user.fullName}</span>
                            <span className="s-email">{user.email}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="searched-continued-container">
                    <button
                      className={`${selectedUser != null ? "btn-active" : ""}`}
                    >
                      Continue{" "}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#e3e3e3"
                      >
                        <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="window-search-input-box">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search contacts or dial"
                    readOnly
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShowSearch(true);
                    }}
                  />
                  {searchKeyword.length !== 0 && (
                    <button onClick={() => setSearchKeyword("")}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#e3e3e3"
                      >
                        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="window-home-page-content2-main2">
              {callHistory.length === 0 && (
                <div className="no-latest-activity2">
                  <div className="no-latest-activity2-svg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="331"
                      height="145"
                      fill="none"
                    >
                      <path
                        fill="#C2E7FF"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M106.765 128.43c13.975 0 25.304-11.34 25.304-25.328s-11.329-25.327-25.304-25.327-25.303 11.34-25.303 25.327 11.328 25.328 25.303 25.328"
                      />
                      <path
                        fill="#1EA446"
                        stroke="#1EA446"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M323.009 26.526a23.903 23.903 0 0 1 0 33.786l-10.563 10.573a23.858 23.858 0 0 1-33.634-.122 23.904 23.904 0 0 1-.122-33.664l10.564-10.573a23.857 23.857 0 0 1 33.755 0"
                      />
                      <path
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M278.69 70.885a23.903 23.903 0 0 1 0-33.786l10.564-10.574"
                      />
                      <path
                        fill="#E46962"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M103.294 67.31c13.975 0 25.304-11.339 25.304-25.327 0-13.987-11.329-25.327-25.304-25.327s-25.303 11.34-25.303 25.327S89.32 67.31 103.294 67.31"
                      />
                      <path
                        fill="#fff"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M103.296 67.31a25.21 25.21 0 0 0 18.517-8.07 20.189 20.189 0 0 0-37.035 0 25.23 25.23 0 0 0 18.518 8.07"
                      />
                      <path
                        fill="#1F1F1F"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M96.91 29.28a4.31 4.31 0 0 0 4.307-4.31c0-2.381-1.928-4.31-4.306-4.31a4.31 4.31 0 0 0-4.307 4.31c0 2.38 1.928 4.31 4.307 4.31"
                      />
                      <path
                        fill="#1F1F1F"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M104.125 30.046s2.406 3.882 5.857 4.743a6.785 6.785 0 0 0-3.872-7.243 6.77 6.77 0 0 0-9.353 4.4 6.8 6.8 0 0 0-.135 2.916c4.181-.68 7.503-4.816 7.503-4.816"
                      />
                      <path
                        fill="#fff"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M104.125 30.045s-3.322 4.137-7.503 4.816a6.77 6.77 0 0 0 13.36-.073c-3.45-.86-5.857-4.743-5.857-4.743"
                      />
                      <path
                        fill="#FFBB29"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M211.669 101.858c24.442 0 44.257-19.833 44.257-44.298s-19.815-44.297-44.257-44.297-44.257 19.832-44.257 44.297 19.815 44.298 44.257 44.298"
                      />
                      <path
                        fill="#fff"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M163.349 80.314s12.446-11.906 17.702-11.906c5.255 0 15.683 8.86 30.618 8.86 16.182 0 30.941-13.289 40.96-2.908 0 0-10.065 27.496-40.96 27.496-13.376 0-22.727-6.28-22.727-6.28l-9.419 12.702z"
                      />
                      <path
                        fill="#F2D9C4"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M196.262 74.377s.556 17.019 12.864 17.019 27.232-19.987 27.232-19.987l-6.641 2.23-4.825-10.482s8.299-9.828 9.406-20.072c2.06-18.688-32.086-20.119-35.129-3.876-3.59 18.356-2.905 29.214 5.578 29.214h5.717l-1.595 8.749s-5.695-.349-12.607-2.795"
                      />
                      <path
                        fill="#333739"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M163.35 80.314c4.852-4.304 21.695 21.167 16.173 27.964s-22.89-22.004-16.173-27.964"
                      />
                      <path
                        fill="#F2D9C4"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M179.334 98.304s-17.027 18.766-28.644 18.766-14.729-12.667-7.676-32.182 13.278-35.093 13.278-35.093-3.551-18.295-4.012-24.016c-.276-3.507 1.383-3.876 1.936-2.031l2.213 8.399-.553-14.582c.093-2.122 2.398-3.23 2.858-.461l1.752 13.196.554-16.057c.184-2.5 2.673-2.676 2.857 0s1.199 15.412 1.199 15.412l1.751-12.83c.37-2.675 2.952-2.215 2.768 0l.368 10.705s1.107-1.615 2.305-1.2c.826.288 1.475.74.645 4.062s-9.583 49.922-9.583 49.922 3.433-3.61 12.317 10.376c2.807 4.72 3.667 7.614 3.667 7.614"
                      />
                      <path
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m163.348 80.316-1.522 9.415M169.988 27.53c-2.145 2.746-3.528 8.075-3.528 8.075s-5.041.9-7.153 5.467"
                      />
                      <path
                        fill="#933222"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M210.464 68.412c5.439 0 7.467-4.176 8.666-8.733 1.198-4.558 3.688-13.97 3.688-13.97 1.475-4.337 9.866-4.706 7.468 2.678-1.198 4.52-6.937 11.404-5.394 14.764l1.197 2.6 7.425-10.24s7.648-11.647 7.375-18.2c-.273-6.551-5.9-8.95-11.986-7.654 0 0-1.659-8.767-7.192-9.599-5.533-.83-10.065 2.485-13.092 6.562 0 0-13.83-12.921-21.391-7.655s-3.59 13.934 4.335 17.995c0 0-6.912 11.124 6.179 10.822 0 0 1.205-8.35 1.707-9.728 1.794-6.718 23.645-6.632 21.802 3.704-1.844 10.336-3.688 16.247-7.008 16.247s-6.546-5.536-10.511-5.536-6.614 4.15-6.614 4.15-.722 11.814 7.629 11.814z"
                      />
                      <path
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M205.946 38.305c0 5.744-6.088 14.12-6.088 14.12h3.873"
                      />
                      <path
                        fill="#1F1F1F"
                        d="M211.263 45.883a.778.778 0 1 0 0-1.555.778.778 0 0 0 0 1.555M200.637 45.883a.778.778 0 1 0 0-1.555.778.778 0 0 0 0 1.555"
                      />
                      <path
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M201.934 60.7s3.804 2.423 7.608-.553M212.749 107.717l-1.416 8.878M226.275 106.065l3.181 12.181M239.551 101.857l5.113 8.612"
                      />
                      <path
                        fill="#fff"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M291.328 12.303h-41.321a5.345 5.345 0 0 0-5.342 5.347v29.427a5.345 5.345 0 0 0 5.342 5.347h41.321a5.345 5.345 0 0 0 5.343-5.347V17.65a5.345 5.345 0 0 0-5.343-5.347"
                      />
                      <path
                        fill="#C2E7FF"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M277.1 29.98v-5.147a2.095 2.095 0 0 0-2.09-2.09h-15.046a2.09 2.09 0 0 0-2.089 2.09v15.06a2.09 2.09 0 0 0 2.089 2.09h15.047a2.09 2.09 0 0 0 2.09-2.09V35.05l4.205 3.413a1.322 1.322 0 0 0 2.157-1.029v-9.832a1.33 1.33 0 0 0-.754-1.197 1.32 1.32 0 0 0-1.403.167z"
                      />
                      <path
                        fill="#fff"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M47.711 48.706c9.881 0 17.892-8.018 17.892-17.908S57.593 12.89 47.71 12.89s-17.892 8.017-17.892 17.908c0 9.89 8.01 17.908 17.892 17.908"
                      />
                      <path
                        stroke="#F42268"
                        stroke-miterlimit="10"
                        d="M300.765 117.695a18.36 18.36 0 0 1-5.576 12.888 18.33 18.33 0 0 1-13.048 5.168l-11.475-.184a18.33 18.33 0 0 1-12.767-5.64 18.36 18.36 0 0 1 .413-25.83 18.33 18.33 0 0 1 12.941-5.227l11.473.184a18.32 18.32 0 0 1 12.877 5.581 18.36 18.36 0 0 1 5.162 13.06Z"
                      />
                      <path
                        stroke="#F42268"
                        stroke-miterlimit="10"
                        d="M276.702 109.542c-11.318 0-15.09 5.394-15.09 8.739s2.572 3.561 3.502 3.561c.931 0 3.434-.285 3.434-.285 1.289-.295 2.224-.978 2.224-2.301v-4.009c2.668-.648 5.931-.634 5.931-.634s3.261-.014 5.931.634v4.009c0 1.323.937 2.006 2.223 2.301 0 0 2.507.285 3.434.285s3.504-.216 3.504-3.561-3.776-8.739-15.093-8.739Z"
                      />
                      <path
                        fill="#1F1F1F"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M106.851 87.982a6.77 6.77 0 0 0-4.069 1.361 6.8 6.8 0 0 0-2.436 3.535 7 7 0 0 0-.156.711h13.335a6.773 6.773 0 0 0-6.674-5.607"
                      />
                      <path
                        fill="#fff"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M100.185 93.593a6.8 6.8 0 0 0 1.297 5.304 6.77 6.77 0 0 0 7.551 2.29 6.78 6.78 0 0 0 4.02-3.692 6.8 6.8 0 0 0 .468-3.902z"
                      />
                      <path
                        fill="#1F1F1F"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M100.599 90.287a2.7 2.7 0 0 0 2.697-2.7 2.698 2.698 0 1 0-5.394 0c0 1.491 1.207 2.7 2.697 2.7M113.113 90.287a2.7 2.7 0 0 0 2.697-2.7 2.698 2.698 0 1 0-5.394 0c0 1.491 1.208 2.7 2.697 2.7"
                      />
                      <path
                        fill="#FFBB29"
                        stroke="#FFBB29"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M60.019 100.751 37.586 78.298a7.14 7.14 0 0 0-10.102 0L5.05 100.751a7.155 7.155 0 0 0 0 10.112l22.433 22.453a7.14 7.14 0 0 0 10.102 0l22.433-22.453a7.155 7.155 0 0 0 0-10.112"
                      />
                      <path
                        fill="#E46962"
                        stroke="#E46962"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M300.765 117.695a18.36 18.36 0 0 1-5.576 12.888 18.33 18.33 0 0 1-13.048 5.168l-11.475-.184a18.33 18.33 0 0 1-12.767-5.64 18.36 18.36 0 0 1 .413-25.83 18.33 18.33 0 0 1 12.941-5.227l11.473.184a18.32 18.32 0 0 1 12.877 5.581 18.36 18.36 0 0 1 5.162 13.06"
                      />
                      <path
                        fill="#fff"
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M276.702 109.542c-11.318 0-15.09 5.394-15.09 8.739s2.572 3.561 3.502 3.561c.931 0 3.434-.285 3.434-.285 1.289-.295 2.224-.978 2.224-2.301v-4.009c2.668-.648 5.931-.634 5.931-.634s3.261-.014 5.931.634v4.009c0 1.323.937 2.006 2.223 2.301 0 0 2.507.285 3.434.285s3.504-.216 3.504-3.561-3.776-8.739-15.093-8.739"
                      />
                      <path
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m46.278 86.975 13.73 13.856a7.2 7.2 0 0 1 2.083 5.074 7.2 7.2 0 0 1-2.082 5.074l-22.332 22.535"
                      />
                      <mask
                        id="a"
                        width="52"
                        height="52"
                        x="81"
                        y="77"
                        maskUnits="userSpaceOnUse"
                      >
                        <path
                          fill="#fff"
                          d="M106.765 128.431c13.975 0 25.304-11.34 25.304-25.328s-11.329-25.327-25.304-25.327-25.303 11.34-25.303 25.327 11.328 25.328 25.303 25.328"
                        />
                      </mask>
                      <g mask="url(#a)">
                        <path
                          fill="#fff"
                          d="M106.851 147.565c11.236 0 20.344-9.116 20.344-20.362s-9.108-20.362-20.344-20.362c-11.235 0-20.343 9.116-20.343 20.362s9.108 20.362 20.343 20.362"
                        />
                      </g>
                      <mask
                        id="b"
                        width="52"
                        height="52"
                        x="81"
                        y="77"
                        maskUnits="userSpaceOnUse"
                      >
                        <path
                          fill="#fff"
                          d="M106.765 128.431c13.975 0 25.304-11.34 25.304-25.328s-11.329-25.327-25.304-25.327-25.303 11.34-25.303 25.327 11.328 25.328 25.303 25.328"
                        />
                      </mask>
                      <g mask="url(#b)">
                        <path
                          stroke="#1F1F1F"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M106.555 147.535c11.236 0 20.344-9.116 20.344-20.362s-9.108-20.362-20.344-20.362c-11.235 0-20.343 9.116-20.343 20.362s9.108 20.362 20.343 20.362"
                        />
                      </g>
                      <path
                        stroke="#1F1F1F"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M106.765 128.43c13.975 0 25.304-11.34 25.304-25.328s-11.329-25.327-25.304-25.327-25.303 11.34-25.303 25.327 11.328 25.328 25.303 25.328"
                      />
                    </svg>
                    <h1>Connect with someone you know</h1>
                    <p>
                      Connect, collaborate, and celebrate from anywhere with
                      Google Meet
                    </p>
                  </div>
                </div>
              )}

              {callHistory.length > 0 && (
                <div className="call-history-container2">
                  <div className="history-name1">History</div>
                  {callHistory.map((call) => (
                    <CallHistoryItem
                      call={call}
                      currentUser={currentUser}
                      setIsShowCallMore={setIsShowCallMore}
                      setMorePosition={setMorePosition}
                      key={call.id}
                    />
                  ))}
                  {moreLoading && (
                    <div className="more-call-load">
                      <PageDataLoader />
                    </div>
                  )}
                  {!isLastPage && !moreLoading && (
                    <button
                      className="show-more-call-history1"
                      onClick={() => {
                        setMoreLoading(true);
                        setCurrentPageNo((prevPageNo) => prevPageNo + 1);
                      }}
                    >
                      Show more
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#000000"
                      >
                        <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeDesktop;
