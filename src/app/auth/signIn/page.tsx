"use client";

import type React from "react";

import { useEffect, useState } from "react";
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
import { EyeIcon, EyeOffIcon, Loader2, Server, ServerOff } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import TooltipComponent from "~/components/TooltipComponent";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [DOSEnabled, setDOSEnabled] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const urlParamError = searchParams.get("error");
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  useEffect(() => {
    if (urlParamError && !error) {
      if (urlParamError === "Configuration") {
        setError("Invalid credentials");
      }
    }
  }, [urlParamError]);

  useEffect(() => {
    const storedAttempts = localStorage.getItem("loginAttempts");
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (DOSEnabled) {
      const now = Date.now();
      const lockoutUntil = localStorage.getItem("lockoutUntil");

      if (lockoutUntil && now < Number(lockoutUntil)) {
        const seconds = Math.ceil((Number(lockoutUntil) - now) / 1000);
        setError(`Too many attempts. Try again in ${seconds} second(s).`);
        setLoading(false);
        return;
      }

      localStorage.removeItem("lockoutUntil");

      if (attempts >= 3) {
        setError("Too many attempts. Please try again in 15 seconds.");
        setLoading(false);
        setAttempts(0);
        localStorage.setItem("lockoutUntil", (now + 15 * 1000).toString());
        localStorage.removeItem("loginAttempts");
        return;
      }
      localStorage.setItem("loginAttempts", (attempts + 1).toString());
      setAttempts(attempts + 1);
    }
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }
    setLoading(false);
    if (result?.ok) {
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("lockoutUntil");
      redirect("/");
    }
  };
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center justify-center gap-2 text-center text-2xl font-bold">
            <span className="text-primary">Login</span>
            <TooltipComponent
              content={DOSEnabled ? "Toggle DOS Off" : "Toggle DOS On"}
            >
              <div
                className="cursor-pointer rounded-full p-2 hover:bg-gray-100"
                onClick={() => setDOSEnabled((v) => !v)}
              >
                {DOSEnabled ? <Server size={20} /> : <ServerOff size={20} />}
              </div>
            </TooltipComponent>
          </CardTitle>
          <CardDescription className="flex flex-col gap-2 text-center">
            <span className="text-gray-500">
              Enter your credentials to access your account
            </span>
            <span className="text-red-500">{error}</span>
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
            <Button disabled={loading} type="submit" className="mt-5 w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <span className="w-full text-start text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signUp" className="text-blue-500">
                Sign up
              </Link>
            </span>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
