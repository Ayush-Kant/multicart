
import { auth } from "@/auth";
import AdminDashboard from "@/component/adminDashboard";

import EditRolePhone from "@/component/editRolePhone";
import EditVendorDetails from "@/component/editVendorDetails";
import Footer from "@/component/footer";
import Navbar from "@/component/nav";
import UserDashboard from "@/component/userDashboard";
import VenderDashboard from "@/component/venderDashboard";

import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { redirect } from "next/navigation";



export default async function Home() {
  await connectDb()
  const session = await auth()
  const user = await User.findById(session?.user?.id)
  if(!user){
    redirect("/login")
  }
  const inComplete = !user.role || !user.phone || (!user.phone && user.role == "user")
  if(inComplete){
    return <EditRolePhone/>
  }

  if(user.role == 'vendor'){
    const inCompleteDetails = !user.shopName || !user.businessAddress || !user.gstNumber
    if(inCompleteDetails){
      return <EditVendorDetails/>
    }
  }

  const plainUser = JSON.parse(JSON.stringify(user))

  return (
   
    <div className=" flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 font-sans flex-col ">
    <Navbar user = {plainUser}/>
    {user.role == "user" ?(<UserDashboard/>) : user.role == "admin" ?(<AdminDashboard/>) : <VenderDashboard user = {plainUser}/>}
     <Footer user = {plainUser}/>
     
    </div>
    
  );
}
