"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AiOutlineSearch,
  AiOutlineUser,
  AiOutlineShoppingCart,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineHome,
  AiOutlineAppstore,
  AiOutlinePhone,
  AiOutlineShop,
  AiOutlineLogin,
  AiOutlineLogout,
} from "react-icons/ai";
import { GoListUnordered } from "react-icons/go";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import getCurrentUser from "@/hooks/getCurrentUser";
import HeaderLocation from "@/component/HeaderLocation";
import { buildLoginUrl } from "@/lib/auth-redirect";
import logo from "@/assets/logo.jpg";

interface IUserLike {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  image?: string;
  role: "user" | "vendor" | "admin";
  phone?: string;
}

export default function Navbar({ user }: { user?: IUserLike }) {
  getCurrentUser();

  const { data: session, status } = useSession();
  const reduxUser = useSelector(
    (state: RootState) => state.user.userData
  );

  const sessionUser =
    session?.user && status === "authenticated"
      ? {
          id: session.user.id,
          name: session.user.name || "MultiCart User",
          email: session.user.email || "",
          image: session.user.image || undefined,
          role: session.user.role || "user",
        }
      : undefined;

  const currentUser =
    user || reduxUser || sessionUser;

  const [openMenu, setOpenMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

  const fetchCartCount = async () => {
    try {
      const res = await axios.get("/api/cart/get");

      if (res.status === 200) {
        const cart = res.data?.cart || [];
        const totalQty = cart.reduce(
          (sum: number, item: any) => sum + Number(item.quantity || 0),
          0
        );

        setCartCount(totalQty);
      }
    } catch {
      // Guests and expired sessions naturally receive 401 from the API.
      setCartCount(0);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "user") {
      fetchCartCount();
    } else {
      setCartCount(0);
    }
  }, [currentUser?.role]);

  const closeSidebar = () => setSidebarOpen(false);

  const goToLogin = (callbackUrl?: string) => {
    router.push(buildLoginUrl(callbackUrl || window.location.pathname));
  };

  return (
    <>
      <nav className="sticky top-0 w-full bg-black/95 backdrop-blur-md text-white z-50 shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
            aria-label="Go to MultiCart home"
          >
            <motion.div whileHover={{ rotate: 10, scale: 1.1 }}>
              <Image
                src={logo}
                alt="MultiCart"
                width={40}
                height={40}
                className="rounded-full"
              />
            </motion.div>
            <span className="text-xl font-semibold hidden sm:inline">
              MultiCart
            </span>
          </button>

          {/* Desktop public storefront navigation */}
          <div className="hidden md:flex items-center gap-6 flex-1 min-w-0">
            <NavItem label="Home" path="/" router={router} />
            <NavItem label="Categories" path="/category" router={router} />
            <NavItem label="Shop" path="/shop" router={router} />

            {currentUser?.role === "user" && (
              <>
                <HeaderLocation
                  userId={String(currentUser._id || currentUser.id || currentUser.email)}
                  defaultRecipientName={currentUser.name}
                  defaultPhone={currentUser.phone || ""}
                />
                <NavItem label="Orders" path="/orders" router={router} />
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4 ml-auto">
            <IconBtn
              Icon={AiOutlineSearch}
              onClick={() => router.push("/category")}
              label="Search"
            />

            <IconBtn
              Icon={AiOutlinePhone}
              onClick={() => router.push("/support")}
              label="Support"
            />

            <CartBtn router={router} count={cartCount} />

            {!currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => goToLogin()}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenu((value) => !value)}
                  className="rounded-full"
                  aria-label="Account menu"
                >
                  {currentUser.image ? (
                    <Image
                      src={currentUser.image}
                      alt={currentUser.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover border border-gray-700"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:bg-white/10">
                      <AiOutlineUser size={22} />
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {openMenu && (
                    <ProfileDropdown
                      router={router}
                      close={() => setOpenMenu(false)}
                      role={currentUser.role}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            <IconBtn
              Icon={AiOutlineSearch}
              onClick={() => router.push("/category")}
              label="Search"
            />
            <IconBtn
              Icon={AiOutlinePhone}
              onClick={() => router.push("/support")}
              label="Support"
            />
            <CartBtn router={router} count={cartCount} />

            {!currentUser && (
              <button
                type="button"
                onClick={() => goToLogin()}
                className="px-3 py-2 rounded-lg bg-blue-600 text-xs font-semibold"
              >
                Login
              </button>
            )}

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1 hover:bg-white/10"
              aria-label="Open navigation menu"
            >
              <AiOutlineMenu size={28} />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar
            close={closeSidebar}
            router={router}
            authenticated={Boolean(currentUser)}
            role={currentUser?.role}
          />
        )}
      </AnimatePresence>
    </>
  );
}

const NavItem = ({
  label,
  path,
  router,
}: {
  label: string;
  path: string;
  router: ReturnType<typeof useRouter>;
}) => (
  <button
    type="button"
    onClick={() => router.push(path)}
    className="text-sm hover:text-blue-300 transition whitespace-nowrap"
  >
    {label}
  </button>
);

const IconBtn = ({
  Icon,
  onClick,
  label,
}: {
  Icon: any;
  onClick: () => void;
  label: string;
}) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.08 }}
    onClick={onClick}
    aria-label={label}
    title={label}
  >
    <Icon size={23} />
  </motion.button>
);

const CartBtn = ({
  router,
  count,
}: {
  router: ReturnType<typeof useRouter>;
  count: number;
}) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.08 }}
    onClick={() => router.push("/cart")}
    className="relative"
    aria-label="Cart"
  >
    <AiOutlineShoppingCart size={24} />

    {count > 0 && (
      <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
        {count > 99 ? "99+" : count}
      </span>
    )}
  </motion.button>
);

const ProfileDropdown = ({
  router,
  close,
  role,
}: {
  router: ReturnType<typeof useRouter>;
  close: () => void;
  role: "user" | "vendor" | "admin";
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="absolute right-0 mt-3 w-52 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 bg-[#141414]/95 overflow-hidden"
  >
    <DropdownBtn
      Icon={AiOutlineHome}
      label="Home"
      onClick={() => router.push("/")}
      close={close}
    />

    <DropdownBtn
      Icon={AiOutlineUser}
      label="Profile"
      onClick={() => router.push("/profile")}
      close={close}
    />

    {role === "user" && (
      <DropdownBtn
        Icon={GoListUnordered}
        label="Orders"
        onClick={() => router.push("/orders")}
        close={close}
      />
    )}

    <DropdownBtn
      Icon={AiOutlineLogout}
      label="Sign Out"
      onClick={() => signOut({ callbackUrl: "/" })}
      close={close}
    />
  </motion.div>
);

const DropdownBtn = ({
  Icon,
  label,
  onClick,
  close,
}: {
  Icon: any;
  label: string;
  onClick: () => void;
  close: () => void;
}) => (
  <button
    type="button"
    onClick={() => {
      onClick();
      close();
    }}
    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 text-left text-sm"
  >
    <Icon size={18} />
    {label}
  </button>
);

const Sidebar = ({
  close,
  router,
  authenticated,
  role,
}: {
  close: () => void;
  router: ReturnType<typeof useRouter>;
  authenticated: boolean;
  role?: "user" | "vendor" | "admin";
}) => (
  <motion.div
    initial={{ x: "100%" }}
    animate={{ x: 0 }}
    exit={{ x: "100%" }}
    transition={{ type: "spring", stiffness: 200, damping: 24 }}
    className="fixed inset-y-0 right-0 w-[78%] sm:w-[55%] bg-black/95 backdrop-blur-xl p-6 text-white z-[60] border-l border-white/10"
  >
    <div className="flex justify-between items-center mb-7">
      <h2 className="text-xl font-semibold">Menu</h2>
      <button
        type="button"
        onClick={close}
        aria-label="Close menu"
        className="p-1"
      >
        <AiOutlineClose size={28} />
      </button>
    </div>

    <div className="flex flex-col gap-3">
      <SidebarLink
        Icon={AiOutlineHome}
        label="Home"
        path="/"
        router={router}
        close={close}
      />
      <SidebarLink
        Icon={AiOutlineAppstore}
        label="Categories"
        path="/category"
        router={router}
        close={close}
      />
      <SidebarLink
        Icon={AiOutlineShop}
        label="Shop"
        path="/shop"
        router={router}
        close={close}
      />
      <SidebarLink
        Icon={AiOutlineShoppingCart}
        label="Cart"
        path="/cart"
        router={router}
        close={close}
      />
      <SidebarLink
        Icon={GoListUnordered}
        label="Orders"
        path="/orders"
        router={router}
        close={close}
      />
      <SidebarLink
        Icon={AiOutlinePhone}
        label="Support"
        path="/support"
        router={router}
        close={close}
      />
      <SidebarLink
        Icon={AiOutlineUser}
        label="Profile"
        path="/profile"
        router={router}
        close={close}
      />

      {!authenticated ? (
        <>
          <SidebarLink
            Icon={AiOutlineLogin}
            label="Login"
            path="/login"
            router={router}
            close={close}
          />
          <SidebarLink
            Icon={AiOutlineUser}
            label="Create account"
            path="/signup"
            router={router}
            close={close}
          />
        </>
      ) : (
        <>
          {(role === "vendor" || role === "admin") && (
            <SidebarLink
              Icon={role === "admin" ? AiOutlineAppstore : AiOutlineShop}
              label="Dashboard"
              path="/"
              router={router}
              close={close}
            />
          )}

          <SidebarSignOut
            Icon={AiOutlineLogout}
            label="Sign Out"
            close={close}
          />
        </>
      )}
    </div>
  </motion.div>
);

const SidebarLink = ({
  Icon,
  label,
  path,
  router,
  close,
}: {
  Icon: any;
  label: string;
  path: string;
  router: ReturnType<typeof useRouter>;
  close: () => void;
}) => (
  <button
    type="button"
    onClick={() => {
      router.push(path);
      close();
    }}
    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/10 text-left border border-white/5"
  >
    <Icon size={20} />
    {label}
  </button>
);

const SidebarSignOut = ({
  Icon,
  label,
  close,
}: {
  Icon: any;
  label: string;
  close: () => void;
}) => (
  <button
    type="button"
    onClick={() => {
      signOut({ callbackUrl: "/" });
      close();
    }}
    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/10 text-left border border-white/5"
  >
    <Icon size={20} />
    {label}
  </button>
);
