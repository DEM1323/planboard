"use client";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { UserPlus, Users, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AuthPage() {
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", authMode === "signin" ? "signIn" : "signUp");

      await signIn("password", formData);
      toast.success(
        authMode === "signin"
          ? "Signed in successfully!"
          : "Account created successfully!"
      );
    } catch (error: any) {
      console.error("Auth error:", error);
      if (
        error.message?.includes("User not found") ||
        error.message?.includes("Invalid")
      ) {
        toast.error(
          authMode === "signin"
            ? "Invalid email or password. Try signing up instead."
            : "An account with this email already exists. Try signing in instead."
        );
      } else {
        toast.error("Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("anonymous");
      toast.success("Signed in as guest!");
    } catch (error) {
      console.error("Guest sign-in error:", error);
      toast.error("Failed to sign in as guest. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to Planboard
          </h1>
          <p className="text-muted-foreground">
            Collaborate on whiteboards in real-time
          </p>
        </div>

        {/* Email/Password Auth */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-2">
              <UserPlus className="w-6 h-6 text-secondary-foreground" />
            </div>
            <CardTitle className="text-xl">
              {authMode === "signin" ? "Sign In" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {authMode === "signin"
                ? "Access your saved planboards"
                : "Create an account to save your work"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 w-4 mr-2" />
                )}
                {authMode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <Button
              variant="ghost"
              onClick={() =>
                setAuthMode(authMode === "signin" ? "signup" : "signin")
              }
              disabled={isLoading}
              className="text-sm"
            >
              {authMode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </CardFooter>
        </Card>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Guest Sign In */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Continue as Guest</CardTitle>
            <CardDescription>
              Start collaborating immediately without creating an account
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={handleGuestSignIn}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              Continue as Guest
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
