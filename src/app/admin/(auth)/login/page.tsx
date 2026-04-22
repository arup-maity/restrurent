"use client";
import React, { useState } from "react";

import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

import Link from "next/link";
import { handleApiError } from "@/utils";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/config/axios";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";

const schemaValidation = z.object({
   email: z.string().email().min(1, "Enter your email"),
   password: z.string().min(8, "Password must be at least 8 characters").max(25, "Password must not exceed 25 characters"),
});
type formType = z.infer<typeof schemaValidation>;
const LoginPage = () => {
   const router = useRouter();
   const [showPassword, setShowPassword] = useState(false);
   const defaultValues = { email: "", password: "", remeberMe: false };

   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<formType>({
      defaultValues,
      mode: "onSubmit",
      resolver: zodResolver(schemaValidation),
   });
   const loginMutation = useMutation({
      mutationKey: ["admin-login"],
      mutationFn: (data: formType) => axiosInstance.post(`/auth/admin-login`, data).then((res) => res.data),
      onSuccess: (data) => {
         if (data?.success) {
            router.push("/admin");
            toast.success("Login successfully");
         }
      },
      onError: (error) => {
         handleApiError(error);
      },
   });
   const onSubmit = async (data: any) => loginMutation.mutate(data);

   return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
         <div className="w-11/12 lg:w-4/12 mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
               {/* Header */}
               <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Admin Login</h2>
                  <p className="text-gray-600 text-sm">Enter your credentials to access the admin panel</p>
               </div>

               <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-1">
                     <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="email">
                        Email Address
                     </label>
                     <Input {...register("email")} id="email" type="email" placeholder="admin@flavourhaven.com" className="h-10" />
                     {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                     <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="password">
                        Password
                     </label>
                     <div className="relative">
                        <Input
                           type={showPassword ? "text" : "password"}
                           {...register("password")}
                           id="password"
                           placeholder="••••••••"
                           className="h-10 pr-12"
                        />
                        <div
                           className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                           onClick={() => setShowPassword((prev) => !prev)}>
                           {showPassword ? <IoEyeOutline size={20} /> : <IoEyeOffOutline size={20} />}
                        </div>
                     </div>
                     {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between pt-2">
                     <div className="flex items-center gap-3">
                        <Checkbox id="remember" />
                        <label htmlFor="remember" className="text-sm font-medium text-gray-600 cursor-pointer">
                           Remember me
                        </label>
                     </div>
                     <Link href="/admin/forget-password" className="text-sm font-medium text-[#195A00] hover:opacity-80">
                        Forgot password?
                     </Link>
                  </div>

                  {/* Submit Button */}
                  <Button
                     disabled={loginMutation.isPending}
                     className="w-full h-10 text-base font-semibold bg-[#195A00] hover:bg-[#195A00]/90 text-white rounded-lg">
                     {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
               </form>

               {/* Footer */}
               <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-gray-500 text-sm">© 2026 Flavour Haven. All rights reserved.</p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default LoginPage;
