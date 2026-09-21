"use client";

import { AppDispatch } from "@/redux/store";
import { setUserData } from "@/redux/userSlice";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

function getCurrentUser() {
  const dispatch = useDispatch<AppDispatch>();
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") {
      dispatch(setUserData(null));
      return;
    }

    const fetchUser = async () => {
      try {
        const result = await axios.get("/api/currentUser");
        dispatch(setUserData(result.data));
      } catch {
        dispatch(setUserData(null));
      }
    };

    fetchUser();
  }, [status, dispatch]);
}

export default getCurrentUser;
