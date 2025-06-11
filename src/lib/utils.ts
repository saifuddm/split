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
    expense.participants.forEach(participant => {
      if (expense.paidBy.id === participant.user.id) {
        // This person paid, so they are owed the difference
        balances[participant.user.id] += expense.amount - participant.share;
      } else {
        // This person didn't pay, so they owe their share
        balances[participant.user.id] -= participant.share;
      }
    });
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
): string => {
  const changes: string[] = [];

  // Compare description
  if (original.description !== updated.description) {
    changes.push(`the description from "${original.description}" to "${updated.description}"`);
  }

  // Compare amount
  if (Math.abs(original.amount - updated.amount) > 0.01) {
    changes.push(
      `the amount from $${original.amount.toFixed(2)} to $${updated.amount.toFixed(2)}`,
    );
  }

  // Compare payer
  if (original.paidBy.id !== updated.paidBy.id) {
    changes.push(
      `the payer from ${original.paidBy.name} to ${updated.paidBy.name}`,
    );
  }

  // Compare participants (who's involved)
  const originalParticipantIds = new Set(original.participants.map(p => p.user.id));
  const updatedParticipantIds = new Set(updated.participants.map(p => p.user.id));
  
  const addedParticipants = updated.participants.filter(p => !originalParticipantIds.has(p.user.id));
  const removedParticipants = original.participants.filter(p => !updatedParticipantIds.has(p.user.id));
  
  if (addedParticipants.length > 0 || removedParticipants.length > 0) {
    const participantChanges: string[] = [];
    if (addedParticipants.length > 0) {
      participantChanges.push(`added ${addedParticipants.map(p => p.user.name).join(', ')}`);
    }
    if (removedParticipants.length > 0) {
      participantChanges.push(`removed ${removedParticipants.map(p => p.user.name).join(', ')}`);
    }
    changes.push(`the participants (${participantChanges.join(' and ')})`);
  } else {
    // Compare split allocation (only if participants are the same)
    const originalSplitString = original.participants
      .map(p => `${p.user.id}:${p.share.toFixed(2)}`)
      .sort()
      .join(",");
    const updatedSplitString = updated.participants
      .map(p => `${p.user.id}:${p.share.toFixed(2)}`)
      .sort()
      .join(",");

    if (originalSplitString !== updatedSplitString) {
      // Check if it's a split method change (equal vs unequal)
      const originalEqualShare = original.amount / original.participants.length;
      const updatedEqualShare = updated.amount / updated.participants.length;
      
      const originalIsEqual = original.participants.every(p => Math.abs(p.share - originalEqualShare) < 0.01);
      const updatedIsEqual = updated.participants.every(p => Math.abs(p.share - updatedEqualShare) < 0.01);
      
      if (originalIsEqual && !updatedIsEqual) {
        changes.push("the split method from equal to custom amounts");
      } else if (!originalIsEqual && updatedIsEqual) {
        changes.push("the split method from custom amounts to equal");
      } else {
        changes.push("the split allocation");
      }
    }
  }

  // --- CORRECTED FORMATTING LOGIC ---
  if (changes.length === 0) {
    // Fallback for when no specific change is detected
    return "made an update to this expense";
  }

  if (changes.length === 1) {
    return `updated ${changes[0]}`;
  }

  if (changes.length === 2) {
    return `updated ${changes[0]} and ${changes[1]}`;
  }

  // For 3 or more changes, use commas and a final "and"
  const lastChange = changes.pop(); // Remove and get the last item
  return `updated ${changes.join(", ")}, and ${lastChange}`;
};