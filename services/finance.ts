import { InvestmentInputs, CalculationResult, YearData, CalculatorMode } from '../types';

export const calculateInvestment = (mode: CalculatorMode, inputs: InvestmentInputs): CalculationResult => {
  const {
    initialInvestment,
    monthlyContribution,
    timePeriodYears,
    interestRate,
    inflationRate,
    taxRate,
    buyPrice,
    sellPrice,
    quantity,
    dividendYield,
    propertyPrice,
    rentalIncome,
    monthlyExpenses,
    appreciationRate
  } = inputs;

  let totalInvested = 0;
  let finalValue = 0;
  let yearlyData: YearData[] = [];
  let currentBalance = 0;
  let currentInvested = 0;
  let monthlyPayment = 0;

  const r = interestRate / 100;
  const monthlyRate = r / 12;
  const months = timePeriodYears * 12;

  switch (mode) {
    case CalculatorMode.SIP:
      currentBalance = initialInvestment; // Usually 0 for pure SIP, but allows hybrid
      currentInvested = initialInvestment;
      
      for (let i = 1; i <= months; i++) {
        currentBalance = (currentBalance + monthlyContribution) * (1 + monthlyRate);
        currentInvested += monthlyContribution;
        
        if (i % 12 === 0) {
          const year = i / 12;
          const inflationFactor = Math.pow(1 + inflationRate / 100, year);
          yearlyData.push({
            year,
            invested: Math.round(currentInvested),
            interest: Math.round(currentBalance - currentInvested),
            total: Math.round(currentBalance),
            realValue: Math.round(currentBalance / inflationFactor)
          });
        }
      }
      totalInvested = currentInvested;
      finalValue = currentBalance;
      break;

    case CalculatorMode.LUMPSUM:
      totalInvested = initialInvestment;
      // FV = P(1+r/n)^(nt) with n=1 (compounded annually usually or monthly)
      // Standard lumpsum often compounded annually
      finalValue = initialInvestment * Math.pow(1 + r, timePeriodYears);
      
      for (let i = 1; i <= timePeriodYears; i++) {
        const val = initialInvestment * Math.pow(1 + r, i);
        const inflationFactor = Math.pow(1 + inflationRate / 100, i);
        yearlyData.push({
          year: i,
          invested: totalInvested,
          interest: Math.round(val - totalInvested),
          total: Math.round(val),
          realValue: Math.round(val / inflationFactor)
        });
      }
      break;

    case CalculatorMode.LOAN:
        // EMI Calculation: P * r * (1+r)^n / ((1+r)^n - 1)
        // Here interestRate is annual, convert to monthly
        const P = initialInvestment; // Principal
        const R = interestRate / 12 / 100;
        const N = timePeriodYears * 12;
        
        if (R === 0) {
            monthlyPayment = P / N;
        } else {
            monthlyPayment = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
        }

        totalInvested = P; // Loan amount
        finalValue = monthlyPayment * N; // Total Amount Payable

        let balance = P;
        for (let i = 1; i <= timePeriodYears; i++) {
            // Simplified yearly snapshot for loan amortization
            // In a real app, we'd loop months to track precise amortization
             const monthsPassed = i * 12;
             // Calculate remaining balance formula
             const remaining = (P * (Math.pow(1+R, N) - Math.pow(1+R, monthsPassed))) / (Math.pow(1+R, N) - 1);
             const paidSoFar = monthlyPayment * monthsPassed;
             const interestPaid = paidSoFar - (P - remaining);
             
             yearlyData.push({
                 year: i,
                 invested: Math.round(P - remaining), // Principal Paid
                 interest: Math.round(interestPaid), // Interest Paid
                 total: Math.round(remaining), // Outstanding
                 realValue: 0 
             });
        }
        break;

    case CalculatorMode.STOCK:
       // Simple stock return + dividends
       const qty = quantity || 0;
       const bPrice = buyPrice || 0;
       const sPrice = sellPrice || 0;
       const divYield = dividendYield || 0;

       totalInvested = qty * bPrice;
       const capitalGains = (sPrice - bPrice) * qty;
       // Approximate total dividends over years (simplified linear)
       const totalDividends = (bPrice * qty) * (divYield / 100) * timePeriodYears;
       
       finalValue = totalInvested + capitalGains + totalDividends;
       
       // Linear interpolation for chart
       for(let i=1; i<=timePeriodYears; i++) {
           const progress = i/timePeriodYears;
           const currentVal = totalInvested + (capitalGains * progress) + ((totalDividends/timePeriodYears) * i);
           yearlyData.push({
               year: i,
               invested: totalInvested,
               interest: Math.round(currentVal - totalInvested),
               total: Math.round(currentVal),
               realValue: Math.round(currentVal) // Inflation not applied to stock simplified view
           });
       }
       break;

    case CalculatorMode.PROPERTY:
       // Simple Property: (Appreciated Value) + (Total Rent) - (Total Expenses)
       const pPrice = propertyPrice || 0;
       const rIncome = (rentalIncome || 0) * 12;
       const mExpenses = (monthlyExpenses || 0) * 12;
       const appRate = appreciationRate || 0;
       
       totalInvested = pPrice; // Buying price
       
       let currentPropValue = pPrice;
       let accumulatedNetRent = 0;

       for(let i=1; i<=timePeriodYears; i++) {
           currentPropValue = currentPropValue * (1 + appRate/100);
           // Assume rent increases by inflation rate? keeping simple for now
           const yearlyNetRent = rIncome - mExpenses; 
           accumulatedNetRent += yearlyNetRent;
           
           yearlyData.push({
               year: i,
               invested: pPrice,
               interest: Math.round((currentPropValue - pPrice) + accumulatedNetRent),
               total: Math.round(currentPropValue + accumulatedNetRent),
               realValue: Math.round(currentPropValue)
           })
       }
       finalValue = currentPropValue + accumulatedNetRent;
       break;
  }

  // Tax Logic (Simplified Capital Gains Tax on profits)
  // For LOAN mode, tax isn't usually calculated on output like this, but we keep structure consistent
  const totalGain = finalValue - totalInvested;
  const taxPayable = totalGain > 0 ? totalGain * (taxRate / 100) : 0;
  const postTaxValue = finalValue - taxPayable;

  return {
    totalInvested: Math.round(totalInvested),
    finalValue: Math.round(finalValue),
    totalInterest: Math.round(finalValue - totalInvested),
    taxPayable: Math.round(taxPayable),
    postTaxValue: Math.round(postTaxValue),
    yearlyData,
    monthlyPayment: Math.round(monthlyPayment)
  };
};