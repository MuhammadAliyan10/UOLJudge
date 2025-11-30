"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@/lib/schemas";
import { loginAction } from "@/server/actions/auth/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/features/shared/ui/card";

import { Button } from "@/features/shared/ui/button";
import { Input } from "@/features/shared/ui/input";
import { Label } from "@/features/shared/ui/label";
import { Alert, AlertDescription } from "@/features/shared/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginAction(data.username, data.password);

      if (!result.success) {
        setError(result.error || "Login failed");
        setIsLoading(false);
        return;
      }

      router.push(result.data?.redirectTo || "/");
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const features = [
    "Real-time automated code evaluation",
    "Professional jury grading system",
    "Complete contest management suite",
    "Advanced analytics and leaderboards"
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-[60%_40%] bg-white">
      {/* Left Side - Hero Section with Image */}
      <motion.div
        className="relative overflow-hidden"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/Login.jpg"
            alt="UOLJudge Platform"
            className="w-full h-full object-cover "
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-12 flex flex-col justify-center min-h-screen max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              UOL Judge
            </h1>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Enterprise-grade competitive programming platform for offline contests.
              Secure, scalable, and built for educational excellence.
            </p>
          </motion.div>

          {/* Features List */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              >
                <div className="mt-1 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-blue-50 text-lg">{feature}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            {[
              { label: "Active Users", value: "1000+" },
              { label: "Contests", value: "100+" },
              { label: "Problems", value: "500+" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div
        className="flex items-center justify-center p-8 lg:p-12"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="border-gray-200 shadow-2xl">
              <CardHeader className="space-y-1 pb-6 text-center">
                <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Sign in to access the UOL Judge platform
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      autoComplete="off"
                      placeholder="Enter your username"
                      className="h-11 transition-all duration-200 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register("username")}
                    />
                    {errors.username && (
                      <p className="text-sm text-red-600 font-medium">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="off"
                      placeholder="Enter your password"
                      className="h-11 transition-all duration-200 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600 font-medium">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-primary transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col items-center gap-4 pt-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure  authentication
                </div>
              </CardFooter>
            </Card>

            <p className="text-center text-sm text-gray-500 mt-6">
              LAN Deployment • University of Lahore Programming Judge
            </p>
          </motion.div>
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}