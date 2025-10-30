import axios from "axios";
import AppConfig from "../config/AppConfig";

// const backendUrl = `${AppConfig.backendUrl}/api/v1/users`;
const backendUrl = "http://localhost:8080/api/v1/users";

class UserService {
  constructor(accessToken) {
    this.client = axios.create({
      baseURL: backendUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Optional: centralized error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API error:", error);
        return Promise.reject(error);
      }
    );
  }

  completeAccountAfterOAuth = async (request) => {
    const formData = new FormData();
    formData.append("fullName", request.fullName);
    if (request.birthDate) formData.append("birthDate", request.birthDate);
    if (request.profile) formData.append("profile", request.profile);

    const { data } = await this.client.post("/account/complete", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  };

  fetchUserByToken = async () => {
    const { data } = await this.client.get("/fetch-user");
    return data;
  };

  fetchSuggestedUsers = async (size = 5) => {
    const { data } = await this.client.get(`/suggested-users?size=${size}`);
    return data;
  };

  fetchSearchedUsers = async (keyword, size) => {
    const { data } = await this.client.get(`/search?keyword=${keyword}&size=${size}`);
    return data;
  };

  fetchUserById = async (userId) => {
    const { data } = await this.client.get(`/u/${userId}`);
    return data;
  }
}

export default UserService;
