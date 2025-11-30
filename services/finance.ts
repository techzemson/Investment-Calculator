import { InvestmentInputs, CalculationResult, YearData, CalculatorMode } from '../types';

export const calculateInvestment = (mode: CalculatorMode, inputs: InvestmentInputs): CalculationResult => {
  const {
    initialInvestment = 0,
    monthlyContribution = 0,
    stepUpRate = 0,
    timePeriodYears,
    interestRate,
    compoundingFrequency = 1,
    inflationRate = 0,
    taxRate = 0,
    expenseRatio = 0,
    startYear = new Date().getFullYear(),
    buyPrice,
    sellPrice,
    quantity,
    dividendYield,
    propertyPrice,
    rentalIncome,
    monthlyExpenses,
    appreciationRate,
    annualIncome,
    deductions,
    targetAmount,
    currentAge,
    retirementAge,
  } = inputs;

  let totalInvested = 0;
  let finalValue = 0;
  let yearlyData: YearData[] = [];
  let currentBalance = 0;
  let currentInvested = 0;
  let monthlyPayment = 0;
  let roiPercentage = 0;
  let duration = timePeriodYears;

  // Adjust Rate for Expense Ratio (Expense ratio reduces effective return)
  const effectiveRate = Math.max(0, interestRate - (expenseRatio || 0));
  const r = effectiveRate / 100;

  // Retirement Logic Override
  if (mode === CalculatorMode.RETIREMENT) {
      if (currentAge && retirementAge) {
          duration = Math.max(1, retirementAge - currentAge);
      }
  }

  const months = duration * 12;

  switch (mode) {
    case CalculatorMode.SIP:
    case CalculatorMode.RETIREMENT:
      // Combined Logic: Initial Lumpsum + SIP
      currentBalance = initialInvestment; 
      currentInvested = initialInvestment;
      let currentMonthlyContribution = monthlyContribution;
      const monthlyRate = r / 12;

      for (let i = 1; i <= months; i++) {
        // Apply interest to balance
        currentBalance = currentBalance * (1 + monthlyRate);
        
        // Add monthly contribution at end of month
        currentBalance += currentMonthlyContribution;
        currentInvested += currentMonthlyContribution;
        
        // Step Up Logic (Annual)
        if (i % 12 === 0) {
          if (stepUpRate > 0) {
            currentMonthlyContribution = currentMonthlyContribution * (1 + stepUpRate / 100);
          }
          
          const year = i / 12;
          const inflationFactor = Math.pow(1 + inflationRate / 100, year);
          yearlyData.push({
            year,
            label: startYear + year,
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

    case CalculatorMode.GOAL:
      // Goal Planner: Find required monthly contribution
      // FV = P(1+r)^n + PMT * [((1+r)^n - 1) / r]
      // We need to solve for PMT or P. Assuming P is given (Initial), solve for PMT.
      // Target = Initial*(1+r)^t + PMT * FutureValueFactor
      
      const target = targetAmount || 1000000;
      const ratePerMonth = r / 12;
      const nMonths = months;
      
      const lumpsumCompounded = initialInvestment * Math.pow(1 + ratePerMonth, nMonths);
      const remainingTarget = target - lumpsumCompounded;
      
      if (remainingTarget <= 0) {
          monthlyPayment = 0;
      } else {
          if (ratePerMonth === 0) {
              monthlyPayment = remainingTarget / nMonths;
          } else {
              monthlyPayment = remainingTarget * ratePerMonth / (Math.pow(1 + ratePerMonth, nMonths) - 1);
          }
      }

      // Generate Data based on this calculated PMT
      currentBalance = initialInvestment;
      currentInvested = initialInvestment;
      for (let i = 1; i <= months; i++) {
          currentBalance = currentBalance * (1 + ratePerMonth) + monthlyPayment;
          currentInvested += monthlyPayment;
          
          if (i % 12 === 0) {
              const year = i / 12;
              const inflationFactor = Math.pow(1 + inflationRate / 100, year);
              yearlyData.push({
                  year,
                  label: startYear + year,
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
      const n = mode === CalculatorMode.COMPOUND ? (compoundingFrequency || 1) : 1;
      const t = duration;
      
      totalInvested = initialInvestment;
      finalValue = initialInvestment * Math.pow(1 + (r / n), n * t);
      
      for (let i = 1; i <= t; i++) {
        const val = initialInvestment * Math.pow(1 + (r / n), n * i);
        const inflationFactor = Math.pow(1 + inflationRate / 100, i);
        yearlyData.push({
          year: i,
          label: startYear + i,
          invested: totalInvested,
          interest: Math.round(val - totalInvested),
          total: Math.round(val),
          realValue: Math.round(val / inflationFactor)
        });
      }
      break;

    case CalculatorMode.LOAN:
        const P = initialInvestment;
        const R_loan = interestRate / 12 / 100;
        const N_loan = duration * 12;
        
        if (R_loan === 0) {
            monthlyPayment = P / N_loan;
        } else {
            monthlyPayment = (P * R_loan * Math.pow(1 + R_loan, N_loan)) / (Math.pow(1 + R_loan, N_loan) - 1);
        }

        totalInvested = P; // Loan amount
        finalValue = monthlyPayment * N_loan; // Total Amount Payable

        for (let i = 1; i <= duration; i++) {
             const monthsPassed = i * 12;
             const remaining = (P * (Math.pow(1+R_loan, N_loan) - Math.pow(1+R_loan, monthsPassed))) / (Math.pow(1+R_loan, N_loan) - 1);
             const paidSoFar = monthlyPayment * monthsPassed;
             const interestPaid = paidSoFar - (P - remaining);
             
             yearlyData.push({
                 year: i,
                 label: startYear + i,
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
       // Dividends reinvested assumption or just payout
       const totalDividends = (bPrice * qty) * (divYield / 100) * duration;
       
       finalValue = totalInvested + capitalGains + totalDividends;
       
       for(let i=1; i<=duration; i++) {
           const progress = i/duration;
           const currentVal = totalInvested + (capitalGains * progress) + ((totalDividends/duration) * i);
           const inflationFactor = Math.pow(1 + inflationRate / 100, i);
           yearlyData.push({
               year: i,
               label: startYear + i,
               invested: totalInvested,
               interest: Math.round(currentVal - totalInvested),
               total: Math.round(currentVal),
               realValue: Math.round(currentVal / inflationFactor)
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

       for(let i=1; i<=duration; i++) {
           currentPropValue = currentPropValue * (1 + appRate/100);
           const yearlyNetRent = rIncome - mExpenses; 
           accumulatedNetRent += yearlyNetRent;
           const inflationFactor = Math.pow(1 + inflationRate / 100, i);
           
           yearlyData.push({
               year: i,
               label: startYear + i,
               invested: pPrice,
               interest: Math.round((currentPropValue - pPrice) + accumulatedNetRent),
               total: Math.round(currentPropValue + accumulatedNetRent),
               realValue: Math.round((currentPropValue + accumulatedNetRent) / inflationFactor)
           })
       }
       finalValue = currentPropValue + accumulatedNetRent;
       break;

    case CalculatorMode.ROI:
      totalInvested = initialInvestment;
      finalValue = sellPrice || initialInvestment;
      const profit = finalValue - totalInvested;
      roiPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
      
      for(let i=1; i<=duration; i++) {
        const progress = i/duration;
        const currentVal = totalInvested + (profit * progress);
        const inflationFactor = Math.pow(1 + inflationRate / 100, i);
        yearlyData.push({
            year: i,
            label: startYear + i,
            invested: totalInvested,
            interest: Math.round(currentVal - totalInvested),
            total: Math.round(currentVal),
            realValue: Math.round(currentVal / inflationFactor)
        });
      }
      break;

    case CalculatorMode.TAX:
      totalInvested = annualIncome || 0;
      const taxableIncome = Math.max(0, totalInvested - (deductions || 0));
      const calculatedTax = taxableIncome * (taxRate / 100);
      
      finalValue = totalInvested - calculatedTax;
      
      yearlyData.push({
          year: 1,
          label: startYear,
          invested: totalInvested, 
          interest: calculatedTax,
          total: finalValue, 
          realValue: finalValue
      });
      break;
  }

  // Common Post-Calculation Logic
  let taxPayable = 0;
  if (mode !== CalculatorMode.LOAN && mode !== CalculatorMode.TAX) {
      const totalGain = finalValue - totalInvested;
      taxPayable = totalGain > 0 ? totalGain * (taxRate / 100) : 0;
  } else if (mode === CalculatorMode.TAX) {
      taxPayable = totalInvested - finalValue;
  }

  const postTaxValue = finalValue - (mode === CalculatorMode.TAX ? 0 : taxPayable);
  
  // CAGR
  let cagr = 0;
  if (totalInvested > 0 && finalValue > 0 && duration > 0) {
      cagr = (Math.pow(finalValue / totalInvested, 1 / duration) - 1) * 100;
  }

  // Rule of 72
  let doublingTime = 0;
  if (effectiveRate > 0) {
      doublingTime = 72 / effectiveRate;
  }

  return {
    totalInvested: Math.round(totalInvested),
    finalValue: Math.round(finalValue),
    totalInterest: Math.round(finalValue - totalInvested),
    taxPayable: Math.round(taxPayable),
    postTaxValue: Math.round(postTaxValue),
    yearlyData,
    monthlyPayment: Math.round(monthlyPayment),
    roiPercentage,
    cagr: isFinite(cagr) ? cagr : 0,
    durationYears: duration,
    doublingTime: isFinite(doublingTime) ? doublingTime : 0,
    purchasingPowerLoss: finalValue - (yearlyData[yearlyData.length-1]?.realValue || 0)
  };
};