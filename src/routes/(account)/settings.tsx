import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { Button } from "../../components/Button";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "../../components/Avatar";
import { useState } from "react";

export const Route = createFileRoute("/(account)/settings")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  loader: async ({ context }) => {
    // TODO: get contacts
    return {
      contacts: [],
    };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const { currentUser, email, updatePaymentMessage } = Route.useRouteContext({
    select: ({ auth }) => ({
      currentUser: auth.user,
      email: auth.session?.user.email,
      updatePaymentMessage: auth.actions.updatePaymentMessage,
    }),
  });

  if (!currentUser) {
    return <div>Profile not found</div>;
  }

  const [paymentMessage, setPaymentMessage] = useState(
    currentUser.payment_message || "",
  );

  const handleSavePaymentMessage = async () => {
    await updatePaymentMessage(paymentMessage);
    router.invalidate();
  };

  return (
    <div className="bg-base text-text min-h-screen">
      <Header />

      <div className="mx-auto max-w-lg p-4">
        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="bg-mantle border-surface0 rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Profile</h2>

            <div className="mb-4 flex items-center gap-4">
              <Avatar user={currentUser} size="lg" />
              <div>
                <h3 className="text-lg font-medium">{currentUser.name}</h3>
                <p className="text-subtext1 text-sm">{email}</p>
              </div>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="bg-mantle border-surface0 rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Your Payment Info</h2>
            <p className="text-subtext1 mb-3 text-sm">
              Add your payment details so friends know how to pay you back
            </p>

            <div className="space-y-3">
              <label
                htmlFor="paymentMessage"
                className="block text-sm font-medium"
              >
                Payment Method
              </label>
              <textarea
                id="paymentMessage"
                value={paymentMessage}
                onChange={(e) => setPaymentMessage(e.target.value)}
                placeholder="e.g., Venmo: @your-username, CashApp: $your-handle, or Zelle: your-email@example.com"
                rows={3}
                className="bg-base border-surface0 focus:ring-blue w-full resize-none rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
              />
              <p className="text-subtext0 text-xs">
                This will be shown to others when they need to pay you
              </p>

              <Button
                onClick={handleSavePaymentMessage}
                size="sm"
                disabled={
                  paymentMessage.trim() === (currentUser.payment_message || "")
                }
                className={
                  paymentMessage.trim() === (currentUser.payment_message || "")
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              >
                Save Payment Info
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="bg-mantle border-surface0 border-b p-4">
      <div className="mx-auto flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="secondary" size="sm" className="p-2">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>
    </div>
  );
}
