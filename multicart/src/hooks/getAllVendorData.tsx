"use client";

import { AppDispatch, RootState } from "@/redux/store";
import { setAllVendorData } from "@/redux/vendorSlice";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

function getAllVendorData() {
  const dispatch = useDispatch<AppDispatch>();
  const { userData } = useSelector(
    (state: RootState) => state.user
  );

  useEffect(() => {
    const fetchAllVendors = async () => {
      try {
        const endpoint =
          userData?.role === "admin" || userData?.role === "vendor"
            ? "/api/vendor/all-vendor"
            : "/api/vendor/public-vendor";

        const result = await axios.get(endpoint);
        dispatch(setAllVendorData(result.data || []));
      } catch {
        dispatch(setAllVendorData([]));
      }
    };

    fetchAllVendors();
  }, [userData?.role, dispatch]);
}

export default getAllVendorData;
