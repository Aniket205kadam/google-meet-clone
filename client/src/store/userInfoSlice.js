import { createSlice } from "@reduxjs/toolkit";

const userInfoSlice = createSlice({
  name: "userInfo",
  initialState: {
    id: "",
    fullName: "",
    email: "",
    birthDate: "",
    profile: "",
  },
  reducers: {
    loadUserInfo: (state, action) => {
      state.id = action.payload.id;
      state.fullName = action.payload.fullName;
      state.email = action.payload.email;
      state.birthDate = action.payload.birthDate;
      state.profile = action.payload.profile;
    },
  },
});

export const { loadUserInfo } = userInfoSlice.actions;
export default userInfoSlice.reducer;