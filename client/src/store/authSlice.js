import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: "",
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "authentication",
  initialState,
  reducers: {
    login: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = action.payload.isAuthenticated;
    },
    logout: (state) => {
      state.accessToken = "";
      state.isAuthenticated = false;
    },
    updateRefreshToken: (state, action) => {
      state.accessToken = action.payload.accessToken;
    },
  },
});

export const { login, logout, updateRefreshToken } = authSlice.actions;
export default authSlice.reducer;
