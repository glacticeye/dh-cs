"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import useUser from "@/hooks/useUser";
import { LoaderCircle } from "lucide-react";

export default function ClientPage() {
  const { loading, error, user } = useUser();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-dagger-gold">
        <LoaderCircle className="animate-spin size-8" />
        <span className="font-serif text-lg">Loading user data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 mx-auto max-w-md mt-10 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-center">
        <p className="font-bold mb-2">Error Loading User</p>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-dagger-gold mb-2">
          User Profile
        </h1>
        <p className="text-gray-400">
          Manage your account details and settings
        </p>
      </div>

      <Card className="bg-dagger-panel border-dagger-gold/20 shadow-xl backdrop-blur-sm">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-xl text-white font-serif">Account Information</CardTitle>
          <CardDescription className="text-gray-400">
            User details fetched from the client
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
              <span className="text-gray-400 font-medium mb-1 sm:mb-0">Email Address</span>
              <span className="text-white font-mono bg-black/40 px-3 py-1 rounded border border-white/10">
                {user?.email || "Not authenticated"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
              <span className="text-gray-400 font-medium mb-1 sm:mb-0">User ID</span>
              <span className="text-xs text-gray-500 font-mono break-all">
                {user?.id || "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
