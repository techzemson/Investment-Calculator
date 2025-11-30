import { InvestmentInputs, CalculationResult, YearData, CalculatorMode } from '../types';

export const calculateInvestment = (mode: CalculatorMode, inputs: InvestmentInputs): CalculationResult => {
  const {
    initialInvestment,
    monthlyContribution,
    stepUpRate = 0,
    timePeriodYears,
    interestRate,
    compoundingFrequency = 1,
    inflationRate,
    taxRate,
    buyPrice,
    sellPrice,
    quantity,
    dividendYield,
    propertyPrice,
    rentalIncome,
    monthlyExpenses,
    appreciationRate,
    annualIncome,
    deductions
  } = inputs;

  let totalInvested = 0;
  let finalValue = 0;
  let yearlyData: YearData[] = [];
  let currentBalance = 0;
  let currentInvested = 0;
  let monthlyPayment = 0;
  let roiPercentage = 0;

  const r = interestRate / 100;
  
  // For most calculations
  const months = timePeriodYears * 12;

  switch (mode) {
    case CalculatorMode.SIP:
      currentBalance = initialInvestment; 
      currentInvested = initialInvestment;
      let currentMonthlyContribution = monthlyContribution;
      const monthlyRate = r / 12;

      for (let i = 1; i <= months; i++) {
        currentBalance = (currentBalance + currentMonthlyContribution) * (1 + monthlyRate);
        currentInvested += currentMonthlyContribution;
        
        // Step Up Logic: Increase contribution annually
        if (i % 12 === 0) {
          if (stepUpRate > 0) {
            currentMonthlyContribution = currentMonthlyContribution * (1 + stepUpRate / 100);
          }
          
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
    case CalculatorMode.COMPOUND:
      // A = P(1 + r/n)^(nt)
      const n = mode === CalculatorMode.COMPOUND ? (compoundingFrequency || 1) : 1;
      const t = timePeriodYears;
      
      totalInvested = initialInvestment;
      finalValue = initialInvestment * Math.pow(1 + (r / n), n * t);
      
      for (let i = 1; i <= t; i++) {
        const val = initialInvestment * Math.pow(1 + (r / n), n * i);
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
        const P = initialInvestment;
        const R_loan = interestRate / 12 / 100;
        const N_loan = timePeriodYears * 12;
        
        if (R_loan === 0) {
            monthlyPayment = P / N_loan;
        } else {
            monthlyPayment = (P * R_loan * Math.pow(1 + R_loan, N_loan)) / (Math.pow(1 + R_loan, N_loan) - 1);
        }

        totalInvested = P; // Loan amount
        finalValue = monthlyPayment * N_loan; // Total Amount Payable

        for (let i = 1; i <= timePeriodYears; i++) {
             const monthsPassed = i * 12;
             const remaining = (P * (Math.pow(1+R_loan, N_loan) - Math.pow(1+R_loan, monthsPassed))) / (Math.pow(1+R_loan, N_loan) - 1);
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
       const qty = quantity || 0;
       const bPrice = buyPrice || 0;
       const sPrice = sellPrice || 0;
       const divYield = dividendYield || 0;

       totalInvested = qty * bPrice;
       const capitalGains = (sPrice - bPrice) * qty;
       const totalDividends = (bPrice * qty) * (divYield / 100) * timePeriodYears;
       
       finalValue = totalInvested + capitalGains + totalDividends;
       
       for(let i=1; i<=timePeriodYears; i++) {
           const progress = i/timePeriodYears;
           const currentVal = totalInvested + (capitalGains * progress) + ((totalDividends/timePeriodYears) * i);
           yearlyData.push({
               year: i,
               invested: totalInvested,
               interest: Math.round(currentVal - totalInvested),
               total: Math.round(currentVal),
               realValue: Math.round(currentVal) 
           });
       }
       break;

    case CalculatorMode.PROPERTY:
       const pPrice = propertyPrice || 0;
       const rIncome = (rentalIncome || 0) * 12;
       const mExpenses = (monthlyExpenses || 0) * 12;
       const appRate = appreciationRate || 0;
       
       totalInvested = pPrice; 
       
       let currentPropValue = pPrice;
       let accumulatedNetRent = 0;

       for(let i=1; i<=timePeriodYears; i++) {
           currentPropValue = currentPropValue * (1 + appRate/100);
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

    case CalculatorMode.ROI:
      // Simple ROI calculation
      // initialInvestment = Cost
      // sellPrice = Final Value (Recycled input field)
      totalInvested = initialInvestment;
      finalValue = sellPrice || initialInvestment;
      const profit = finalValue - totalInvested;
      roiPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
      
      // Visualize linear growth for chart
      for(let i=1; i<=timePeriodYears; i++) {
        const progress = i/timePeriodYears;
        const currentVal = totalInvested + (profit * progress);
        yearlyData.push({
            year: i,
            invested: totalInvested,
            interest: Math.round(currentVal - totalInvested),
            total: Math.round(currentVal),
            realValue: Math.round(currentVal)
        });
      }
      break;

    case CalculatorMode.TAX:
      // Simple Income Tax Mode
      // totalInvested = Annual Income
      // finalValue = Net Income
      // totalInterest = Tax Paid (reusing field)
      totalInvested = annualIncome || 0;
      const taxableIncome = Math.max(0, totalInvested - (deductions || 0));
      // Simplified progressive tax logic or flat rate for now based on 'taxRate' input
      const calculatedTax = taxableIncome * (taxRate / 100);
      
      finalValue = totalInvested - calculatedTax;
      
      // Chart: Just show 1 year breakdown
      yearlyData.push({
          year: 1,
          invested: totalInvested, // Gross Income
          interest: calculatedTax, // Tax
          total: finalValue, // Net Income
          realValue: finalValue
      });
      break;
  }

  // Tax Logic for Investment Modes
  let taxPayable = 0;
  if (mode !== CalculatorMode.LOAN && mode !== CalculatorMode.TAX) {
      const totalGain = finalValue - totalInvested;
      taxPayable = totalGain > 0 ? totalGain * (taxRate / 100) : 0;
  } else if (mode === CalculatorMode.TAX) {
      taxPayable = totalInvested - finalValue; // For Tax mode, difference is the tax
  }

  const postTaxValue = finalValue - (mode === CalculatorMode.TAX ? 0 : taxPayable);

  return {
    totalInvested: Math.round(totalInvested),
    finalValue: Math.round(finalValue),
    totalInterest: Math.round(finalValue - totalInvested),
    taxPayable: Math.round(taxPayable),
    postTaxValue: Math.round(postTaxValue),
    yearlyData,
    monthlyPayment: Math.round(monthlyPayment),
    roiPercentage
  };
};