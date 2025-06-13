import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Handshake,
  Calculator,
  List,
} from "lucide-react";
import { useAppStore } from "../data/useAppStore";
import {
  calculateOverallBalances,
  calculateIndividualBalances,
  calculateGroupDebtsForUser,
  calculateNetSettlement,
  calculateDebtsOwedTo,
  calculateDebtsOwedFrom,
} from "../lib/utils";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import type { User } from "../lib/types";

export const SettleUp: React.FC = () => {
  const { currentUser, users, groups, expenses, actions } = useAppStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [settlementMode, setSettlementMode] = useState<"net" | "individual">(
    "net",
  );
  const [selectedSettlements, setSelectedSettlements] = useState<{
    [groupId: string]: number;
  }>({});
  const [individualDebtAmount, setIndividualDebtAmount] = useState(0);
  const [individualSettlementAmount, setIndividualSettlementAmount] =
    useState("0");
  const [includeIndividualDebt, setIncludeIndividualDebt] = useState(false);
  const [step, setStep] = useState<
    "select-user" | "choose-mode" | "specify-amounts" | "confirmation"
  >("select-user");

  // Calculate overall balances using the new utility function
  const overallBalances = calculateOverallBalances(
    currentUser,
    users,
    groups,
    expenses,
  );

  // Calculate individual balances using the new utility function
  const individualBalances = calculateIndividualBalances(
    currentUser,
    users,
    expenses,
  );

  // Get users you owe money to (based on overall balances)
  const usersYouOwe = users.filter(
    (user) => user.id !== currentUser.id && overallBalances[user.id] < -0.01,
  );

  const selectedUserGroupDebts = selectedUser
    ? calculateGroupDebtsForUser(currentUser, selectedUser, groups, expenses)
    : [];

  const selectedUserNetSettlement = selectedUser
    ? calculateNetSettlement(currentUser, selectedUser, groups, expenses)
    : null;

  const selectedUserDebtsOwedTo = selectedUser
    ? calculateDebtsOwedTo(currentUser, selectedUser, groups, expenses)
    : null;

  const selectedUserDebtsOwedFrom = selectedUser
    ? calculateDebtsOwedFrom(currentUser, selectedUser, groups, expenses)
    : null;

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setStep("choose-mode");
  };

  const handleModeSelect = (mode: "net" | "individual") => {
    setSettlementMode(mode);

    if (mode === "individual" && selectedUser) {
      // Set up individual settlement mode
      const groupDebts = calculateGroupDebtsForUser(
        currentUser,
        selectedUser,
        groups,
        expenses,
      );
      const individualDebt = individualBalances[selectedUser.id] || 0;

      // Initialize selected settlements with all group debts
      const initialSettlements: { [groupId: string]: number } = {};
      groupDebts.forEach((debt) => {
        initialSettlements[debt.groupId] = debt.amount;
      });
      setSelectedSettlements(initialSettlements);

      // Set individual debt (only if current user owes money)
      const individualDebtOwed = Math.abs(Math.min(0, individualDebt));
      setIndividualDebtAmount(individualDebtOwed);
      setIndividualSettlementAmount(individualDebtOwed.toString());
      setIncludeIndividualDebt(individualDebtOwed > 0.01);
    }

    setStep("specify-amounts");
  };

  const handleAmountChange = (groupId: string, amount: string) => {
    const numericAmount = parseFloat(amount) || 0;
    setSelectedSettlements((prev) => ({
      ...prev,
      [groupId]: numericAmount,
    }));
  };

  const handleGroupToggle = (groupId: string, originalAmount: number) => {
    setSelectedSettlements((prev) => {
      const current = prev[groupId] || 0;
      return {
        ...prev,
        [groupId]: current > 0 ? 0 : originalAmount,
      };
    });
  };

  const totalGroupSettlement = Object.values(selectedSettlements).reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const totalIndividualSettlement = includeIndividualDebt
    ? parseFloat(individualSettlementAmount) || 0
    : 0;
  const totalSettlementAmount =
    settlementMode === "net"
      ? selectedUserNetSettlement?.netAmount || 0
      : totalGroupSettlement + totalIndividualSettlement;
  const activeSettlements = Object.entries(selectedSettlements).filter(
    ([_, amount]) => amount > 0,
  );

  const handleConfirmSettlement = () => {
    if (!selectedUser || totalSettlementAmount <= 0) return;

    if (settlementMode === "net" && selectedUserNetSettlement) {
      // Create settlements for net settlement mode - handle both directions
      const settlementsToUser: { groupId: string; amount: number }[] = [];
      const settlementsFromUser: { groupId: string; amount: number }[] = [];

      selectedUserNetSettlement.settlements.forEach((settlement) => {
        if (settlement.direction === "currentUserPays") {
          settlementsToUser.push({
            groupId: settlement.groupId,
            amount: settlement.amount,
          });
        } else if (settlement.direction === "otherUserPays") {
          settlementsFromUser.push({
            groupId: settlement.groupId,
            amount: settlement.amount,
          });
        }
      });

      // Record settlements where current user pays other user
      if (settlementsToUser.length > 0) {
        actions.recordSettlement(selectedUser, settlementsToUser);
      }

      // Record settlements where other user pays current user (reverse the roles)
      if (settlementsFromUser.length > 0) {
        actions.recordSettlementReverse(selectedUser, settlementsFromUser);
      }
    } else {
      // Individual settlement mode (existing logic)
      const settlements = activeSettlements.map(([groupId, amount]) => ({
        groupId,
        amount,
      }));

      // Add individual settlement if selected
      if (includeIndividualDebt && totalIndividualSettlement > 0) {
        settlements.push({
          groupId: "", // Empty groupId for individual settlement
          amount: totalIndividualSettlement,
        });
      }

      actions.recordSettlement(selectedUser, settlements);
    }

    actions.navigateTo("dashboard");
  };

  const handleBack = () => {
    if (step === "choose-mode") {
      setStep("select-user");
      setSelectedUser(null);
    } else if (step === "specify-amounts") {
      setStep("choose-mode");
      setSelectedSettlements({});
      setIndividualDebtAmount(0);
      setIndividualSettlementAmount("0");
      setIncludeIndividualDebt(false);
    } else if (step === "confirmation") {
      setStep("specify-amounts");
    } else {
      actions.navigateTo("dashboard");
    }
  };

  const handleNext = () => {
    if (step === "specify-amounts" && totalSettlementAmount > 0) {
      setStep("confirmation");
    }
  };

  return (
    <div className="bg-base text-text min-h-screen">
      {/* Header */}
      <div className="bg-mantle border-surface0 border-b p-4">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Settle Up</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md p-4">
        {/* Step 1: Select User */}
        {step === "select-user" && (
          <div className="space-y-4">
            <div className="mb-6 text-center">
              <Handshake className="text-blue mx-auto mb-2 h-12 w-12" />
              <h2 className="mb-2 text-lg font-semibold">
                Who do you want to pay?
              </h2>
              <p className="text-subtext1 text-sm">
                Select someone you owe money to
              </p>
            </div>

            {usersYouOwe.length === 0 ? (
              <Card>
                <div className="py-6 text-center">
                  <CheckCircle className="text-green mx-auto mb-3 h-12 w-12" />
                  <h3 className="mb-2 font-semibold">You're all settled up!</h3>
                  <p className="text-subtext1 text-sm">
                    You don't owe anyone money right now.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {usersYouOwe.map((user) => {
                  const groupDebts = calculateGroupDebtsForUser(
                    currentUser,
                    user,
                    groups,
                    expenses,
                  );
                  const individualDebt = individualBalances[user.id] || 0;
                  const individualDebtOwed = Math.abs(
                    Math.min(0, individualDebt),
                  );
                  const totalOwed = Math.abs(overallBalances[user.id]);

                  return (
                    <Card
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="hover:bg-surface0 cursor-pointer transition-colors"
                    >
                      <div className="space-y-3">
                        {/* Header with user info and total */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar user={user} />
                            <div>
                              <span className="font-medium">{user.name}</span>
                              {user.paymentMessage && (
                                <p className="text-subtext1 text-xs">
                                  {user.paymentMessage}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-red text-lg font-bold">
                              ${totalOwed.toFixed(2)}
                            </p>
                            <p className="text-subtext1 text-xs">total owed</p>
                          </div>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-2">
                          {/* Group debts */}
                          {groupDebts.length > 0 && (
                            <div>
                              <h4 className="mb-1 text-sm font-medium">
                                Group expenses:
                              </h4>
                              <div className="space-y-1">
                                {groupDebts.map((debt) => (
                                  <div
                                    key={debt.groupId}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-subtext1">
                                      {debt.groupName}
                                    </span>
                                    <span className="text-red font-medium">
                                      ${debt.amount.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Individual debts */}
                          {individualDebtOwed > 0.01 && (
                            <div>
                              <h4 className="mb-1 text-sm font-medium">
                                Individual expenses:
                              </h4>
                              <div className="flex justify-between text-sm">
                                <span className="text-subtext1">
                                  Direct expenses
                                </span>
                                <span className="text-red font-medium">
                                  ${individualDebtOwed.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Separator line and tap instruction */}
                          <div className="border-surface0 border-t pt-2">
                            <p className="text-subtext0 text-center text-xs">
                              Tap to settle up with {user.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Choose Settlement Mode */}
        {step === "choose-mode" &&
          selectedUser &&
          selectedUserNetSettlement && (
            <div className="space-y-6">
              <div className="mb-6 text-center">
                <Avatar
                  user={selectedUser}
                  size="lg"
                  className="mx-auto mb-3"
                />
                <h2 className="mb-2 text-lg font-semibold">
                  Settling with {selectedUser.name}
                </h2>
                <p className="text-subtext1 text-sm">
                  Choose how you want to settle
                </p>
              </div>

              <div className="space-y-4">
                {/* Net Settlement Option */}
                <Card
                  onClick={() => handleModeSelect("net")}
                  className="hover:bg-surface0 cursor-pointer p-4 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Calculator className="text-blue mt-1 h-6 w-6" />
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold">
                        Settle Net Difference
                      </h3>
                      <p className="text-subtext1 mb-3 text-sm">
                        Pay only the net amount after offsetting mutual debts
                      </p>
                      <div className="bg-surface0 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {selectedUserNetSettlement.direction ===
                            "currentUserPays"
                              ? "You pay:"
                              : selectedUserNetSettlement.direction ===
                                  "otherUserPays"
                                ? "You receive:"
                                : "All settled:"}
                          </span>
                          <span className="text-blue font-bold">
                            ${selectedUserNetSettlement.netAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Individual Settlement Option */}
                <Card
                  onClick={() => handleModeSelect("individual")}
                  className="hover:bg-surface0 cursor-pointer p-4 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <List className="text-green mt-1 h-6 w-6" />
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold">
                        Settle Individual Debts
                      </h3>
                      <p className="text-subtext1 mb-3 text-sm">
                        Choose specific debts to settle with custom amounts
                      </p>
                      <div className="space-y-2">
                        {selectedUserDebtsOwedTo &&
                          selectedUserDebtsOwedTo.groupDebts.map((debt) => (
                            <div
                              key={debt.groupId}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-subtext1">
                                {debt.groupName}
                              </span>
                              <span className="text-red font-medium">
                                ${debt.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        {selectedUserDebtsOwedTo &&
                          selectedUserDebtsOwedTo.individualDebt > 0.01 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-subtext1">
                                Individual expenses
                              </span>
                              <span className="text-red font-medium">
                                $
                                {selectedUserDebtsOwedTo.individualDebt.toFixed(
                                  2,
                                )}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

        {/* Step 3: Specify Amounts (for individual mode only) */}
        {step === "specify-amounts" &&
          selectedUser &&
          settlementMode === "individual" && (
            <div className="space-y-6">
              <div className="mb-6 text-center">
                <Avatar
                  user={selectedUser}
                  size="lg"
                  className="mx-auto mb-3"
                />
                <h2 className="mb-2 text-lg font-semibold">
                  Paying {selectedUser.name}
                </h2>
                <p className="text-subtext1 text-sm">
                  Choose which debts to settle
                </p>
              </div>

              <div className="space-y-4">
                {/* Group Debts Section */}
                {selectedUserGroupDebts.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-medium">Group Debts</h3>
                    <div className="space-y-3">
                      {selectedUserGroupDebts.map((debt) => {
                        const isSelected =
                          selectedSettlements[debt.groupId] > 0;
                        const currentAmount =
                          selectedSettlements[debt.groupId] || 0;

                        return (
                          <Card key={debt.groupId} className="p-4">
                            <div className="mb-3 flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleGroupToggle(debt.groupId, debt.amount)
                                }
                                className="text-blue focus:ring-blue"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {debt.groupName}
                                </h4>
                                <p className="text-subtext1 text-sm">
                                  You owe ${debt.amount.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="ml-6">
                                <label className="mb-2 block text-sm font-medium">
                                  Amount to pay
                                </label>
                                <div className="relative">
                                  <span className="text-subtext1 absolute top-1/2 left-3 -translate-y-1/2 transform">
                                    $
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={debt.amount}
                                    value={currentAmount}
                                    onChange={(e) =>
                                      handleAmountChange(
                                        debt.groupId,
                                        e.target.value,
                                      )
                                    }
                                    className="bg-mantle border-surface0 focus:ring-blue w-full rounded-lg border py-2 pr-3 pl-8 focus:border-transparent focus:ring-2 focus:outline-none"
                                  />
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Individual Debts Section */}
                {individualDebtAmount > 0.01 && (
                  <div>
                    <h3 className="mb-3 font-medium">Individual Debts</h3>
                    <Card className="p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={includeIndividualDebt}
                          onChange={(e) =>
                            setIncludeIndividualDebt(e.target.checked)
                          }
                          className="text-blue focus:ring-blue"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">Direct Expenses</h4>
                          <p className="text-subtext1 text-sm">
                            You owe ${individualDebtAmount.toFixed(2)} from
                            individual expenses
                          </p>
                        </div>
                      </div>

                      {includeIndividualDebt && (
                        <div className="ml-6">
                          <label className="mb-2 block text-sm font-medium">
                            Amount to pay
                          </label>
                          <div className="relative">
                            <span className="text-subtext1 absolute top-1/2 left-3 -translate-y-1/2 transform">
                              $
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={individualDebtAmount}
                              value={individualSettlementAmount}
                              onChange={(e) =>
                                setIndividualSettlementAmount(e.target.value)
                              }
                              className="bg-mantle border-surface0 focus:ring-blue w-full rounded-lg border py-2 pr-3 pl-8 focus:border-transparent focus:ring-2 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>

              {totalSettlementAmount > 0 && (
                <div className="bg-surface0 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Payment:</span>
                    <span className="text-blue text-xl font-bold">
                      ${totalSettlementAmount.toFixed(2)}
                    </span>
                  </div>
                  {totalGroupSettlement > 0 &&
                    totalIndividualSettlement > 0 && (
                      <div className="text-subtext1 mt-2 text-sm">
                        <div className="flex justify-between">
                          <span>Group debts:</span>
                          <span>${totalGroupSettlement.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Individual debts:</span>
                          <span>${totalIndividualSettlement.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                </div>
              )}

              <Button
                onClick={handleNext}
                disabled={totalSettlementAmount <= 0}
                className={`w-full ${totalSettlementAmount <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
              >
                Continue
              </Button>
            </div>
          )}

        {/* Step 3: Net Settlement Confirmation */}
        {step === "specify-amounts" &&
          selectedUser &&
          settlementMode === "net" &&
          selectedUserNetSettlement && (
            <div className="space-y-6">
              <div className="mb-6 text-center">
                <Calculator className="text-blue mx-auto mb-3 h-12 w-12" />
                <h2 className="mb-2 text-lg font-semibold">Net Settlement</h2>
                <p className="text-subtext1 text-sm">
                  Review the net settlement calculation
                </p>
              </div>

              <Card className="p-6">
                <div className="mb-4 text-center">
                  <Avatar
                    user={selectedUser}
                    size="lg"
                    className="mx-auto mb-3"
                  />
                  <h3 className="text-xl font-semibold">
                    {selectedUserNetSettlement.direction === "currentUserPays"
                      ? `Paying ${selectedUser.name}`
                      : selectedUserNetSettlement.direction === "otherUserPays"
                        ? `Receiving from ${selectedUser.name}`
                        : "All Settled Up"}
                  </h3>
                  <p className="text-blue mt-2 text-3xl font-bold">
                    ${selectedUserNetSettlement.netAmount.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Settlement Details:</h4>
                  {selectedUserDebtsOwedTo &&
                    selectedUserDebtsOwedTo.groupDebts.map((debt) => (
                      <div
                        key={debt.groupId}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-subtext1">
                          You pay: {debt.groupName}
                        </span>
                        <span className="text-red font-medium">
                          ${debt.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {selectedUserDebtsOwedTo &&
                    selectedUserDebtsOwedTo.individualDebt > 0.01 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-subtext1">
                          You pay: Individual expenses
                        </span>
                        <span className="text-red font-medium">
                          ${selectedUserDebtsOwedTo.individualDebt.toFixed(2)}
                        </span>
                      </div>
                    )}
                  {selectedUserDebtsOwedFrom &&
                    selectedUserDebtsOwedFrom.groupDebts.map((debt) => (
                      <div
                        key={debt.groupId}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-subtext1">
                          {selectedUser.name} pays: {debt.groupName}
                        </span>
                        <span className="text-green font-medium">
                          ${debt.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {selectedUserDebtsOwedFrom &&
                    selectedUserDebtsOwedFrom.individualDebt > 0.01 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-subtext1">
                          {selectedUser.name} pays: Individual expenses
                        </span>
                        <span className="text-green font-medium">
                          ${selectedUserDebtsOwedFrom.individualDebt.toFixed(2)}
                        </span>
                      </div>
                    )}
                </div>
              </Card>

              <Button onClick={handleNext} className="w-full">
                Continue
              </Button>
            </div>
          )}

        {/* Step 4: Confirmation */}
        {step === "confirmation" && selectedUser && (
          <div className="space-y-6">
            <div className="mb-6 text-center">
              <CheckCircle className="text-green mx-auto mb-3 h-12 w-12" />
              <h2 className="mb-2 text-lg font-semibold">Confirm Payment</h2>
              <p className="text-subtext1 text-sm">
                Review your settlement details
              </p>
            </div>

            <Card className="p-6">
              <div className="mb-4 text-center">
                <Avatar
                  user={selectedUser}
                  size="lg"
                  className="mx-auto mb-3"
                />
                <h3 className="text-xl font-semibold">
                  {settlementMode === "net" ? "Net Settlement with" : "Paying"}{" "}
                  {selectedUser.name}
                </h3>
                <p className="text-blue mt-2 text-3xl font-bold">
                  ${totalSettlementAmount.toFixed(2)}
                </p>
              </div>

              {selectedUser.paymentMessage && (
                <div className="bg-surface0 mb-4 rounded-lg p-3">
                  <p className="mb-1 text-sm font-medium">Payment Method:</p>
                  <p className="text-subtext1 text-sm">
                    {selectedUser.paymentMessage}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Settlement Breakdown:</h4>
                {settlementMode === "individual" ? (
                  <>
                    {activeSettlements.map(([groupId, amount]) => {
                      const group = groups.find((g) => g.id === groupId);
                      return (
                        <div
                          key={groupId}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-subtext1">{group?.name}</span>
                          <span className="font-medium">
                            ${amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                    {includeIndividualDebt && totalIndividualSettlement > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-subtext1">
                          Individual expenses
                        </span>
                        <span className="font-medium">
                          ${totalIndividualSettlement.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-subtext1">Net settlement</span>
                    <span className="font-medium">
                      ${totalSettlementAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-3">
              <Button onClick={handleConfirmSettlement} className="w-full">
                Confirm & Settle Up
              </Button>
              <Button
                variant="secondary"
                onClick={() => setStep("specify-amounts")}
                className="w-full"
              >
                Back to Edit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
