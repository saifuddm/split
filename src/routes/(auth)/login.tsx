import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../../components/Button";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/(auth)/login")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { actions } = Route.useRouteContext({
    select: ({ auth }) => ({
      actions: auth.actions,
    }),
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setIsSubmitting(false);
      return;
    }

    const result = await actions.signIn(formData.email, formData.password);

    if (result.error) {
      setError(result.error);
    } else {
      router.navigate({ to: "/dashboard" });
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
            <h1 className="text-text mb-2 text-3xl font-bold">Welcome Back</h1>
            <p className="text-subtext1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red/10 border-red text-red rounded-lg border px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="text-text mb-2 block text-sm font-medium"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="text-subtext0 absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
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
                <Lock className="text-subtext0 absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-surface0 border-surface1 text-text placeholder-subtext0 focus:ring-blue w-full rounded-lg border py-3 pr-12 pl-10 transition-colors focus:border-transparent focus:ring-2 focus:outline-none"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-subtext0 hover:text-text absolute top-1/2 right-3 -translate-y-1/2"
                >
                  {showPassword ? (
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
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-subtext1">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue hover:text-sapphire font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
