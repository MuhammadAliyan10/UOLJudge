import { getSystemSetting } from "@/features/admin/server-actions/admin-settings";
import LoginClient from "@/app/login/LoginClient";
import { AlertTriangle } from "lucide-react";

export default async function LoginPage() {
  // Check if maintenance mode is enabled
  const maintenanceMode = await getSystemSetting("MAINTENANCE_MODE");
  const isMaintenanceMode = maintenanceMode === "true";

  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Card Container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-slate-100">
            {/* Logo */}
            <img
              src="/Logo.png"
              alt="UOLJudge"
              className="w-20 h-20 mx-auto mb-6 opacity-80"
            />

            {/* Icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-orange-500" />
            </div>

            {/* Content */}
            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              System Under Maintenance
            </h1>
            <p className="text-lg text-orange-600 font-medium mb-4">
              We'll be back shortly
            </p>
            <p className="text-slate-500 mb-6">
              The system is currently undergoing scheduled maintenance.
              <br />
              Please check back later.
            </p>

            {/* Footer */}
            <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
              If you're an administrator, please contact the system admin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal login page
  return <LoginClient />;
}
