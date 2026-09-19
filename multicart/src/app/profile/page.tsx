"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AiOutlineUser } from "react-icons/ai";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import { setUserData } from "@/redux/userSlice";
import getCurrentUser from "@/hooks/getCurrentUser";


export default function ProfilePage() {
  const router = useRouter();
  getCurrentUser()
  const user = useSelector((state: RootState) => state.user.userData);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditShop, setShowEditShop] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [shopName, setShopName] = useState(user?.shopName || "");
  const [businessAddress, setBusinessAddress] = useState(user?.businessAddress || "");
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || "");

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState(
    user?.image || "/default-user.png"
  );
  const [loading, setLoading] = useState(false)
  const [loading1, setLoading1] = useState(false)
  const dispatch = useDispatch<AppDispatch>()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleUpdateProfile = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);

    if (profileImage) {
      formData.append("image", profileImage);
    }

    setLoading(true);
    try {
      const result = await axios.post(
        "/api/user/edit-user-profile",
        formData
      );

      // ✅ Redux userData update
      dispatch(setUserData(result.data));

      // ✅ Form close automatically
      setShowEditProfile(false);

      // ✅ Reset image state
      setProfileImage(null);

      setLoading(false);
      alert("Profile updated successfully ✅");
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert("Profile update failed ❌");
    }
  };

  const handleEditShopDetails = async () => {
    if (!shopName || !businessAddress || !gstNumber) {
      alert("All fields are required");
      return;
    }
    setLoading1(true);
    try {


      await axios.post("/api/vendor/verify-again", {
        shopName,
        businessAddress,
        gstNumber,
      });

      alert("Verification request sent again ✅");
      setLoading(false)
      router.push("/")
    } catch (error) {
      console.log(error);
      alert("Failed to send verification ❌");
      setLoading(false)
    }
  }



  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 pt-24 pb-10"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md p-6 sm:p-10 rounded-2xl border border-white/20 shadow-xl"
      >
        {/* ✅ PROFILE HEADER */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-white/30"
          >
            {user?.image ? (
              <Image
                src={previewImage}
                alt="profile"
                width={120}
                height={120}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <AiOutlineUser size={48} className="text-white" />
              </div>
            )}

          </motion.div>

          <motion.h2 className="text-2xl sm:text-3xl font-bold mt-4">
            {user.name}
          </motion.h2>

          <p className="text-gray-300 text-sm sm:text-base">{user.email}</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Role: {user.role}
          </p>
        </div>

        {/* ✅ DETAILS */}
        <div className="mt-8 space-y-3 text-sm sm:text-base">
          <p><b>Phone:</b> {user.phone || "-"}</p>

          {user.role === "vendor" && (
            <>
              <p><b>Shop Name:</b> {user.shopName}</p>
              <p><b>Shop Address:</b> {user.businessAddress}</p>
              <p><b>GST No:</b> {user.gstNumber}</p>
            </>
          )}
        </div>

        {/* ✅ ACTION BUTTONS */}
        <div className="grid grid-cols-1 gap-4 mt-8">
          {/* ✅ MY ORDERS ONLY FOR USER (NOT VENDOR, NOT ADMIN) */}
          {user.role === "user" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/orders")}
              className="bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold"
            >
              My Orders
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setShowEditProfile(true);
              setShowEditShop(false);
            }}
            className="bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold"
          >
            Edit Profile
          </motion.button>

          {user.role === "vendor" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setShowEditShop(true);
                setShowEditProfile(false);
              }}
              className="bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold"
            >
              Edit Shop Details
            </motion.button>
          )}
        </div>

        {/* ✅ EDIT PROFILE FORM */}
        <AnimatePresence>
          {showEditProfile && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="mt-10 bg-white/5 p-5 sm:p-6 rounded-xl border border-white/20"
            >
              <h3 className="text-xl font-bold mb-5">Edit Profile</h3>

              <div className="flex flex-col items-center mb-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-24 h-24 rounded-full overflow-hidden border border-white/30 mb-3"
                >
                  <Image
                    src={previewImage}
                    alt="Select Image"
                    width={120}
                    height={120}
                    className="object-cover w-full h-full"
                  />
                </motion.div>

                <label className="cursor-pointer bg-blue-600 px-4 py-2 rounded-lg text-sm">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <div className="space-y-4">
                <input
                  className="w-full p-3 bg-white/10 border border-white/20 rounded"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                />

                <input
                  className="w-full p-3 bg-white/10 border border-white/20 rounded"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                />

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg mt-3" onClick={handleUpdateProfile}
                >
                  {loading ? <ClipLoader size={20} color="white" /> : "Update Profile"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ EDIT SHOP FORM */}
        <AnimatePresence>
          {showEditShop && user.role === "vendor" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="mt-10 bg-white/5 p-5 sm:p-6 rounded-xl border border-white/20"
            >
              <h3 className="text-xl font-bold mb-3">Edit Shop Details</h3>

              {/* ✅ NOTE ADDED */}
              <p className="text-yellow-400 text-sm mb-4">
                ⚠ After updating shop details, admin verification will take
                2–3 hours again.
              </p>

              <div className="space-y-4">
                <input
                  className="w-full p-3 bg-white/10 border border-white/20 rounded"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Shop Name"
                />

                <input
                  className="w-full p-3 bg-white/10 border border-white/20 rounded"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Shop Address"
                />

                <input
                  className="w-full p-3 bg-white/10 border border-white/20 rounded"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="GST Number"
                />

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg mt-3"
                  onClick={handleEditShopDetails}
                >
                  {loading1 ? <ClipLoader size={20} color="white" /> : "Update Shop Details"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
