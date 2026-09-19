"use client";

import { AppDispatch, RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import axios from "axios";
import { setAllOrderData } from "@/redux/orderSlice"; // 👈 आपकी redux file

function getAllOrdersData() {
  const dispatch = useDispatch<AppDispatch>();

  const { userData } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const res = await axios.get("/api/order/allOrder");
        dispatch(setAllOrderData(res.data.orders));
      } catch (error) {
        console.log("ALL ORDERS FETCH ERROR:", error);
        dispatch(setAllOrderData([]));
      }
    };

    fetchAllOrders();
  }, [userData]);
}

export default getAllOrdersData;
