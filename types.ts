export enum CalculatorMode {
  SIP = 'SIP',
  LUMPSUM = 'LUMPSUM',
  STOCK = 'STOCK',
  PROPERTY = 'PROPERTY',
  LOAN = 'LOAN'
}

export interface InvestmentInputs {
  initialInvestment: number;
  monthlyContribution: number;
  timePeriodYears: number;
  interestRate: number;
  inflationRate: number; // For real return calculation
  taxRate: number; // For tax liability
  
  // Stock Specific
  buyPrice?: number;
  sellPrice?: number;
  quantity?: number;
  dividendYield?: number;

  // Property Specific
  propertyPrice?: number;
  rentalIncome?: number;
  monthlyExpenses?: number;
  appreciationRate?: number;
}

export interface YearData {
  year: number;
  invested: number;
  interest: number;
  total: number;
  realValue: number; // Inflation adjusted
}

export interface CalculationResult {
  totalInvested: number;
  finalValue: number;
  totalInterest: number;
  taxPayable: number;
  postTaxValue: number;
  yearlyData: YearData[];
  monthlyPayment?: number; // For Loans
}

export interface AIAnalysis {
  summary: string;
  recommendations: string[];
  riskAssessment: string;
}
