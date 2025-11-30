export enum CalculatorMode {
  SIP = 'SIP',
  LUMPSUM = 'LUMPSUM',
  STOCK = 'STOCK',
  PROPERTY = 'PROPERTY',
  LOAN = 'LOAN',
  COMPOUND = 'COMPOUND',
  ROI = 'ROI',
  TAX = 'TAX'
}

export interface InvestmentInputs {
  initialInvestment: number;
  monthlyContribution: number;
  stepUpRate?: number; // Annual % increase in SIP contribution
  timePeriodYears: number;
  interestRate: number;
  compoundingFrequency?: number; // 1 = Annual, 2 = Semi-Annual, 4 = Quarterly, 12 = Monthly
  inflationRate: number; // For real return calculation
  taxRate: number; // For tax liability
  
  // Stock / ROI Specific
  buyPrice?: number;
  sellPrice?: number; // Used as Final Value for ROI
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
  roiPercentage?: number; // For ROI mode
}

export interface AIAnalysis {
  summary: string;
  recommendations: string[];
  riskAssessment: string;
}