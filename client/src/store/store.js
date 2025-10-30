import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import userInfo from "./userInfoSlice";

const store = configureStore({
  reducer: {
    authentication: authSlice,
    userInfo: userInfo,
  },
});

export default store;
