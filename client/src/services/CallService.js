import axios from "axios";
import AppConfig from "../config/AppConfig";

const backendUrl = `http://localhost:8080/api/v1/calls`;

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
}

export default CallService;
