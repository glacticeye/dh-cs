import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dagger-dark p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <CircleAlert className="h-16 w-16 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Authentication Error</h1>
          <p className="text-gray-400">
            There was a problem completing your sign-in. This could be due to:
          </p>
        </div>

        <ul className="text-left text-sm text-gray-400 space-y-2 bg-dagger-panel p-4 rounded-lg border border-white/10">
          <li>• The authentication link expired</li>
          <li>• The authentication was cancelled</li>
          <li>• A network error occurred</li>
        </ul>

        <div className="space-y-3 pt-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">Try Again</Link>
          </Button>

          <p className="text-xs text-gray-500">
            If the problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  );
}
