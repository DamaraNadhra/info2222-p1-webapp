"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import { api } from "~/trpc/react";
export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const registerMutation = api.user.registerUser.useMutation({
    onSuccess: () => {
      setSignUpLoading(false);
      void signIn("credentials", {
        email,
        password,
        redirect: false,
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to create account");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpLoading(true);
    await toast.promise(
      registerMutation.mutateAsync({ email, password, name }),
      {
        loading: "Creating account...",
        success: "Account created successfully",
        error: "Failed to create account",
      },
    );
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">
            Sign up
          </CardTitle>
          <CardDescription className="text-center">
            Create an account to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="hover:bg absolute top-0 right-0 h-full cursor-pointer px-3 py-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              type="submit"
              className="mt-5 w-full"
              disabled={signUpLoading}
            >
              {signUpLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {signUpLoading ? "Signing up..." : "Sign up"}
            </Button>
            <span className="w-full text-start text-sm">
              Already have an account?{" "}
              <Link href="/signIn" className="text-blue-500">
                Sign in
              </Link>
            </span>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
