'use client'
import { AppDispatch, RootState } from '@/redux/store'
import { setAllProductsData } from '@/redux/vendorSlice'

import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

function getAllProductsData() {
    const dispatch = useDispatch<AppDispatch>()
    const {userData} = useSelector(
        (state: RootState) => state.user
      );
useEffect(()=>{
    const fetchAllProducts = async ()=>{
        try {
            const result = await axios.get("/api/product/all-products-data")
            dispatch(setAllProductsData(result.data))
        } catch (error) {
            console.log(error)
            dispatch(setAllProductsData([]))
        }

    }
    fetchAllProducts()
},[userData])
}

export default getAllProductsData
