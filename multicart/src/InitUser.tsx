'use client'
import React from 'react'
import getCurrentUser from './hooks/getCurrentUser'
import getAllProductsData from './hooks/getAllProductsData'
import getAllVendorData from './hooks/getAllVendorData'
import getAllOrdersData from './hooks/getAllOrderData'


function InitUser() {
  getCurrentUser()
 getAllProductsData()
 getAllVendorData()
 getAllOrdersData()
  return null
}

export default InitUser
