import {
  Await,
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { Button } from "../../components/Button";
import { ArrowLeft, PlusIcon } from "lucide-react";
import { Avatar } from "../../components/Avatar";
import { useState } from "react";
import type { DbUser } from "../../supabaseClient";
import { useStore } from "../../data/store";

export const Route = createFileRoute("/(account)/settings")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  loader: async ({ context }) => {
    if (context.auth.contacts) {
      return {
        contacts: Promise.resolve(context.auth.contacts),
      };
    }
    console.log("Getting contacts for user", context.auth.user?.id);
    const contactDetails = context.auth.actions.getContactsForUser(
      context.auth.user?.id!,
    );
    return {
      contacts: contactDetails,
    };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const { contacts } = Route.useLoaderData();
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

          <Await promise={contacts} fallback={<FriendsListSkeleton />}>
            {(contacts) => <FriendsList contactDetails={contacts} />}
          </Await>

          <ThemeSection />

          <AppInfoSection />
        </div>
      </div>
    </div>
  );
}

function Header() {
  const navigate = Route.useNavigate();
  return (
    <div className="bg-mantle border-surface0 border-b p-4">
      <div className="mx-auto flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="p-2"
          onClick={() => navigate({ to: "/dashboard" })}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>
    </div>
  );
}

function FriendsList({ contactDetails }: { contactDetails: DbUser[] }) {
  const router = useRouter();
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { addContact } = Route.useRouteContext({
    select: ({ auth }) => ({
      addContact: auth.actions.addContact,
    }),
  });

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await addContact(inviteEmail.trim());

      if (result.error) {
        setError(result.error);
      } else {
        // Success
        setInviteEmail("");
        setIsInviting(false);
        // Invalidate router to refresh the contacts data
        router.invalidate();
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvite = () => {
    setInviteEmail("");
    setIsInviting(false);
    setError("");
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="bg-mantle border-surface0 rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Friends</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsInviting(true)}
        >
          <PlusIcon size={20} />
        </Button>
      </div>

      {/* Invite User Form */}
      {isInviting && (
        <div className="bg-surface0 mb-4 rounded-lg p-3">
          <div className="space-y-3">
            <label htmlFor="inviteEmail" className="block text-sm font-medium">
              Friend's Email
            </label>
            <input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setError(""); // Clear error when user starts typing
              }}
              placeholder="Enter friend's email address"
              className="bg-mantle border-surface0 focus:ring-blue w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleInviteUser();
                } else if (e.key === "Escape") {
                  handleCancelInvite();
                }
              }}
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="text-red text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button
                onClick={handleInviteUser}
                size="sm"
                disabled={
                  !inviteEmail.trim() ||
                  !isValidEmail(inviteEmail.trim()) ||
                  isLoading
                }
                className={
                  !inviteEmail.trim() ||
                  !isValidEmail(inviteEmail.trim()) ||
                  isLoading
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              >
                {isLoading ? "Adding..." : "Add Friend"}
              </Button>
              <Button
                onClick={handleCancelInvite}
                variant="secondary"
                size="sm"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {contactDetails.length === 0 ? (
        <p className="text-subtext1 mb-3 text-sm">
          No other users yet. Invite someone to get started!
        </p>
      ) : (
        <div className="space-y-2">
          {contactDetails.map((user) => (
            <div
              className="hover:bg-surface0 flex items-center gap-3 rounded-lg p-2 transition-colors"
              key={user.id}
            >
              <Avatar user={user} size="sm" />
              <div>
                <span className="font-medium">{user.name}</span>
                {user.payment_message && (
                  <p className="text-subtext1 text-xs">
                    {user.payment_message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeSection() {
  const { isDark, toggleDarkMode } = useStore();
  return (
    <div className="bg-mantle border-surface0 rounded-lg border p-4">
      <h2 className="mb-4 text-lg font-semibold">Appearance</h2>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Dark Mode</h3>
          <p className="text-subtext1 text-sm">
            Switch between light and dark themes
          </p>
        </div>
        <input
          type="checkbox"
          checked={isDark}
          onChange={toggleDarkMode}
          className="m-2 scale-150"
        />
      </div>
    </div>
  );
}

function AppInfoSection() {
  return (
    <div className="bg-mantle border-surface0 rounded-lg border p-4">
      <h2 className="mb-4 text-lg font-semibold">About</h2>
      <div className="text-subtext1 space-y-2 text-sm">
        <p>
          <span className="text-text font-medium">Version:</span> 1.1.0
        </p>
        <p>
          <span className="text-text font-medium">Built with:</span> React,
          TypeScript, Tailwind CSS
        </p>
        <p>
          <span className="text-text font-medium">Source:</span>{" "}
          <a
            href="https://github.com/saifuddm/split"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue hover:text-sapphire underline transition-colors"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}

function FriendsListSkeleton() {
  return (
    <div className="bg-mantle border-surface0 rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Friends</h2>
        <Button variant="secondary" size="sm">
          <PlusIcon size={20} />
        </Button>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-2">
            <div className="bg-surface0 h-8 w-8 animate-pulse rounded-full" />
            <div className="space-y-1">
              <div className="bg-surface0 h-4 w-24 animate-pulse rounded" />
              <div className="bg-surface0 h-3 w-32 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
