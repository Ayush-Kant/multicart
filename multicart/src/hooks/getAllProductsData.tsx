"use client";

import { AppDispatch, RootState } from "@/redux/store";
import { setAllProductsData } from "@/redux/vendorSlice";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

function getAllProductsData() {
  const dispatch = useDispatch<AppDispatch>();
  const { userData } = useSelector(
    (state: RootState) => state.user
  );

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const endpoint =
          userData?.role === "admin" || userData?.role === "vendor"
            ? "/api/product/all-products-data"
            : "/api/product/public-products";

        const result = await axios.get(endpoint);

        dispatch(
          setAllProductsData(
            Array.isArray(result.data)
              ? result.data
              : result.data.products || []
          )
        );
      } catch {
        dispatch(setAllProductsData([]));
      }
    };

    fetchAllProducts();
  }, [userData?.role, dispatch]);
}

export default getAllProductsData;
