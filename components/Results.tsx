import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { CalculationResult, CalculatorMode, AIAnalysis } from '../types';
import { Download, TrendingUp, DollarSign, PieChart as PieIcon, AlertTriangle } from 'lucide-react';

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
  
  const pieData = [
    { name: 'Invested', value: result.totalInvested },
    { name: 'Gains', value: result.totalInterest > 0 ? result.totalInterest : 0 },
  ];

  if(mode === CalculatorMode.LOAN) {
      pieData[0] = { name: 'Principal', value: result.totalInvested };
      pieData[1] = { name: 'Interest', value: result.totalInterest };
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Actions */}
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-slate-800">Analysis Result</h2>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
        >
          <Download size={18} />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-slate-500 text-sm font-medium mb-1">Total {mode === 'LOAN' ? 'Principal' : 'Investment'}</span>
          <span className="text-2xl font-bold text-slate-900">{formatCurrency(result.totalInvested, currency)}</span>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
             <DollarSign size={12} /> Principal amount
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-slate-500 text-sm font-medium mb-1">{mode === 'LOAN' ? 'Total Payable' : 'Future Value'}</span>
          <span className="text-2xl font-bold text-brand-600">{formatCurrency(result.finalValue, currency)}</span>
           <div className="mt-2 text-xs text-brand-400 flex items-center gap-1">
             <TrendingUp size={12} /> Includes growth
          </div>
        </div>

        {mode === 'LOAN' ? (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
             <span className="text-slate-500 text-sm font-medium mb-1">Monthly EMI</span>
             <span className="text-2xl font-bold text-orange-500">{formatCurrency(result.monthlyPayment || 0, currency)}</span>
              <div className="mt-2 text-xs text-orange-400 flex items-center gap-1">
                <PieIcon size={12} /> Monthly outflow
             </div>
           </div>
        ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <span className="text-slate-500 text-sm font-medium mb-1">Est. Returns</span>
            <span className="text-2xl font-bold text-green-500">{formatCurrency(result.totalInterest, currency)}</span>
             <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
               <TrendingUp size={12} /> Absolute Profit
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-slate-500 text-sm font-medium mb-1">Post Tax Value</span>
          <span className="text-2xl font-bold text-slate-700">{formatCurrency(result.postTaxValue, currency)}</span>
           <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
             <AlertTriangle size={12} /> After deductions
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-break-inside-avoid">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Growth Trajectory</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.yearlyData}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="year" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
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
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" name="Total Value" />
                        <Area type="monotone" dataKey="invested" stroke="#94a3b8" fillOpacity={1} fill="url(#colorInvested)" name={mode === 'LOAN' ? 'Principal Paid' : 'Invested Amount'} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Ratio Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
             <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribution</h3>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatCurrency(value, currency)} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>

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
              <div className="mt-4 text-xs text-slate-400 italic">
                  * Analysis generated by Gemini AI. Not professional financial advice.
              </div>
          </div>
      )}
    </div>
  );
};