import React, { useEffect, useState } from "react";
import "./AddUser.css";
import { useSelector } from "react-redux";
import MeetingService from "../../../services/MeetingService";
import UserService from "../../../services/UserService";
import Loader2 from "../../../utils/loader/loading/Loader2";
import { toast } from "react-toastify";
import { useWindowWidth } from "../../../hooks/useWindowWidth";

const AddUser = ({ meetingCode, setIsShowParticipantsInfo }) => {
  const [currentUser, setCurrentUser] = useState();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [inCallUsers, setInCallUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useSelector((state) => state.authentication);
  const meetingService = new MeetingService(accessToken);
  const userService = new UserService(accessToken);

  const screenWidth = useWindowWidth();

  const fetchWaitingUsers = async () => {
    try {
      const response = await meetingService.getWaitingUsersInMeeting(
        meetingCode
      );
      console.log("waiting", response);
      setWaitingUsers(response);
    } catch (error) {
      console.error("Failed to fetch waiting users");
    }
  };

  const fetchMeetingParticipants = async () => {
    try {
      const response = await meetingService.getMeetingParticipantsAll(
        meetingCode
      );
      console.log("participant", response);
      setInCallUsers(response);
    } catch (error) {
      console.error("Failed to fetch participants users");
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await userService.fetchUserByToken();
      setCurrentUser(response);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch current user");
    }
  };

  const findIsAdminUser = async () => {
    try {
      const response = await meetingService.isAdmin(meetingCode);
      setUserIsAdmin(response);
    } catch (error) {
      console.error("Failed to fetch admin info");
    }
  };

  const generatePermission = async (user) => {
    try {
      await meetingService.generatePermissionByAdmin(meetingCode, [user.id]);
      setWaitingUsers((users) => users.filter((u) => u.id !== user.id));
      setInCallUsers((users) => [
        ...users,
        {
          id: user.id,
          user: user,
          admin: false,
          muted: false,
        },
      ]);
    } catch (error) {
      toast.error(`Failed to generate permission for ${user.fullName}`);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchWaitingUsers();
    fetchMeetingParticipants();
    findIsAdminUser();
  }, []);

  return (
    <div className="meeting-add-user-container1">
      <div className="add-user-heading">
        <div
          className="add-user-heading-back"
          onClick={() => setIsShowParticipantsInfo(false)}
        >
          {screenWidth > 500 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="30px"
              viewBox="0 -960 960 960"
              width="30px"
              fill="#e3e3e3"
            >
              <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
            </svg>
          )}
        </div>
        <span className="meeting-code1">{meetingCode}</span>
      </div>
      <div className="add-user-navigation">
        <span className="navigation-option">People</span>
        <span className="navigation-option">information</span>
        <span className="navigation-option">Tools</span>
      </div>

      <div className="line21">
        <div className="option-active"></div>
        <div className="option-active" style={{ opacity: "0" }}></div>
        <div className="option-active" style={{ opacity: "0" }}></div>
      </div>

      {/* page 1 */}
      {loading ? (
        <div className="loading-page1">
          <Loader2 width="40px" height="40px" />
        </div>
      ) : (
        <div className="options-page1">
          <div className="search-user-in-call">
            <div className="search-input2">
              <div className="search-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for someone in this call"
                className="input-s3"
              />
            </div>
            <div className="add-user2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z" />
              </svg>
            </div>
          </div>

          <div className="in-call-persons-info">
            {userIsAdmin && waitingUsers.length > 0 && (
              <div className="waiting-persons-container">
                <span className="info2">Waiting to join</span>
                {waitingUsers.map((waitingUser) => (
                  <div className="waiting-user1" key={waitingUser.id}>
                    <div className="waiting-left">
                      <div className="waiting-user-profile">
                        <img src={waitingUser.profile} />
                        <div className="profile-dot1"></div>
                      </div>
                      <span className="waiting-user-name">
                        {waitingUser.fullName}
                      </span>
                    </div>
                    <div className="waiting-right">
                      <div
                        className="user-add-option"
                        onClick={() => generatePermission(waitingUser)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#e3e3e3"
                        >
                          <path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z" />
                        </svg>
                      </div>
                      <div className="waiting-user-more-options">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#e3e3e3"
                        >
                          <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="joined-persons-container">
              <span className="info2">In call</span>

              {inCallUsers.map((participant) => (
                <div className="participant1" key={participant.id}>
                  <div className="participant-left">
                    <div className="participant-profile">
                      <img src={participant.user.profile} />
                      <div className="profile-dot1"></div>
                    </div>
                    <div className="participant-info">
                      <span className="participant-name">
                        {participant.user.fullName}
                        {participant.user.id === currentUser.id && <p>(You)</p>}
                      </span>
                      {participant.admin && (
                        <span className="host1">Meeting host</span>
                      )}
                    </div>
                  </div>
                  <div
                    className="participant-right"
                    style={
                      participant.user.id === currentUser.id
                        ? { display: "none" }
                        : {}
                    }
                  >
                    <div
                      className="participant-mic"
                      style={
                        userIsAdmin
                          ? { cursor: "pointer" }
                          : { pointerEvents: "none" }
                      }
                    >
                      {participant.muted ? (
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#e3e3e3"
                          >
                            <path d="m710-362-58-58q14-23 21-48t7-52h80q0 44-13 83.5T710-362ZM480-594Zm112 112-72-72v-206q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v126l-80-80v-46q0-50 35-85t85-35q50 0 85 35t35 85v240q0 11-2.5 20t-5.5 18ZM440-120v-123q-104-14-172-93t-68-184h80q0 83 57.5 141.5T480-320q34 0 64.5-10.5T600-360l57 57q-29 23-63.5 39T520-243v123h-80Zm352 64L56-792l56-56 736 736-56 56Z" />
                          </svg>
                        </div>
                      ) : (
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#e3e3e3"
                          >
                            <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div
                      className="participant-more-options"
                      style={userIsAdmin ? {} : { display: "none" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#e3e3e3"
                      >
                        <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUser;
