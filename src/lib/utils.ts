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