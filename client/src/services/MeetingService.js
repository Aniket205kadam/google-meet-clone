import axios from "axios";
import AppConfig from "../config/AppConfig";

const backendUrl = "http://localhost:8080/api/v1/meetings";

class MeetingService {
  constructor(accessToken) {
    this.client = axios.create({
      baseURL: backendUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API error:", error);
        return Promise.reject(error);
      }
    );
  }

  createMeeting = async () => {
    const response = await this.client.post();
    if (response.status != 200) {
      throw new Error("Failed to create meeting");
    }
    return response.data;
  };

  isAdmin = async (meetingCode) => {
    const response = await this.client.get(`/${meetingCode}/is/admin`);
    if (response.status != 200) {
      throw new Error("Failed to fetch admin details");
    }
    return response.data;
  };

  getMeetingParticipants = async (meetingCode) => {
    const response = await this.client.get(`/${meetingCode}/participants`);
    if (response.status != 200) {
      throw new Error("Failed to fetch participant of the meeting");
    }
    return response.data;
  };

  getMeetingParticipantsAll = async (meetingCode) => {
    const response = await this.client.get(`/${meetingCode}/participants/all`);
    if (response.status != 200) {
      throw new Error("Failed to fetch participant of the meeting");
    }
    return response.data;
  };

  addInMeeting = async (meetingCode) => {
    const response = await this.client.patch(`/${meetingCode}/add`);
    if (response.status != 200) {
      throw new Error("Failed to add in meeting!");
    }
  };

  currentUserHasPermission = async (meetingCode) => {
    const response = await this.client.get(
      `/${meetingCode}/has/permission/to/join`
    );
    if (response.status != 200) {
      throw new Error("Failed to get user info");
    }
    return response.data;
  };

  getPermissionFromAdmin = async (meetingCode) => {
    const response = await this.client.patch(
      `/${meetingCode}/admin/permission`
    );
    if (response.status != 200) {
      throw new Error("Failed to get admin permission!");
    }
  };

  getWaitingUsersInMeeting = async (meetingCode) => {
    const response = await this.client.get(`/${meetingCode}/waiting/users`);
    if (response.status != 200) {
      throw new Error("Failed to fetch waiting users!");
    }
    return response.data;
  };

  generatePermissionByAdmin = async (meetingCode, userIds) => {
    const response = await this.client.patch(
      `/${meetingCode}/add/in/meeting`,
      userIds
    );
    if (response.status != 200) {
      throw new Error("Failed to generate permission to waiting users!");
    }
  };

  isExist = async (meetingCode) => {
    const response = await this.client.get(`/${meetingCode}/is/exist`);
    if (response.status != 200) {
      throw new Error("Failed to find is meeting exist or not.");
    }
    return response.data;
  };

  leftFromMeeting = async (meetingCode) => {
    const response = await this.client.patch(`/${meetingCode}/remove`);
    if (response.status != 200) {
      throw new Error("Failed to left the meeting.");
    }
  };
}

export default MeetingService;
