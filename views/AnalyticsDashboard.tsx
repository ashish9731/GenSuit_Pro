import React, { useState, useMemo, useEffect } from 'react';
import { Upload, FileText, TrendingUp, TrendingDown, Lightbulb, Target, PieChart as PieIcon, Activity, AlertCircle, Filter, RefreshCw, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { analyzeSalesData } from '../services/geminiService';
import { AnalyticsReport } from '../types';
import * as XLSX from 'xlsx';

interface AnalyticsDashboardProps {
  onDataLoaded: (data: string, fileName?: string) => void;
  isDarkMode: boolean;
  // Add props to preserve document data when navigating between views
  preservedDocumentData?: string;
  preservedFileName?: string;
}

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  onDataLoaded, 
  isDarkMode,
  preservedDocumentData,
  preservedFileName
}) => {
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>(preservedFileName || '');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [rowAnalysis, setRowAnalysis] = useState<AnalyticsReport | null>(null);
  const [showRowModal, setShowRowModal] = useState(false);

  // Filtering State
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({});
  const [availableFilters, setAvailableFilters] = useState<{[key: string]: string[]}>({});
  const [filteredTableRows, setFilteredTableRows] = useState<any[]>([]);

  // Initialize with preserved data if available
  useEffect(() => {
    if (preservedDocumentData && preservedFileName) {
      setFileName(preservedFileName);
      const rows = parseData(preservedDocumentData);
      // Analyze the preserved data
      analyzeSalesData(preservedDocumentData).then(setData).catch(console.error);
    }
  }, [preservedDocumentData, preservedFileName]);

  const parseData = (text: string) => {
    try {
        let rows: any[] = [];
        let detectedHeaders: string[] = [];

        const trimmed = text.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            // Try JSON
            try {
                const json = JSON.parse(trimmed);
                if (Array.isArray(json)) {
                    rows = json;
                } else if (typeof json === 'object') {
                    // Try to find an array property
                    const arrayProp = Object.values(json).find(v => Array.isArray(v));
                    if (arrayProp && Array.isArray(arrayProp)) rows = arrayProp;
                }
            } catch (e) { console.error("JSON parse failed", e); }
        }
        
        if (rows.length === 0) {
            // Try CSV
            const lines = trimmed.split('\n');
            if (lines.length > 1) {
                detectedHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    // Handle quoted commas purely (simple regex) or simple split
                    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
                    const row: any = {};
                    detectedHeaders.forEach((h, idx) => {
                        row[h] = values[idx];
                    });
                    rows.push(row);
                }
            }
        } else {
            // If JSON, extract headers from first object
            if (rows.length > 0) {
                detectedHeaders = Object.keys(rows[0]);
            }
        }

        setHeaders(detectedHeaders);
        setParsedRows(rows);
        // Initialize filtered table rows with all data
        setFilteredTableRows(rows);
        generateFilterOptions(rows, detectedHeaders);
        
        // Automatically generate KPIs based on columns
        const automaticKPIs = generateAutomaticKPIs(rows, detectedHeaders);
        
        // Update data with automatic KPIs if needed
        if (data) {
          // If we have data but it has no meaningful KPIs, use automatic ones
          if (data.kpis.length === 0 || (data.kpis.length === 1 && data.kpis[0].label === "Total Records")) {
            setData({
              ...data,
              kpis: automaticKPIs
            });
          }
        }
        
        return rows;
    } catch (e) {
        console.error("Parsing Error", e);
        return [];
    }
  };

  const generateAutomaticKPIs = (rows: any[], headers: string[]) => {
    if (rows.length === 0) return [];
    
    const kpis: any[] = [];
    
    // Total rows
    kpis.push({
      label: "Total Records",
      value: rows.length.toLocaleString(),
      change: "records"
    });
    
    // Try to find numeric columns for additional KPIs
    headers.forEach(header => {
      // Check if this column contains mostly numeric values
      const numericValues = rows
        .map(row => row[header])
        .map(val => String(val).trim())
        .filter(val => val !== '' && !isNaN(parseFloat(val)) && isFinite(parseFloat(val)))
        .map(val => parseFloat(val));
      
      // Only process if we have enough numeric values (at least 50% of rows)
      if (numericValues.length > 0 && numericValues.length >= rows.length * 0.5) {
        const sum = numericValues.reduce((acc, val) => acc + val, 0);
        const avg = sum / numericValues.length;
        
        // Format numbers appropriately
        const formatNumber = (num: number): string => {
          if (Number.isInteger(num)) {
            return num.toLocaleString();
          } else {
            return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
        };
        
        kpis.push({
          label: `${header} (Avg)` ,
          value: formatNumber(avg),
          change: "average"
        });
        
        kpis.push({
          label: `${header} (Sum)` ,
          value: formatNumber(sum),
          change: "total"
        });
      }
    });
    
    return kpis.slice(0, 4); // Limit to 4 KPIs to fit the grid
  };

  const generateFilterOptions = (rows: any[], cols: string[]) => {
      const filters: {[key: string]: Set<string>} = {};
      
      cols.forEach(col => {
          // Heuristic: Only columns with text values and cardinality < 50 are likely good filters
          // Or if user specifically mentioned names/locations, usually those are strings.
          const uniqueValues = new Set<string>();
          let isStringColumn = true;

          for (const row of rows) {
             const val = row[col];
             if (typeof val !== 'string' && typeof val !== 'number') continue;
             uniqueValues.add(String(val));
             if (uniqueValues.size > 100) break; // Limit cardinality
          }

          if (uniqueValues.size > 0 && uniqueValues.size < 100) {
             filters[col] = uniqueValues;
          }
      });

      const finalOptions: {[key: string]: string[]} = {};
      Object.keys(filters).forEach(k => {
          finalOptions[k] = Array.from(filters[k]).sort();
      });
      setAvailableFilters(finalOptions);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    setFileName(fileName);
    setLoading(true);
    setActiveFilters({}); // Reset filters on new upload

    try {
      // Handle different file types
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Handle Excel files
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convert to CSV format
        let csvContent = '';
        if (jsonData.length > 0) {
          // Add headers
          if (Array.isArray(jsonData[0])) {
            csvContent += jsonData[0].join(',') + '\n';
          } else {
            // If first row is not an array, use generic headers
            const firstRow = jsonData[0] as any;
            if (firstRow && typeof firstRow === 'object') {
              csvContent += Object.keys(firstRow).join(',') + '\n';
            }
          }
          
          // Add data rows
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (Array.isArray(row)) {
              csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
            } else {
              // Handle object rows
              const objRow = row as any;
              if (objRow && typeof objRow === 'object') {
                csvContent += Object.values(objRow).map(cell => `"${cell}"`).join(',') + '\n';
              }
            }
          }
        }
        
        onDataLoaded(csvContent, fileName);
        const rows = parseData(csvContent);
        try {
          const report = await analyzeSalesData(csvContent);
          // Ensure KPIs are always displayed
          if (!report.kpis || report.kpis.length === 0) {
            const automaticKPIs = generateAutomaticKPIs(rows, headers.length > 0 ? headers : (rows.length > 0 ? Object.keys(rows[0] || {}) : []));
            report.kpis = automaticKPIs;
          }
          setData(report);
        } catch (err) {
          console.error("AI analysis failed:", err);
          // Fallback to automatic KPIs
          const automaticKPIs = generateAutomaticKPIs(rows, headers.length > 0 ? headers : (rows.length > 0 ? Object.keys(rows[0] || {}) : []));
          setData({
            kpis: automaticKPIs,
            dailySummary: "Unable to analyze data with AI. Showing automatic KPIs only.",
            weeklySummary: "Unable to analyze data with AI. Showing automatic KPIs only.",
            monthlySummary: "Unable to analyze data with AI. Showing automatic KPIs only.",
            strategicRecommendations: [],
            forecast: "No forecast available",
            revenueTrend: [],
            productDistribution: [],
            personnelAnalysis: []
          });
        }
      } else if (fileName.endsWith('.pdf')) {
        // Handle PDF files
        const data = await file.arrayBuffer();
        
        // Dynamically import pdfjs to reduce bundle size
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        const pdf = await pdfjs.getDocument({ data }).promise;
        let textContent = '';
        
        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map((item: any) => item.str).join(' ') + '\n';
        }
        
        // Convert PDF text to a simple text format for analysis
        const formattedText = `PDF Document Content:\n${textContent}`;
        
        onDataLoaded(formattedText, fileName);
        parseData(formattedText);
        try {
          const report = await analyzeSalesData(formattedText);
          // For PDFs, we'll use automatic KPIs since the content is text
          if (!report.kpis || report.kpis.length === 0) {
            const automaticKPIs = generateAutomaticKPIs([{content: textContent}], ['content']);
            report.kpis = automaticKPIs;
          }
          setData(report);
        } catch (err) {
          console.error("AI analysis failed:", err);
          // Fallback to automatic KPIs
          const automaticKPIs = generateAutomaticKPIs([{content: textContent}], ['content']);
          setData({
            kpis: automaticKPIs,
            dailySummary: "Unable to analyze PDF content with AI. Showing basic information.",
            weeklySummary: "Unable to analyze PDF content with AI. Showing basic information.",
            monthlySummary: "Unable to analyze PDF content with AI. Showing basic information.",
            strategicRecommendations: [],
            forecast: "No forecast available",
            revenueTrend: [],
            productDistribution: [],
            personnelAnalysis: []
          });
        }
      } else {
        // Handle CSV, JSON, TXT files
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target?.result as string;
          onDataLoaded(text, fileName);
          const rows = parseData(text);
          try {
            const report = await analyzeSalesData(text);
            // Ensure KPIs are always displayed
            if (!report.kpis || report.kpis.length === 0) {
              const automaticKPIs = generateAutomaticKPIs(rows, headers.length > 0 ? headers : (rows.length > 0 ? Object.keys(rows[0] || {}) : []));
              report.kpis = automaticKPIs;
            }
            setData(report);
          } catch (err) {
            console.error("AI analysis failed:", err);
            // Fallback to automatic KPIs
            const automaticKPIs = generateAutomaticKPIs(rows, headers.length > 0 ? headers : (rows.length > 0 ? Object.keys(rows[0] || {}) : []));
            setData({
              kpis: automaticKPIs,
              dailySummary: "Unable to analyze data with AI. Showing automatic KPIs only.",
              weeklySummary: "Unable to analyze data with AI. Showing automatic KPIs only.",
              monthlySummary: "Unable to analyze data with AI. Showing automatic KPIs only.",
              strategicRecommendations: [],
              forecast: "No forecast available",
              revenueTrend: [],
              productDistribution: [],
              personnelAnalysis: []
            });
          } finally {
            setLoading(false);
          }
        };
        reader.readAsText(file);
        return; // Return early to avoid double execution
      }
    } catch (err) {
      console.error("File processing error:", err);
      alert("Error processing file. Please ensure it is a valid file format.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (col: string, val: string) => {
      const newFilters = { ...activeFilters };
      if (val === "ALL") {
          delete newFilters[col];
      } else {
          newFilters[col] = val;
      }
      setActiveFilters(newFilters);
      applyAnalysisOnFilteredData(newFilters);
  };

  const applyAnalysisOnFilteredData = async (currentFilters: {[key: string]: string}) => {
      setLoading(true);
      try {
          // Filter rows
          const filtered = parsedRows.filter(row => {
              return Object.entries(currentFilters).every(([key, filterVal]) => {
                  return String(row[key]) === filterVal;
              });
          });

          // Convert back to CSV string for AI
          if (filtered.length === 0) {
              alert("No data matches these filters.");
              setLoading(false);
              return;
          }

          let dataString = "";
          // If headers exist, map nicely
          if (headers.length > 0) {
              dataString += headers.join(",") + "\n";
              filtered.forEach(row => {
                  dataString += headers.map(h => `"${row[h] || ''}"`).join(",") + "\n";
              });
          } else {
             dataString = JSON.stringify(filtered);
          }

          const report = await analyzeSalesData(dataString);
          setData(report);
          // Also update the table data to show filtered rows
          setFilteredTableRows(filtered);

      } catch (e) {
          console.error("Filter analysis failed", e);
      } finally {
          setLoading(false);
      }
  };

  const clearFilters = () => {
      setActiveFilters({});
      // Reset table to show all data
      setFilteredTableRows(parsedRows);
      // Re-run analysis on full parsedRows
      applyAnalysisOnFilteredData({});
  };

  const analyzeSingleRow = async (row: any) => {
      setSelectedRow(row);
      setLoading(true);
      
      try {
          // Convert single row to CSV format for analysis
          let dataString = "";
          if (headers.length > 0) {
              dataString += headers.join(",") + "\n";
              dataString += headers.map(h => `"${row[h] || ''}"`).join(",") + "\n";
          } else {
              dataString = JSON.stringify([row]);
          }
          
          const report = await analyzeSalesData(dataString);
          
          // Show a modal or alert with the analysis
          setRowAnalysis(report);
          setShowRowModal(true);
      } catch (e) {
          console.error("Single row analysis failed", e);
          alert("Failed to analyze this row. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="text-indigo-600" />
                Data Intelligence
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Upload raw data (CSV/JSON) to generate boardroom-ready insights.</p>
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
                <input type="file" className="hidden" accept=".csv,.json,.txt,.xlsx,.xls,.pdf" onChange={handleFileUpload} />
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
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">AI is processing your specific view.</p>
            </div>
        </div>
      )}

      {/* Filters Bar */}
      {!loading && fileName && Object.keys(availableFilters).length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center overflow-x-auto">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex-shrink-0">
                  <Filter size={16} /> Filters:
              </div>
              <div className="flex gap-3 flex-wrap flex-1">
                  {Object.entries(availableFilters).map(([col, options]) => (
                      <div key={col} className="relative group">
                          <select 
                              value={activeFilters[col] || "ALL"}
                              onChange={(e) => handleFilterChange(col, e.target.value)}
                              className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium py-2 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-w-[120px]"
                          >
                              <option value="ALL">{col}: All</option>
                              {options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                              ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                      </div>
                  ))}
                  {Object.keys(activeFilters).length > 0 && (
                      <button 
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-bold px-3 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg transition-colors"
                      >
                          <X size={14} /> Clear
                      </button>
                  )}
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
            
            {/* Full Data Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Full Dataset</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Click on any row to analyze that specific record.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                {headers.map((header, index) => (
                                    <th key={index} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredTableRows.map((row, rowIndex) => (
                                <tr 
                                    key={rowIndex}
                                    onClick={() => analyzeSingleRow(row)}
                                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    {headers.map((header, colIndex) => (
                                        <td key={colIndex} className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {String(row[header] || '')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Custom Prompt Section - Removed as per user request */}
        </div>
      )}
      
      {/* Row Analysis Modal */}
      <RowAnalysisModal 
        show={showRowModal} 
        onClose={() => setShowRowModal(false)} 
        analysis={rowAnalysis} 
      />
    </div>
  );
};

export default AnalyticsDashboard;

const BarChart2Icon = ({className}:{className?:string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
);

// Row Analysis Modal Component
const RowAnalysisModal: React.FC<{ 
  show: boolean; 
  onClose: () => void; 
  analysis: AnalyticsReport | null 
}> = ({ show, onClose, analysis }) => {
  if (!show || !analysis) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Row Analysis</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* KPIs for this row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {analysis.kpis?.map((kpi, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{kpi.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{kpi.value}</p>
                {kpi.change && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpi.change}</p>
                )}
              </div>
            ))}
          </div>
          
          {/* Summary */}
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Summary</h4>
            <p className="text-slate-700 dark:text-slate-300">
              {analysis.monthlySummary || analysis.dailySummary || analysis.weeklySummary || 'No summary available'}
            </p>
          </div>
          
          {/* Recommendations */}
          {analysis.strategicRecommendations && analysis.strategicRecommendations.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Recommendations</h4>
              <ul className="space-y-2">
                {analysis.strategicRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">•</span>
                    <span className="text-slate-700 dark:text-slate-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Forecast */}
          {analysis.forecast && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Forecast</h4>
              <p className="text-slate-700 dark:text-slate-300">{analysis.forecast}</p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
