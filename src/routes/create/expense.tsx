import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "../../components/Button";
import { ArrowLeft, SaveIcon } from "lucide-react";
import { Avatar } from "../../components/Avatar";
import { useAuthStore } from "../../data/useAuthStore";
import { useState } from "react";
import { Card } from "../../components/Card";
import type {
  DbExpense,
  DbExpenseInsert,
  DbExpenseMember,
  DbUser,
} from "../../supabaseClient";

const expenseSearchSchema = z.object({
  user_id: z.number().optional(),
  group_id: z.number().optional(),
});

export const Route = createFileRoute("/create/expense")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  validateSearch: expenseSearchSchema,
  component: ExpensePage,
});

function ExpensePage() {
  const { user_id, group_id } = Route.useSearch();
  const { contacts } = useAuthStore();
  const selectedUser = contacts?.find((c) => c.id === user_id);

  return (
    <div className="bg-base text-text min-h-screen">
      <Header />
      <div className="mx-auto max-w-lg p-4">
        <div className="space-y-6">
          {user_id && <UserInfo selectedUser={selectedUser} />}
          {!group_id && <DirectExpenseInfo selectedUser={selectedUser} />}
          {/* <ExpenseTypeToggle /> */}
          <ExpenseForm selectedUser={selectedUser} />
        </div>
      </div>
    </div>
  );
}

function Header() {
  const navigate = Route.useNavigate();
  return (
    <div className="bg-mantle border-surface0 border-b p-4">
      <div className="mx-auto flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="p-2"
          onClick={() => navigate({ to: "/dashboard" })}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold">Add Expense</h1>
        <Button
          variant="primary"
          size="sm"
          className="p-2"
          disabled={true}
          onClick={() => {
            console.log("save");
          }}
        >
          <SaveIcon size={20} />
        </Button>
      </div>
    </div>
  );
}

function UserInfo({ selectedUser }: { selectedUser: DbUser | undefined }) {
  if (!selectedUser) {
    return (
      <div className="bg-surface0 rounded-lg p-4">
        <h3 className="mb-2 font-medium">User ID not found</h3>
        <p className="text-text-muted text-sm">
          Please select a user from the list of contacts{" "}
          <Link to="/dashboard" className="text-blue">
            here
          </Link>
        </p>
      </div>
    );
  }
  return (
    <div className="bg-surface0 rounded-lg p-4">
      <h3 className="mb-2 font-medium">Adding expense with:</h3>
      <div className="flex items-center gap-3">
        <Avatar user={selectedUser} size="sm" />
        <span className="font-medium">{selectedUser.name}</span>
      </div>
    </div>
  );
}

function ExpenseTypeToggle() {
  return (
    <div className="bg-surface0 rounded-lg p-4">
      <h3 className="mb-3 font-medium">Expense Type</h3>
    </div>
  );
}

function ExpenseForm({ selectedUser }: { selectedUser: DbUser | undefined }) {
  const navigate = Route.useNavigate();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const {
    user,
    actions: { createExpense },
  } = useAuthStore();

  const paidByOptions: DbUser[] =
    user && selectedUser ? [user, selectedUser] : [];

  const [paidBy, setPaidBy] = useState<DbUser>(user!);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("description", description);
    console.log("amount", amount);
    console.log("paidBy", paidBy);

    const expenseMembers: DbExpenseMember[] = paidByOptions.map((option) => ({
      expense_id: 0, // any number will do as we will update the expense_id later
      user_id: option.id,
      amount_share: amount / paidByOptions.length,
    }));

    const expenseDetails: DbExpenseInsert = {
      amount: amount,
      description: description,
      group_id: null,
      user_paid: paidBy.id,
    };

    const { error, success, expense } = await createExpense(
      expenseDetails,
      expenseMembers,
    );

    if (success) {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium"
          >
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this expense for?"
            className="bg-mantle border-surface0 focus:ring-blue w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
            required
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Amount
          </label>
          <div className="relative">
            <span className="text-subtext1 absolute top-1/2 left-3 -translate-y-1/2 transform">
              $
            </span>
            <input
              id="amount"
              type="number"
              step="0.05"
              min="0"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0.00"
              className="bg-mantle border-surface0 focus:ring-blue w-full rounded-lg border px-3 py-2 pl-8 focus:border-transparent focus:ring-2 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Paid By Toggle */}
        <div className="space-y-2">
          <label htmlFor="paidBy" className="mb-2 block text-sm font-medium">
            Paid by
          </label>
          {paidByOptions.map((option) => (
            <label
              key={option.id}
              className="bg-mantle border-surface0 hover:bg-surface0 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
            >
              <input
                type="radio"
                name="paidBy"
                value={option.id}
                checked={paidBy?.id === option.id}
                onChange={() => setPaidBy(option)}
                className="text-blue focus:ring-blue"
              />
              <Avatar user={option} size="sm" />
              <span className="font-medium">{option.name}</span>
            </label>
          ))}
        </div>

        <div className="border-surface0 border-t" />

        {/* Advanced Split Toggle*/}
        {/* <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Advanced Split</h3>
            <p className="text-subtext1 text-sm">
              Enable advanced split options, by default the expense is split
              equally.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isAdvanced}
            onChange={() => setIsAdvanced(!isAdvanced)}
            className="m-2 scale-150"
          />
        </div> */}

        <div className="border-surface0 border-t" />

        {/* Split Preview */}
        <div className="bg-surface0 rounded-lg p-4">
          <h3 className="mb-2 font-medium">Split Preview</h3>
          <p className="text-subtext1 text-sm">
            Split equally among {paidByOptions.length} people
          </p>
        </div>

        <Button type="submit" className="w-full">
          Add Expense
        </Button>
      </div>
    </form>
  );
}

function DirectExpenseInfo({
  selectedUser,
}: {
  selectedUser: DbUser | undefined;
}) {
  return (
    <Card className="p-4">
      <h3 className="mb-2 font-medium">Direct Expense</h3>
      <p className="text-subtext1 text-sm">
        This will be logged as a direct expense with{" "}
        {selectedUser?.name || "the selected person"}.
      </p>
    </Card>
  );
}
