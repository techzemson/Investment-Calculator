import React, { useState, useEffect, useCallback } from 'react';
import { CalculatorMode, InvestmentInputs, CalculationResult, AIAnalysis } from './types';
import { calculateInvestment } from './services/finance';
import { analyzeInvestment } from './services/geminiService';
import { Results } from './components/Results';
import { 
  Calculator, LineChart, Home, DollarSign, TrendingUp, 
  Settings, Loader2, Info, Layers, Percent, FileText,
  Target, Armchair, Share2, RefreshCw, XCircle
} from 'lucide-react';

// Default Inputs
const defaultInputs: InvestmentInputs = {
  initialInvestment: 10000,
  monthlyContribution: 500,
  stepUpRate: 5,
  timePeriodYears: 10,
  interestRate: 8,
  compoundingFrequency: 1, 
  inflationRate: 3,
  taxRate: 15,
  expenseRatio: 0,
  startYear: new Date().getFullYear(),
  buyPrice: 100,
  sellPrice: 150,
  quantity: 50,
  dividendYield: 2,
  propertyPrice: 500000,
  rentalIncome: 2000,
  monthlyExpenses: 500,
  appreciationRate: 4,
  annualIncome: 60000,
  deductions: 5000,
  targetAmount: 1000000,
  currentAge: 30,
  retirementAge: 60,
  monthlyExpensesRetirement: 3000
};

// Improved Input Field with better Manual Entry Support
const SmartInputField = ({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max, 
  step = 1, 
  prefix = "", 
  suffix = "",
  tooltip
}: { 
  label: string, 
  value: number, 
  onChange: (val: number) => void, 
  min?: number, 
  max?: number, 
  step?: number, 
  prefix?: string, 
  suffix?: string,
  tooltip?: string
}) => {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  // Sync external value changes if they differ significantly (e.g. presets)
  useEffect(() => {
    if (parseFloat(inputValue) !== value) {
      setInputValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setInputValue(rawVal);
    
    // Only propagate valid numbers
    if (rawVal !== '' && !isNaN(parseFloat(rawVal))) {
      onChange(parseFloat(rawVal));
    } else if (rawVal === '') {
      onChange(0); // Treat empty as 0 for calculation safety, but keep visual empty
    }
  };

  const handleBlur = () => {
    if (inputValue === '' || isNaN(parseFloat(inputValue))) {
      setInputValue('0');
      onChange(0);
    }
  };

  return (
    <div className="flex flex-col gap-2 group">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-600 flex items-center gap-1 cursor-help" title={tooltip}>
          {label}
          {tooltip && <Info size={12} className="text-slate-400" />}
        </label>
        {/* Optional Reset for individual field */}
        {value !== 0 && (
            <button onClick={() => {onChange(0); setInputValue('0');}} className="text-xs text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Clear
            </button>
        )}
      </div>
      
      <div className="relative">
          {prefix && <span className="absolute left-3 top-2.5 text-slate-400 text-sm">{prefix}</span>}
          <input 
              type="number"
              value={inputValue === '0' && document.activeElement !== document.getElementById(`input-${label}`) ? '0' : inputValue} 
              id={`input-${label}`}
              onChange={handleChange}
              onBlur={handleBlur}
              step={step}
              className={`w-full p-2 ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''} text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all`}
          />
          {suffix && <span className="absolute right-3 top-2.5 text-slate-400 text-sm">{suffix}</span>}
      </div>
      
      {/* Slider for quick adjustments */}
      {max && (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value || 0}
            onChange={(e) => {
                const v = parseFloat(e.target.value);
                setInputValue(v.toString());
                onChange(v);
            }}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500 opacity-50 hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<CalculatorMode>(CalculatorMode.SIP);
  const [inputs, setInputs] = useState<InvestmentInputs>(defaultInputs);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [aiData, setAiData] = useState<AIAnalysis | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field: keyof InvestmentInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const navItems = [
    { mode: CalculatorMode.SIP, label: 'SIP / Mutual Fund', icon: TrendingUp },
    { mode: CalculatorMode.LUMPSUM, label: 'Lumpsum / FD', icon: DollarSign },
    { mode: CalculatorMode.GOAL, label: 'Goal Planner', icon: Target },
    { mode: CalculatorMode.RETIREMENT, label: 'Retirement', icon: Armchair },
    { mode: CalculatorMode.COMPOUND, label: 'Compound Calc', icon: Layers },
    { mode: CalculatorMode.STOCK, label: 'Stock Market', icon: LineChart },
    { mode: CalculatorMode.ROI, label: 'ROI Calculator', icon: Percent },
    { mode: CalculatorMode.PROPERTY, label: 'Real Estate', icon: Home },
    { mode: CalculatorMode.LOAN, label: 'Loans / EMI', icon: Calculator },
    { mode: CalculatorMode.TAX, label: 'Income Tax', icon: FileText },
  ];

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setProgress(0);
    setResult(null);
    setAiData(null);

    const interval = setInterval(() => {
      setProgress(prev => (prev >= 90 ? 90 : prev + 10));
    }, 100);

    const calcResult = calculateInvestment(mode, inputs);

    try {
        await new Promise(r => setTimeout(r, 600)); 
        setProgress(100);
        setResult(calcResult); 
        const aiResult = await analyzeInvestment(mode, inputs, calcResult);
        setAiData(aiResult);
    } catch (e) {
        console.error(e);
    } finally {
        clearInterval(interval);
        setIsCalculating(false);
        setProgress(100);
        // Auto scroll to results on mobile
        if(window.innerWidth < 768) {
            setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }
  }, [mode, inputs]);

  const InputField = (props: { label: string, field: keyof InvestmentInputs, min?: number, max?: number, step?: number, prefix?: string, suffix?: string, tooltip?: string }) => (
      <SmartInputField 
        {...props} 
        value={inputs[props.field] || 0}
        max={props.max || (props.field === 'interestRate' || props.field === 'stepUpRate' ? 30 : 1000000)}
        onChange={(val) => handleInputChange(props.field, val)}
      />
  );

  const copyLink = () => {
     // Placeholder for sharing
     alert("Configuration link copied to clipboard!");
  };

  const resetInputs = () => {
      setInputs(defaultInputs);
      setResult(null);
      setAiData(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-brand-600 p-2 rounded-lg text-white shadow-lg shadow-brand-200">
                <Calculator size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Investment Calculator</h1>
                <p className="text-xs text-brand-600 font-bold tracking-wide">PRO EDITION</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <button onClick={resetInputs} className="p-2 text-slate-400 hover:text-slate-600" title="Reset All">
                   <RefreshCw size={18} />
               </button>
               <button onClick={copyLink} className="p-2 text-slate-400 hover:text-brand-600 hidden md:block" title="Share Configuration">
                   <Share2 size={18} />
               </button>
               <div className="h-6 w-px bg-slate-200 mx-1"></div>
               <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-slate-100 border-none rounded-md text-sm font-medium text-slate-700 py-1 px-3 cursor-pointer hover:bg-slate-200"
               >
                 <option value="USD">USD ($)</option>
                 <option value="EUR">EUR (€)</option>
                 <option value="INR">INR (₹)</option>
                 <option value="GBP">GBP (£)</option>
               </select>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar / Input Section */}
          <div className="lg:col-span-4 space-y-6 no-print">
            
            {/* Mode Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <h2 className="font-semibold text-slate-700">Select Calculator</h2>
               </div>
               <div className="p-2 grid grid-cols-2 gap-1 max-h-[300px] overflow-y-auto">
                 {navItems.map((item) => (
                   <button
                     key={item.mode}
                     onClick={() => { setMode(item.mode); setResult(null); }}
                     className={`flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-lg text-xs font-medium transition-all text-center ${
                       mode === item.mode 
                       ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200' 
                       : 'text-slate-500 hover:bg-slate-50'
                     }`}
                   >
                     <item.icon size={20} className={mode === item.mode ? 'text-brand-600' : 'text-slate-400'}/>
                     {item.label}
                   </button>
                 ))}
               </div>
            </div>

            {/* Inputs Form */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 relative">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Configuration</h3>
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)} 
                    className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1"
                  >
                      {showAdvanced ? 'Simple Mode' : 'Advanced Mode'} <Settings size={12}/>
                  </button>
              </div>
              
              <div className="space-y-5">
                
                {/* Mode Specific Inputs */}

                {/* --- SIP / MUTUAL FUND / GOAL --- */}
                {(mode === CalculatorMode.SIP || mode === CalculatorMode.GOAL || mode === CalculatorMode.RETIREMENT) && (
                   <>
                     {mode === CalculatorMode.GOAL ? (
                         <InputField label="Target Goal Amount" field="targetAmount" max={10000000} step={5000} prefix={currency === 'INR' ? '₹' : '$'} />
                     ) : (
                         <InputField label="Monthly Contribution" field="monthlyContribution" max={100000} step={100} prefix={currency === 'INR' ? '₹' : '$'} />
                     )}
                     
                     {(mode === CalculatorMode.SIP || mode === CalculatorMode.RETIREMENT) && (
                         <InputField label="Initial Lumpsum (Optional)" field="initialInvestment" max={5000000} step={1000} prefix={currency === 'INR' ? '₹' : '$'} tooltip="Amount you invest upfront" />
                     )}
                     
                     {mode === CalculatorMode.RETIREMENT && (
                         <div className="grid grid-cols-2 gap-4">
                             <InputField label="Current Age" field="currentAge" max={90} suffix="yrs" />
                             <InputField label="Retire Age" field="retirementAge" max={90} suffix="yrs" />
                         </div>
                     )}
                   </>
                )}

                {/* --- LUMPSUM / COMPOUND / ROI --- */}
                {(mode === CalculatorMode.LUMPSUM || mode === CalculatorMode.COMPOUND || mode === CalculatorMode.ROI || mode === CalculatorMode.LOAN) && (
                   <InputField label={mode === 'LOAN' ? 'Loan Amount' : 'Investment Amount'} field="initialInvestment" max={10000000} step={1000} prefix={currency === 'INR' ? '₹' : '$'} />
                )}

                {(mode === CalculatorMode.ROI) && (
                    <InputField label="Final Returned Amount" field="sellPrice" max={10000000} step={1000} prefix={currency === 'INR' ? '₹' : '$'} />
                )}

                {/* --- PROPERTY --- */}
                {(mode === CalculatorMode.PROPERTY) && (
                   <>
                    <InputField label="Property Price" field="propertyPrice" max={10000000} step={5000} prefix={currency === 'INR' ? '₹' : '$'} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Monthly Rent" field="rentalIncome" max={50000} step={100} />
                        <InputField label="Expenses/mo" field="monthlyExpenses" max={10000} step={50} />
                    </div>
                    <InputField label="Yearly Appreciation (%)" field="appreciationRate" max={20} step={0.1} suffix="%" />
                   </>
                )}

                {/* --- STOCK --- */}
                {(mode === CalculatorMode.STOCK) && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Buy Price" field="buyPrice" max={5000} />
                        <InputField label="Sell Price" field="sellPrice" max={10000} />
                      </div>
                      <InputField label="Quantity" field="quantity" max={10000} />
                      <InputField label="Dividend Yield (%)" field="dividendYield" max={10} step={0.1} suffix="%" />
                    </>
                )}

                {/* --- TAX --- */}
                {(mode === CalculatorMode.TAX) && (
                    <>
                     <InputField label="Annual Income" field="annualIncome" max={10000000} step={1000} />
                     <InputField label="Deductions" field="deductions" max={500000} step={1000} />
                    </>
                )}

                {/* --- COMMON DURATION & RATE --- */}
                {mode !== CalculatorMode.TAX && mode !== CalculatorMode.RETIREMENT && (
                    <div className="pt-4 border-t border-slate-100 space-y-5">
                        <InputField label="Duration (Years)" field="timePeriodYears" max={50} suffix="yrs" />
                        
                        {mode !== 'PROPERTY' && mode !== 'STOCK' && mode !== 'ROI' && (
                            <div className="space-y-2">
                                <InputField label="Expected Return / Interest (%)" field="interestRate" max={30} step={0.1} suffix="%" />
                                {/* Risk Presets */}
                                <div className="flex gap-2">
                                    <button onClick={() => handleInputChange('interestRate', 6)} className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 transition-colors">Conservative (6%)</button>
                                    <button onClick={() => handleInputChange('interestRate', 12)} className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 transition-colors">Moderate (12%)</button>
                                    <button onClick={() => handleInputChange('interestRate', 18)} className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 transition-colors">Aggressive (18%)</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- ADVANCED SETTINGS --- */}
                {showAdvanced && mode !== 'TAX' && (
                    <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200 animate-fade-in-up">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advanced Parameters</h4>
                        
                        {(mode === 'SIP' || mode === 'RETIREMENT' || mode === 'GOAL') && (
                            <InputField label="Annual Step-up (%)" field="stepUpRate" max={20} step={1} suffix="%" tooltip="Increase your contribution every year" />
                        )}
                        
                        {(mode === 'SIP' || mode === 'STOCK') && (
                            <InputField label="Expense Ratio (%)" field="expenseRatio" max={3} step={0.1} suffix="%" tooltip="Fund management fees" />
                        )}

                        {mode !== 'LOAN' && (
                            <>
                                <InputField label="Inflation Rate (%)" field="inflationRate" max={15} step={0.1} suffix="%" />
                                <InputField label="Tax on Gains (%)" field="taxRate" max={40} step={0.5} suffix="%" />
                            </>
                        )}

                        <InputField label="Start Year" field="startYear" max={2100} min={1900} step={1} />
                    </div>
                )}

              </div>

              {/* Action Button */}
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="mt-8 w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-200 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isCalculating ? (
                    <>
                     <Loader2 className="animate-spin" /> Analyzing...
                    </>
                ) : (
                    "Calculate Plan"
                )}
              </button>
            </div>
          </div>

          {/* Right Content / Results */}
          <div className="lg:col-span-8 space-y-8" id="results-section">
             
             {/* Intro State */}
             {!result && !isCalculating && (
                 <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-dashed border-slate-300 opacity-60">
                     <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-6">
                        <TrendingUp size={48} className="text-brand-300" />
                     </div>
                     <h2 className="text-2xl font-bold text-slate-400 mb-2">Ready to Plan?</h2>
                     <p className="text-slate-400 max-w-md">Enter your investment details on the left to generate comprehensive financial projections.</p>
                 </div>
             )}

             {/* Progress Overlay */}
             {isCalculating && (
                 <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
                     <div className="w-full max-w-md space-y-6">
                         <div className="flex justify-between text-sm font-semibold text-slate-600">
                             <span>Processing Financial Model...</span>
                             <span>{progress}%</span>
                         </div>
                         <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-brand-500 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                             ></div>
                         </div>
                     </div>
                 </div>
             )}

             {/* Results View */}
             {result && !isCalculating && (
                 <Results result={result} mode={mode} aiData={aiData} currency={currency === 'USD' ? 'USD' : currency === 'EUR' ? 'EUR' : currency === 'GBP' ? 'GBP' : 'INR'} />
             )}
          </div>
        </div>
      </main>
      
      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 no-print">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg shadow-lg"
          >
              Configure & Calculate
          </button>
      </div>

    </div>
  );
};

export default App;