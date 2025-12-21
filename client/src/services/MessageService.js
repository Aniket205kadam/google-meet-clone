import axios from "axios";
import AppConfig from "../config/AppConfig";

const backendUrl = `${AppConfig.backendUrl}/api/v1/messages`;

class MessageService {
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

  sendMessage = async (callId, content) => {
    const response = await this.client.post(`/send/message/call/${callId}`, {
      content,
    });
    if (response.status != 200) {
      throw new Error("Failed to send message.");
    }
    return response.data;
  };

  getAllMessagesByCallId = async (callId) => {
    const response = await this.client.get(`/call/${callId}`);
    if (response.status != 200) {
      throw new Error("Failed to send message.");
    }
    return response.data;
  };
}

export default MessageService;
