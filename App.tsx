import React, { useState, useEffect, useCallback } from 'react';
import { CalculatorMode, InvestmentInputs, CalculationResult, AIAnalysis } from './types';
import { calculateInvestment } from './services/finance';
import { analyzeInvestment } from './services/geminiService';
import { Results } from './components/Results';
import { 
  Calculator, LineChart, Home, DollarSign, TrendingUp, 
  Settings, Loader2, Info, Layers, Percent, FileText
} from 'lucide-react';

// Default Inputs
const defaultInputs: InvestmentInputs = {
  initialInvestment: 10000,
  monthlyContribution: 500,
  stepUpRate: 5,
  timePeriodYears: 10,
  interestRate: 8,
  compoundingFrequency: 1, // Annual
  inflationRate: 3,
  taxRate: 15,
  buyPrice: 100,
  sellPrice: 150,
  quantity: 50,
  dividendYield: 2,
  propertyPrice: 500000,
  rentalIncome: 2000,
  monthlyExpenses: 500,
  appreciationRate: 4,
  annualIncome: 60000,
  deductions: 5000
};

// Helper Input Component to handle manual entry better
const SmartInputField = ({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max, 
  step = 1, 
  prefix = "", 
  suffix = "" 
}: { 
  label: string, 
  value: number, 
  onChange: (val: number) => void, 
  min?: number, 
  max?: number, 
  step?: number, 
  prefix?: string, 
  suffix?: string 
}) => {
  // We don't use local state here to avoid complex sync, but we rely on the parent sending us the value.
  // The trick for number inputs is not to use value={value || 0} which forces 0 on empty.
  // Instead we handle the input change carefully.

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-600 flex justify-between">
        {label}
        {/* Only show the current value indicator if we have a valid number */}
        <span className="text-brand-600 font-semibold">{prefix}{isNaN(value) ? 0 : value}{suffix}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={isNaN(value) ? min : value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
      />
      <input 
          type="number" 
          step={step}
          value={value === 0 ? '' : value} // Allow showing placeholder if 0, or just show empty to allow typing
          placeholder={value === 0 ? "0" : ""}
          onChange={(e) => {
             const val = e.target.value;
             // If empty, pass 0. If valid number, pass number. 
             // Note: This prevents "1." state if we strictly force number, but it's a tradeoff for 'removing 0'
             // To allow "1.", we would need local string state.
             // For now, let's just make it not force 0 on backspace by checking for empty string
             onChange(val === '' ? 0 : parseFloat(val));
          }}
          className="mt-1 p-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none"
      />
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

  const handleInputChange = (field: keyof InvestmentInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const navItems = [
    { mode: CalculatorMode.SIP, label: 'SIP / Mutual Fund', icon: TrendingUp },
    { mode: CalculatorMode.LUMPSUM, label: 'Lumpsum / FD', icon: DollarSign },
    { mode: CalculatorMode.COMPOUND, label: 'Compound Calc', icon: Layers },
    { mode: CalculatorMode.STOCK, label: 'Stock Market', icon: LineChart },
    { mode: CalculatorMode.ROI, label: 'Return on Investment', icon: Percent },
    { mode: CalculatorMode.PROPERTY, label: 'Real Estate', icon: Home },
    { mode: CalculatorMode.LOAN, label: 'Loans / EMI', icon: Calculator },
    { mode: CalculatorMode.TAX, label: 'Income Tax', icon: FileText },
  ];

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setProgress(0);
    setResult(null);
    setAiData(null);

    // Simulate Calculation Progress for UX
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    // Perform Calculation
    const calcResult = calculateInvestment(mode, inputs);

    // Wait for AI (real async)
    try {
        await new Promise(r => setTimeout(r, 800)); 
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
    }
  }, [mode, inputs]);

  // Wrapper for InputField to make usage cleaner
  const InputField = (props: { label: string, field: keyof InvestmentInputs, min?: number, max?: number, step?: number, prefix?: string, suffix?: string }) => (
      <SmartInputField 
        {...props} 
        value={inputs[props.field] || 0}
        max={props.max || (props.field === 'interestRate' || props.field === 'stepUpRate' ? 30 : 1000000)}
        onChange={(val) => handleInputChange(props.field, val)}
      />
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-brand-600 p-2 rounded-lg text-white">
                <Calculator size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Investment Calculator</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide">ADVANCED TOOLS</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
               <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-slate-100 border-none rounded-md text-sm font-medium text-slate-700 py-1 px-3"
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
               <div className="p-4 bg-slate-50 border-b border-slate-100">
                 <h2 className="font-semibold text-slate-700">Select Calculator</h2>
               </div>
               <div className="p-2 grid grid-cols-1 gap-1">
                 {navItems.map((item) => (
                   <button
                     key={item.mode}
                     onClick={() => { setMode(item.mode); setResult(null); }}
                     className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                       mode === item.mode 
                       ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200' 
                       : 'text-slate-600 hover:bg-slate-50'
                     }`}
                   >
                     <item.icon size={18} />
                     {item.label}
                   </button>
                 ))}
               </div>
            </div>

            {/* Inputs Form */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-blue-600"></div>
              <h3 className="text-lg font-bold text-slate-800 mb-6">Configuration</h3>
              
              <div className="space-y-6">
                
                {/* Dynamic Inputs */}
                {(mode === CalculatorMode.SIP || mode === CalculatorMode.LUMPSUM || mode === CalculatorMode.LOAN || mode === CalculatorMode.COMPOUND || mode === CalculatorMode.ROI) && (
                   <InputField label="Investment Amount / Principal" field="initialInvestment" max={1000000} step={1000} />
                )}

                {(mode === CalculatorMode.SIP) && (
                   <>
                    <InputField label="Monthly Contribution" field="monthlyContribution" max={50000} step={100} />
                    <InputField label="Annual Step-up Rate (%)" field="stepUpRate" max={20} step={1} />
                   </>
                )}

                {(mode === CalculatorMode.ROI) && (
                    <InputField label="Final Returned Amount" field="sellPrice" max={2000000} step={1000} />
                )}

                {(mode === CalculatorMode.TAX) && (
                    <>
                     <InputField label="Annual Income" field="annualIncome" max={2000000} step={1000} />
                     <InputField label="Deductions" field="deductions" max={500000} step={1000} />
                    </>
                )}

                {(mode === CalculatorMode.PROPERTY) && (
                   <>
                    <InputField label="Property Price" field="propertyPrice" max={5000000} step={5000} />
                    <InputField label="Monthly Rental Income" field="rentalIncome" max={20000} step={100} />
                    <InputField label="Monthly Expenses" field="monthlyExpenses" max={5000} step={50} />
                    <InputField label="Yearly Appreciation (%)" field="appreciationRate" max={15} step={0.1} />
                   </>
                )}

                {(mode === CalculatorMode.STOCK) && (
                    <>
                      <InputField label="Buy Price" field="buyPrice" max={5000} />
                      <InputField label="Target Sell Price" field="sellPrice" max={10000} />
                      <InputField label="Quantity" field="quantity" max={1000} />
                      <InputField label="Dividend Yield (%)" field="dividendYield" max={10} step={0.1} />
                    </>
                )}

                {/* Common Time/Rate */}
                {mode !== CalculatorMode.TAX && (
                    <div className="pt-4 border-t border-slate-100 space-y-6">
                        <InputField label="Time Period (Years)" field="timePeriodYears" max={40} />
                        
                        {mode !== 'PROPERTY' && mode !== 'STOCK' && mode !== 'ROI' && (
                            <InputField label="Interest Rate (%)" field="interestRate" max={25} step={0.1} />
                        )}

                        {(mode === CalculatorMode.COMPOUND) && (
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-600">Compounding Frequency</label>
                                <select 
                                    value={inputs.compoundingFrequency}
                                    onChange={(e) => handleInputChange('compoundingFrequency', parseInt(e.target.value))}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                                >
                                    <option value={1}>Annually (1x/yr)</option>
                                    <option value={2}>Semi-Annually (2x/yr)</option>
                                    <option value={4}>Quarterly (4x/yr)</option>
                                    <option value={12}>Monthly (12x/yr)</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Advanced Toggles - Enabled for ROI now */}
                <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                        <Settings size={14} /> Advanced Settings
                    </div>
                    {/* Hiding Inflation for LOAN and TAX only */}
                    {mode !== 'TAX' && mode !== 'LOAN' && (
                        <InputField label="Inflation Rate (%)" field="inflationRate" max={15} step={0.1} />
                    )}
                    {/* Hiding Tax Rate for LOAN only */}
                    {(mode !== 'LOAN') && (
                        <InputField label={mode === 'TAX' ? "Tax Rate (%)" : "Tax on Gains (%)"} field="taxRate" max={40} step={0.5} />
                    )}
                </div>
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
                    "Calculate & Plan"
                )}
              </button>
            </div>
          </div>

          {/* Right Content / Results */}
          <div className="lg:col-span-8 space-y-8">
             
             {/* Intro State */}
             {!result && !isCalculating && (
                 <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-dashed border-slate-300 opacity-60">
                     <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-6">
                        <TrendingUp size={48} className="text-brand-300" />
                     </div>
                     <h2 className="text-2xl font-bold text-slate-400 mb-2">Ready to Plan?</h2>
                     <p className="text-slate-400 max-w-md">Enter your investment details on the left to generate comprehensive financial projections and AI-powered insights.</p>
                 </div>
             )}

             {/* Progress Modal / Overlay */}
             {isCalculating && (
                 <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
                     <div className="w-full max-w-md space-y-4">
                         <div className="flex justify-between text-sm font-semibold text-slate-600 mb-2">
                             <span>Processing Data...</span>
                             <span>{progress}%</span>
                         </div>
                         <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-brand-500 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                             ></div>
                         </div>
                         <p className="text-slate-400 text-sm mt-4 animate-pulse">
                             consulting AI models for financial wisdom...
                         </p>
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