import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { CalculationResult, CalculatorMode, AIAnalysis } from '../types';
import { 
  TrendingUp, DollarSign, PieChart as PieIcon, AlertTriangle, Percent, Clock, 
  BarChart3, Download, Printer, Table, Eye, EyeOff, Target, Calendar
} from 'lucide-react';

interface ResultsProps {
  result: CalculationResult;
  mode: CalculatorMode;
  aiData: AIAnalysis | null;
  currency: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const formatCurrency = (val: number, curr: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr,
    maximumFractionDigits: 0
  }).format(val);
};

export const Results: React.FC<ResultsProps> = ({ result, mode, aiData, currency }) => {
  const [showRealValue, setShowRealValue] = useState(false);

  const pieData = [
    { name: 'Invested', value: result.totalInvested },
    { name: 'Gains', value: result.totalInterest > 0 ? result.totalInterest : 0 },
  ];

  if (mode === CalculatorMode.LOAN) {
      pieData[0] = { name: 'Principal', value: result.totalInvested };
      pieData[1] = { name: 'Interest', value: result.totalInterest };
  } else if (mode === CalculatorMode.TAX) {
      pieData[0] = { name: 'Net Income', value: result.finalValue };
      pieData[1] = { name: 'Tax', value: result.taxPayable };
  }

  const getLabel1 = () => {
      if (mode === CalculatorMode.LOAN) return 'Total Principal';
      if (mode === CalculatorMode.TAX) return 'Gross Income';
      return 'Total Investment';
  };

  const getLabel2 = () => {
      if (mode === CalculatorMode.LOAN) return 'Total Payable';
      if (mode === CalculatorMode.TAX) return 'Net Income';
      return 'Maturity Value';
  };

  const getLabel3 = () => {
      if (mode === CalculatorMode.LOAN) return 'Monthly EMI';
      if (mode === CalculatorMode.TAX) return 'Tax Payable';
      if (mode === CalculatorMode.ROI) return 'Absolute ROI';
      if (mode === CalculatorMode.GOAL) return 'Required Monthly';
      return 'Est. Returns';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Year', 'Calendar Year', 'Invested', 'Interest', 'Total Value', 'Inflation Adj Value'];
    const rows = result.yearlyData.map(d => [
        d.year, d.label, d.invested, d.interest, d.total, d.realValue
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "investment_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* High Visibility Duration Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-blue-700 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 no-print">
         <div className="flex items-center gap-4">
             <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                 <Clock size={28} className="text-white" />
             </div>
             <div>
                 <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Investment Horizon</p>
                 <h2 className="text-3xl font-bold">{result.durationYears} <span className="text-xl font-normal opacity-80">Years</span></h2>
             </div>
         </div>
         <div className="flex gap-4 items-center">
             {result.doublingTime > 0 && mode !== 'LOAN' && mode !== 'TAX' && (
                 <div className="text-right hidden md:block">
                     <p className="text-blue-100 text-xs">Rule of 72</p>
                     <p className="font-semibold">Doubles in ~{result.doublingTime.toFixed(1)} yrs</p>
                 </div>
             )}
             <div className="h-10 w-px bg-white/20 hidden md:block"></div>
             <div className="flex gap-2">
                <button onClick={handleExportCSV} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" title="Export CSV">
                    <Download size={20} />
                </button>
                <button onClick={handlePrint} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" title="Print Report">
                    <Printer size={20} />
                </button>
             </div>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign size={48} className="text-slate-900" />
          </div>
          <span className="text-slate-500 text-sm font-medium mb-1">{getLabel1()}</span>
          <span className="text-2xl font-bold text-slate-900">{formatCurrency(result.totalInvested, currency)}</span>
        </div>
        
        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={48} className="text-brand-600" />
          </div>
          <span className="text-slate-500 text-sm font-medium mb-1">{getLabel2()}</span>
          <span className="text-2xl font-bold text-brand-600">{formatCurrency(result.finalValue, currency)}</span>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Percent size={48} className={mode === 'LOAN' ? 'text-orange-500' : 'text-green-500'} />
          </div>
          <span className="text-slate-500 text-sm font-medium mb-1">{getLabel3()}</span>
          <span className={`text-2xl font-bold ${mode === 'LOAN' || mode === 'TAX' ? 'text-orange-500' : 'text-green-500'}`}>
            {mode === CalculatorMode.ROI 
                ? `${result.roiPercentage?.toFixed(2)}%`
                : formatCurrency(mode === CalculatorMode.LOAN || mode === CalculatorMode.GOAL ? (result.monthlyPayment || 0) : mode === CalculatorMode.TAX ? result.taxPayable : result.totalInterest, currency)
            }
          </span>
           <div className={`mt-2 text-xs ${mode === 'LOAN' || mode === 'TAX' ? 'text-orange-400' : 'text-green-400'} flex items-center gap-1`}>
             {mode === 'GOAL' && 'Monthly Investment'}
             {mode !== 'GOAL' && (mode === CalculatorMode.ROI ? 'Total Return' : mode === 'LOAN' ? 'Monthly outflow' : mode === 'TAX' ? 'Deduction' : 'Profit/Gain')}
          </div>
        </div>

        {/* Card 4 - Contextual */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            {mode === CalculatorMode.TAX ? (
                 <>
                    <span className="text-slate-500 text-sm font-medium mb-1">Effective Tax Rate</span>
                    <span className="text-2xl font-bold text-slate-700">
                        {result.totalInvested > 0 ? ((result.taxPayable / result.totalInvested) * 100).toFixed(1) : 0}%
                    </span>
                 </>
            ) : mode === CalculatorMode.LOAN ? (
                 <>
                    <span className="text-slate-500 text-sm font-medium mb-1">Total Interest</span>
                    <span className="text-2xl font-bold text-red-500">{formatCurrency(result.totalInterest, currency)}</span>
                 </>
            ) : (
                <>
                    <span className="text-slate-500 text-sm font-medium mb-1">CAGR (Growth)</span>
                    <span className="text-2xl font-bold text-purple-600">{result.cagr?.toFixed(2)}%</span>
                    <div className="mt-2 text-xs text-purple-400 flex items-center gap-1">
                        Annual Avg Growth
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print-break-inside-avoid">
        {/* Growth Chart */}
        {mode !== CalculatorMode.TAX && (
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Growth Trajectory</h3>
                        <p className="text-xs text-slate-400">Visualizing wealth accumulation over time</p>
                    </div>
                    <button 
                        onClick={() => setShowRealValue(!showRealValue)}
                        className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-slate-600"
                    >
                        {showRealValue ? <EyeOff size={14}/> : <Eye size={14}/>}
                        {showRealValue ? 'Show Nominal' : 'Show Inflation Adj.'}
                    </button>
                </div>
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.yearlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                            <YAxis 
                                stroke="#94a3b8" 
                                tick={{fontSize: 12}} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} 
                            />
                            <RechartsTooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                formatter={(value: number) => formatCurrency(value, currency)}
                                labelFormatter={(label) => `Year: ${label}`}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            
                            {!showRealValue && (
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Nominal Value" />
                            )}
                            {showRealValue && (
                                <Area type="monotone" dataKey="realValue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorReal)" name="Inflation Adj. Value" />
                            )}
                            <Area type="monotone" dataKey="invested" stroke="#cbd5e1" strokeWidth={2} fillOpacity={0} fill="transparent" strokeDasharray="5 5" name={mode === 'LOAN' ? 'Principal Paid' : 'Invested Amount'} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* Ratio Chart */}
        <div className={`${mode === CalculatorMode.TAX ? 'lg:col-span-3' : ''} bg-white p-6 rounded-xl shadow-md border border-slate-100 flex flex-col`}>
             <h3 className="text-lg font-semibold text-slate-800 mb-2">{mode === 'TAX' ? 'Tax Breakdown' : 'Distribution'}</h3>
             <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatCurrency(value, currency)} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                    </PieChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>

      {/* Detailed Table (Always Visible) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Table size={18} className="text-brand-600" />
                  <h3 className="font-semibold text-slate-700">Yearly Breakdown</h3>
              </div>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm text-left relative">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                      <tr>
                          <th className="px-6 py-4">Year</th>
                          <th className="px-6 py-4">Calendar</th>
                          <th className="px-6 py-4 text-right">Invested</th>
                          <th className="px-6 py-4 text-right">Interest/Gain</th>
                          <th className="px-6 py-4 text-right text-brand-600">Total Value</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {result.yearlyData.map((row) => (
                          <tr key={row.year} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 font-medium text-slate-500">{row.year}</td>
                              <td className="px-6 py-3 text-slate-500">{row.label}</td>
                              <td className="px-6 py-3 text-right text-slate-700">{formatCurrency(row.invested, currency)}</td>
                              <td className="px-6 py-3 text-right text-green-600">+{formatCurrency(row.interest, currency)}</td>
                              <td className="px-6 py-3 text-right font-bold text-slate-800">{formatCurrency(row.total, currency)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Additional Stats Strip */}
      {mode !== CalculatorMode.TAX && mode !== CalculatorMode.LOAN && (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
             <div>
                 <p className="text-xs text-slate-500 mb-1">Inflation Adjusted Value</p>
                 <p className="font-semibold text-slate-700">{formatCurrency(result.yearlyData[result.yearlyData.length-1]?.realValue || 0, currency)}</p>
             </div>
             <div>
                 <p className="text-xs text-slate-500 mb-1">Post-Tax Value</p>
                 <p className="font-semibold text-slate-700">{formatCurrency(result.postTaxValue, currency)}</p>
             </div>
             <div>
                 <p className="text-xs text-slate-500 mb-1">Purchasing Power Loss</p>
                 <p className="font-semibold text-red-400">-{formatCurrency(result.purchasingPowerLoss || 0, currency)}</p>
             </div>
             <div>
                 <p className="text-xs text-slate-500 mb-1">Real Wealth Gain</p>
                 <p className="font-semibold text-green-600">{formatCurrency((result.yearlyData[result.yearlyData.length-1]?.realValue || 0) - result.totalInvested, currency)}</p>
             </div>
         </div>
      )}

      {/* AI Analysis Section */}
      {aiData && (
          <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-xl p-8 shadow-sm print-break-inside-avoid">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-brand-100 rounded-lg">
                    <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">AI Financial Insights</h3>
              </div>
              
              <div className="space-y-4">
                  <div>
                      <h4 className="font-semibold text-slate-700 mb-2">Executive Summary</h4>
                      <p className="text-slate-600 leading-relaxed">{aiData.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="bg-white p-4 rounded-lg border border-slate-100">
                          <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                              Smart Recommendations
                          </h4>
                          <ul className="space-y-2">
                              {aiData.recommendations.map((rec, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                      <span className="text-green-500 mt-1">•</span>
                                      {rec}
                                  </li>
                              ))}
                          </ul>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-slate-100">
                          <h4 className="font-semibold text-orange-700 mb-2">Risk Assessment</h4>
                          <p className="text-sm text-slate-600">{aiData.riskAssessment}</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};