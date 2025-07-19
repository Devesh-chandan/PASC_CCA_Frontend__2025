"use client";
import React from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Sun, Moon, User } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

const Navbar = () => {
  return (
    <nav className="w-full top-0">
      <div className="flex justify-between mx-auto shadow-md  px-5 py-2">
        <div className="flex items-center">
          <Image src="/logo.png" width={120} height={80} alt="logo" priority />
        </div>
        <div className="flex items-center gap-6">
          <ThemeSwitcher />

          {/* User Icon with role-based navigation */}
          {(() => {
            const router = useRouter();
            const role = useAuthStore((state) => state.role);
            const handleUserClick = () => {
              if (role === "admin") {
                router.push("/admin/profile");
              } else {
                router.push("/student/profile");
              }
            };
            return (
              <div className="bg-profile  p-2 rounded-full cursor-pointer" onClick={handleUserClick}>
                <User className="h-8 w-8 p-0.5" />
              </div>
            );
          })()}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
