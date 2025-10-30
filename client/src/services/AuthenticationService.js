import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/authentication";

export const loginWithOAuth = async (googleToken) => {
  const response = await axios.post(
    `${API_URL}/login`,
    new URLSearchParams({ "google-id": googleToken }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      withCredentials: true,
    }
  );
  return response;
};

export const getNewAccessToken = async () => {
  try {
    const response = await axios.get(`${API_URL}/refresh`, {
      withCredentials: true,
    });
    return response.data.accessToken;
  } catch (error) {
    return null;
  }
};

// For render
export const startServer = async () => {
  try {
    const response = await axios.get(`${API_URL}/start-server`, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response;
  } catch (error) {
    return null;
  }
};
