export enum CalculatorMode {
  SIP = 'SIP', // Also handles Lumpsum + SIP
  LUMPSUM = 'LUMPSUM',
  STOCK = 'STOCK',
  PROPERTY = 'PROPERTY',
  LOAN = 'LOAN',
  COMPOUND = 'COMPOUND',
  ROI = 'ROI',
  TAX = 'TAX',
  GOAL = 'GOAL',
  RETIREMENT = 'RETIREMENT'
}

export interface InvestmentInputs {
  initialInvestment: number;
  monthlyContribution: number;
  stepUpRate?: number; 
  timePeriodYears: number;
  interestRate: number;
  compoundingFrequency?: number; 
  inflationRate: number; 
  taxRate: number; 
  expenseRatio?: number; // New: Expense Ratio for funds
  startYear?: number; // New: For Table display

  // Stock / ROI Specific
  buyPrice?: number;
  sellPrice?: number; 
  quantity?: number;
  dividendYield?: number;

  // Property Specific
  propertyPrice?: number;
  rentalIncome?: number;
  monthlyExpenses?: number;
  appreciationRate?: number;

  // Tax Specific
  annualIncome?: number;
  deductions?: number;

  // Goal Specific
  targetAmount?: number;

  // Retirement Specific
  currentAge?: number;
  retirementAge?: number;
  monthlyExpensesRetirement?: number; // Desired monthly income
}

export interface YearData {
  year: number;
  label: number; // Actual Calendar Year
  invested: number;
  interest: number;
  total: number;
  realValue: number; 
}

export interface CalculationResult {
  totalInvested: number;
  finalValue: number;
  totalInterest: number;
  taxPayable: number;
  postTaxValue: number;
  yearlyData: YearData[];
  monthlyPayment?: number; // Loans or Goal Requirement
  roiPercentage?: number; 
  cagr?: number; 
  durationYears: number;
  doublingTime?: number; // Rule of 72
  breakEvenPoint?: number;
  purchasingPowerLoss?: number;
}

export interface AIAnalysis {
  summary: string;
  recommendations: string[];
  riskAssessment: string;
}