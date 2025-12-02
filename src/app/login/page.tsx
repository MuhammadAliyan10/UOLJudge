import { getSystemSetting } from "@/features/admin/server-actions/admin-settings";
import LoginClient from "@/app/login/LoginClient";
import { AlertTriangle } from "lucide-react";


export default async function LoginPage() {
  // Check if maintenance mode is enabled
  const maintenanceMode = await getSystemSetting("MAINTENANCE_MODE");
  const isMaintenanceMode = maintenanceMode === "true";

  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="animate-in zoom-in duration-700">
            <div className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mb-6 shadow-lg">
              <AlertTriangle className="w-20 h-20 text-orange-600" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
              System Under Maintenance
            </h1>
            <p className="text-xl md:text-2xl text-orange-600 font-semibold">
              We'll be back shortly
            </p>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              The system is currently undergoing scheduled maintenance. Please check back later.
            </p>
          </div>

          <div className="pt-4">
            <p className="text-sm text-slate-400">
              If you're an administrator, please contact the system admin for access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal login page
  return <LoginClient />;
}