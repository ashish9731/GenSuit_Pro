import React, { useState } from 'react';
import { Upload, FileText, TrendingUp, TrendingDown, Lightbulb, Target, PieChart as PieIcon, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { analyzeSalesData } from '../services/geminiService';
import { AnalyticsReport } from '../types';

interface AnalyticsDashboardProps {
  onDataLoaded: (data: string) => void;
  isDarkMode: boolean;
}

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onDataLoaded, isDarkMode }) => {
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      onDataLoaded(text);
      try {
        const report = await analyzeSalesData(text);
        setData(report);
      } catch (err) {
        console.error(err);
        alert("Error analyzing data. Please ensure it is a valid CSV/JSON text file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const getChartData = () => {
    if (!data) return [];
    return data.personnelAnalysis.map(p => ({
        name: p.name,
        score: p.performanceScore
    }));
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 md:space-y-8 h-full animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="text-indigo-600" />
                Sales Intelligence
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Upload raw data to generate boardroom-ready insights.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {fileName && (
              <span className="text-sm text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg flex items-center justify-center gap-2">
                <FileText size={14}/> 
                <span className="truncate max-w-[150px]">{fileName}</span>
              </span>
            )}
            <label className="cursor-pointer bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none font-semibold">
                <Upload className="w-4 h-4" />
                Upload Data
                <input type="file" className="hidden" accept=".csv,.json,.txt" onChange={handleFileUpload} />
            </label>
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-96 space-y-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-indigo-600" />
                </div>
            </div>
            <div className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-white">Analyzing Dataset...</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Identifying trends, outliers, and opportunities.</p>
            </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !data && (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl h-96 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 mx-2 group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart2Icon className="w-10 h-10 text-indigo-500/50" />
            </div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No Data Uploaded</p>
            <p className="text-sm">Upload a CSV or JSON file to unlock insights</p>
        </div>
      )}

      {/* Dashboard Content */}
      {data && !loading && (
        <div className="space-y-6 md:space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {data.kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{kpi.label}</p>
                            {kpi.trend && (
                                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
                                    kpi.trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                                    kpi.trend === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}>
                                    {kpi.trend === 'up' ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                                    {kpi.change}
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{kpi.value}</h3>
                    </div>
                ))}
            </div>

            {/* Top Row: Executive Summary & Strategic Advisor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Executive Summary */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="text-indigo-500 w-5 h-5"/> Executive Summary
                        </h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            {['daily', 'weekly', 'monthly'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                                        activeTab === tab 
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 md:p-8 flex-1 bg-slate-50/30 dark:bg-slate-800/20">
                         <div className="prose prose-slate dark:prose-invert max-w-none">
                             <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                                {activeTab === 'daily' ? data.dailySummary : 
                                 activeTab === 'weekly' ? data.weeklySummary : 
                                 data.monthlySummary}
                             </p>
                         </div>
                    </div>
                    {data.forecast && (
                         <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-100 dark:border-indigo-800/30 flex items-start gap-3">
                             <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                             <div>
                                 <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">AI Forecast</span>
                                 <p className="text-sm font-medium text-slate-800 dark:text-indigo-100">{data.forecast}</p>
                             </div>
                         </div>
                    )}
                </div>

                {/* Strategic Advisor */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-2xl shadow-xl overflow-hidden p-6 relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Lightbulb size={120} />
                    </div>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                        <Lightbulb className="text-yellow-400 fill-yellow-400 w-5 h-5" /> Strategic Advisor
                    </h3>
                    <div className="space-y-4 relative z-10">
                        {data.strategicRecommendations.map((rec, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                    <p className="text-sm font-medium text-slate-100 leading-snug">{rec}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                 {/* Revenue Trend Line Chart */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="text-emerald-500 w-5 h-5"/> Revenue Trend
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f0f0f0'} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#9ca3af', fontSize: 10}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#9ca3af', fontSize: 10}} />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        color: isDarkMode ? '#fff' : '#000'
                                    }} 
                                />
                                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Product Distribution Pie Chart */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <PieIcon className="text-purple-500 w-5 h-5"/> Segment Distribution
                    </h3>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.productDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.productDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                     contentStyle={{
                                        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        color: isDarkMode ? '#fff' : '#000'
                                    }} 
                                />
                                <Legend 
                                    verticalAlign="middle" 
                                    align="right" 
                                    layout="vertical"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            </div>

            {/* Detailed Personnel Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team Performance Matrix</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tap a row to view the AI-generated Action Plan.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sales Count</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Score</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {data.personnelAnalysis.map((person, i) => (
                                <React.Fragment key={i}>
                                    <tr 
                                        onClick={() => setSelectedPerson(selectedPerson === person.name ? null : person.name)}
                                        className={`cursor-pointer transition-colors ${
                                            selectedPerson === person.name 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/10' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <td className="p-4 font-bold text-slate-800 dark:text-white">{person.name}</td>
                                        <td className="p-4 font-medium text-slate-600 dark:text-slate-300 font-mono">{person.revenueGenerated}</td>
                                        <td className="p-4 font-medium text-slate-600 dark:text-slate-300">{person.salesCount}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${
                                                            person.performanceScore >= 80 ? 'bg-emerald-500' :
                                                            person.performanceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                                        }`} 
                                                        style={{ width: `${person.performanceScore}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{person.performanceScore}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                                                {selectedPerson === person.name ? 'Close' : 'View Plan'}
                                            </span>
                                        </td>
                                    </tr>
                                    {selectedPerson === person.name && (
                                        <tr className="bg-indigo-50/50 dark:bg-indigo-900/5 animate-in fade-in slide-in-from-top-2">
                                            <td colSpan={5} className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-sm">
                                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2 block">Key Strength</span>
                                                        <p className="text-slate-700 dark:text-slate-300 text-sm">{person.keyStrength}</p>
                                                    </div>
                                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-sm">
                                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2 block">Area for Improvement</span>
                                                        <p className="text-slate-700 dark:text-slate-300 text-sm">{person.areaForImprovement}</p>
                                                    </div>
                                                    <div className="bg-indigo-600 p-4 rounded-xl shadow-md text-white">
                                                        <span className="text-xs font-bold text-indigo-200 uppercase tracking-wide mb-2 block flex items-center gap-1">
                                                            <Target size={12}/> Recommended Action Plan
                                                        </span>
                                                        <p className="text-sm font-medium leading-relaxed">{person.actionPlan}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const BarChart2Icon = ({className}:{className?:string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
);