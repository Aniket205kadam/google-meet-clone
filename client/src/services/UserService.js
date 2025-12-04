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
    const response = await this.client.get("/fetch-user");
    if (response.status != 200) {
      throw new Error("Failed to fetch call by Id");
    }
    return response.data;
  };

  fetchSuggestedUsers = async (size = 5) => {
    const { data } = await this.client.get(`/suggested-users?size=${size}`);
    return data;
  };

  fetchSearchedUsers = async (keyword, size) => {
    const { data } = await this.client.get(
      `/search?keyword=${keyword}&size=${size}`
    );
    return data;
  };

  fetchUserById = async (userId) => {
    const { data } = await this.client.get(`/u/${userId}`);
    return data;
  };

  fetchUserByEmail = async (email) => {
    const response = await this.client.get(`/email/${email}`);
    if (response.status !== 200) {
      throw new Error("Failed to fetch user by email");
    }
    return response.data;
  };
}

export default UserService;
