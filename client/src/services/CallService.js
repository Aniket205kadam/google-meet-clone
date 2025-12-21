import axios from "axios";
import AppConfig from "../config/AppConfig";

const backendUrl = `${AppConfig.backendUrl}/api/v1/calls`;

class CallService {
  constructor(accessToken) {
    this.client = axios.create({
      baseURL: backendUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  initiateCall = async (request) => {
    const response = await this.client.post("/call/initiate", request);
    return response.data;
  };

  ringingCall = async (request) => {
    await this.client.post("/call/ringing", request);
  };

  endCall = async (callId) => {
    await this.client.post(`/call/end/${callId}`);
  };

  rejectCall = async (callId) => {
    await this.client.post(`/call/reject/${callId}`);
  };

  acceptCall = async (callId) => {
    return await this.client.post(`/call/accept/${callId}`);
  };

  fetchCallById = async (callId) => {
    const response = await this.client.get(`/details/call-id/${callId}`);
    if (response.status != 200) {
      throw new Error("Failed to fetch call by Id");
    }
    return response.data;
  };

  receiverReady = async (callId) => {
    const response = await this.client.get(`/call/${callId}/receiver/ready`);
    if (response.status != 200) {
      throw new Error("Failed to send ready message by user");
    }
  };

  finishCall = async (callId) => {
    const response = await this.client.post(`/call/finish/${callId}`);
    if (response.status != 200) {
      throw new Error("Failed to finish the call");
    }
  };

  toggleCamera = async (callId, action) => {
    const response = await this.client.get(`/call/${callId}/camera`, {
      params: { action },
    });
    if (response.status != 200) {
      throw new Error("Failed to toggle camera");
    }
  };

  toggleMic = async (callId, action) => {
    const response = await this.client.get(`/call/${callId}/mic`, {
      params: { action },
    });
    if (response.status != 200) {
      throw new Error("Failed to toggle mic");
    }
  };

  sendUserReaction = async (callId, emoji) => {
    const response = await this.client.get(`/call/${callId}/reaction`, {
      params: { emoji },
    });
    if (response.status != 200) {
      throw new Error("Failed to send reaction");
    }
  };

  sendUserHandAction = async (callId, action) => {
    const response = await this.client.get(`/call/${callId}/hand/raised`, {
      params: { action },
    });
    if (response.status != 200) {
      throw new Error("Failed to send hand action");
    }
  };

  fetchCallHistory = async (page, size) => {
    const response = await this.client.get("/details/all", { params: { page, size } });
    if (response.status != 200) {
      throw new Error("Failed to fetch calls");
    }
    return response.data;
  };
}

export default CallService;
