'use client'
import React from 'react'
import AdminDashbordLayout from './AdminDashboardLayout'
import getCurrentUser from '@/hooks/getCurrentUser'




function AdminDashboard() {
  getCurrentUser()
  return (
    <div className='w-full min-h-screen pt-15'>
    
      <AdminDashbordLayout/>
    </div>
  )
}

export default AdminDashboard
