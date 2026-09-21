import { auth } from "@/auth";
import AdminDashboard from "@/component/adminDashboard";
import EditVendorDetails from "@/component/editVendorDetails";
import Footer from "@/component/footer";
import UserDashboard from "@/component/userDashboard";
import VenderDashboard from "@/component/venderDashboard";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

function PublicStorefront() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <UserDashboard />
      <Footer />
    </div>
  );
}

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return <PublicStorefront />;
  }

  await connectDb();

  const user = await User.findById(session.user.id);

  if (!user) {
    return <PublicStorefront />;
  }

  const plainUser = JSON.parse(JSON.stringify(user));

  if (user.role === "vendor") {
    const incompleteVendorProfile =
      !user.shopName || !user.businessAddress || !user.gstNumber;

    if (incompleteVendorProfile) {
      return <EditVendorDetails />;
    }

    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <VenderDashboard user={plainUser} />
        <Footer user={plainUser} />
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <AdminDashboard />
        <Footer user={plainUser} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <UserDashboard />
      <Footer user={plainUser} />
    </div>
  );
}
