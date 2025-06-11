import type { User, Expense } from './types';

export interface SimplifiedDebt {
  debtor: User;
  creditor: User;
  amount: number;
}

export const calculateSimplifiedDebts = (members: User[], expenses: Expense[]): SimplifiedDebt[] => {
  // Calculate balances for each member
  const balances: { [userId: string]: number } = {};
  
  // Initialize balances
  members.forEach(member => {
    balances[member.id] = 0;
  });
  
  // Calculate balances from expenses
  expenses.forEach(expense => {
    if (expense.isSettlement) {
      // Special logic for settlement transactions
      // The payer's balance increases (moves closer to zero from negative)
      balances[expense.paidBy.id] += expense.amount;
      // The payee's balance decreases (moves closer to zero from positive)
      balances[expense.participants[0].user.id] -= expense.amount;
    } else {
      // Existing logic for regular expenses
      expense.participants.forEach(participant => {
        if (expense.paidBy.id === participant.user.id) {
          // This person paid, so they are owed the difference
          balances[participant.user.id] += expense.amount - participant.share;
        } else {
          // This person didn't pay, so they owe their share
          balances[participant.user.id] -= participant.share;
        }
      });
    }
  });
  
  // Create arrays of debtors and creditors
  const debtors = members
    .filter(member => balances[member.id] < -0.01) // Using small threshold for floating point comparison
    .map(member => ({ user: member, balance: balances[member.id] }));
  
  const creditors = members
    .filter(member => balances[member.id] > 0.01)
    .map(member => ({ user: member, balance: balances[member.id] }));
  
  const simplifiedDebts: SimplifiedDebt[] = [];
  
  // Create working copies to avoid mutating the original arrays
  const workingDebtors = [...debtors];
  const workingCreditors = [...creditors];
  
  while (workingDebtors.length > 0 && workingCreditors.length > 0) {
    const currentDebtor = workingDebtors[0];
    const currentCreditor = workingCreditors[0];
    
    const transferAmount = Math.min(
      Math.abs(currentDebtor.balance),
      currentCreditor.balance
    );
    
    simplifiedDebts.push({
      debtor: currentDebtor.user,
      creditor: currentCreditor.user,
      amount: transferAmount
    });
    
    // Update balances
    currentDebtor.balance += transferAmount;
    currentCreditor.balance -= transferAmount;
    
    // Remove settled parties
    if (Math.abs(currentDebtor.balance) < 0.01) {
      workingDebtors.shift();
    }
    if (Math.abs(currentCreditor.balance) < 0.01) {
      workingCreditors.shift();
    }
  }
  
  return simplifiedDebts;
};

export const generateAuditDetails = (
  original: Expense,
  updated: Omit<Expense, "id" | "history">,
): { action: string; details?: string } => {
  const summaryChanges: string[] = [];
  const detailChanges: string[] = [];

  // 1. Compare Description
  if (original.description !== updated.description) {
    summaryChanges.push("the description");
    detailChanges.push(`Description: "${original.description}" → "${updated.description}"`);
  }

  // 2. Compare Amount
  if (Math.abs(original.amount - updated.amount) > 0.01) {
    summaryChanges.push("the amount");
    detailChanges.push(
      `Amount: $${original.amount.toFixed(2)} → $${updated.amount.toFixed(2)}`,
    );
  }

  // 3. Compare Payer
  if (original.paidBy.id !== updated.paidBy.id) {
    summaryChanges.push("the payer");
    detailChanges.push(`Payer: ${original.paidBy.name} → ${updated.paidBy.name}`);
  }

  // 4. Compare Split Allocation & Participants
  const originalParticipants = new Map(
    original.participants.map(p => [p.user.id, p]),
  );
  const updatedParticipants = new Map(
    updated.participants.map(p => [p.user.id, p]),
  );
  const allInvolvedIds = new Set([
    ...originalParticipants.keys(),
    ...updatedParticipants.keys(),
  ]);

  let splitHasChanged = false;
  const splitDetailLines: string[] = [];

  allInvolvedIds.forEach(id => {
    const originalParticipant = originalParticipants.get(id);
    const updatedParticipant = updatedParticipants.get(id);
    const userName = originalParticipant?.user.name || updatedParticipant?.user.name || "";

    if (!originalParticipant) {
      // User was added
      splitHasChanged = true;
      splitDetailLines.push(`  • ${userName} (Added): $${updatedParticipant!.share.toFixed(2)}`);
    } else if (!updatedParticipant) {
      // User was removed
      splitHasChanged = true;
      splitDetailLines.push(`  • ${userName} (Removed): was $${originalParticipant.share.toFixed(2)}`);
    } else if (Math.abs(originalParticipant.share - updatedParticipant.share) > 0.01) {
      // User's share changed
      splitHasChanged = true;
      splitDetailLines.push(
        `  • ${userName}: $${originalParticipant.share.toFixed(2)} → $${updatedParticipant.share.toFixed(2)}`,
      );
    }
  });

  if (splitHasChanged) {
    summaryChanges.push("the split");
    detailChanges.push(`Split Details:\n${splitDetailLines.join("\n")}`);
  }

  // --- FORMATTING LOGIC ---
  if (summaryChanges.length === 0) {
    return { action: "made an update to this expense" };
  }

  let action: string;
  if (summaryChanges.length === 1) {
    action = `updated ${summaryChanges[0]}`;
  } else if (summaryChanges.length === 2) {
    action = `updated ${summaryChanges[0]} and ${summaryChanges[1]}`;
  } else {
    const lastChange = summaryChanges.pop();
    action = `updated ${summaryChanges.join(", ")}, and ${lastChange}`;
  }

  return {
    action,
    details: detailChanges.length > 0 ? detailChanges.join("\n\n") : undefined, // Separate sections with double newline
  };
};