'use client'
import React from 'react'
import Slider from './slider'
import CategoriesSlider from './categories'
import ProductsPageForUserInterface from './productPageForUserInterface'
import ShopsPage from '@/app/shop/page'

function UserDashboard() {
  return (
    <div className="w-full flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 font-sans flex-col ">

        <Slider/>
        <CategoriesSlider/>
        <ProductsPageForUserInterface/>
        <ShopsPage/>
      
    </div>
  )
}

export default UserDashboard

