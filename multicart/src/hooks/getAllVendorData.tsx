'use client'
import { AppDispatch, RootState } from '@/redux/store'

import { setAllVendorData } from '@/redux/vendorSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

function getAllVendorData() {
    const dispatch = useDispatch<AppDispatch>()
    const {userData} = useSelector(
        (state: RootState) => state.user
      );
useEffect(()=>{
    const fetchAllVendor = async ()=>{
        try {
            const result = await axios.get("/api/vendor/all-vendor")
            dispatch(setAllVendorData(result.data))
            
           
        } catch (error) {
            console.log(error)
            dispatch(setAllVendorData([]))
        }

    }
    fetchAllVendor()
},[userData])
}

export default getAllVendorData
