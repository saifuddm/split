import {
  createFileRoute,
  Link,
  useRouter,
  useSearch,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../../components/Button";
import { useAuthStore } from "../../data/useAuthStore";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

export const Route = createFileRoute("/(auth)/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  const router = useRouter();
  const { actions, isLoading, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email) {
      setError("Email is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const result = await actions.signUp(
      formData.email,
      formData.password,
      formData.name,
    );

    if (result.error) {
      setError(result.error);
    } else {
      // If signup requires email confirmation, show message
      if (result.error?.includes("email")) {
        setError(result.error);
      } else {
        // Redirect will happen via useEffect when isAuthenticated becomes true
      }
    }

    setIsSubmitting(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-base flex min-h-screen items-center justify-center">
        <div className="text-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-base flex min-h-screen items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-mantle border-surface0 rounded-lg border p-8 shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="text-text mb-2 text-3xl font-bold">
              Create Account
            </h1>
            <p className="text-subtext1">Sign up to start splitting expenses</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red/10 border-red text-red rounded-lg border px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="text-text mb-2 block text-sm font-medium"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="text-subtext0 absolute top-3 left-3 h-5 w-5" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-surface0 border-surface1 text-text placeholder-subtext0 focus:ring-blue w-full rounded-lg border py-3 pr-4 pl-10 transition-colors focus:border-transparent focus:ring-2 focus:outline-none"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-text mb-2 block text-sm font-medium"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="text-subtext0 absolute top-3 left-3 h-5 w-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-surface0 border-surface1 text-text placeholder-subtext0 focus:ring-blue w-full rounded-lg border py-3 pr-4 pl-10 transition-colors focus:border-transparent focus:ring-2 focus:outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-text mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="text-subtext0 absolute top-3 left-3 h-5 w-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-surface0 border-surface1 text-text placeholder-subtext0 focus:ring-blue w-full rounded-lg border py-3 pr-12 pl-10 transition-colors focus:border-transparent focus:ring-2 focus:outline-none"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-subtext0 hover:text-text absolute top-3 right-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-subtext0 mt-1 text-xs">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-text mb-2 block text-sm font-medium"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="text-subtext0 absolute top-3 left-3 h-5 w-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="bg-surface0 border-surface1 text-text placeholder-subtext0 focus:ring-blue w-full rounded-lg border py-3 pr-12 pl-10 transition-colors focus:border-transparent focus:ring-2 focus:outline-none"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-subtext0 hover:text-text absolute top-3 right-3"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-subtext1">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue hover:text-sapphire font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
