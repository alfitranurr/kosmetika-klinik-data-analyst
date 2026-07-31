import React, { useState, useMemo } from 'react';
import data from './data/clinicData.json';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Receipt, CreditCard, Filter, Award, 
  CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet, ArrowRight, UserCheck, Stethoscope, PackageCheck, Activity, RefreshCw,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';

const SEGMENT_COLORS = {
  'Repeat Customer': '#6366f1',       // Indigo
  'Reactivated Customer': '#a855f7',  // Purple
  'New Customer': '#10b981',          // Emerald
  'Non Member': '#f59e0b'             // Amber
};

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

export default function App() {
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedSegment, setSelectedSegment] = useState('ALL');
  const [activeTab, setActiveTab] = useState('overview');

  // Sorting state for Detail Performa Table
  const [sortPerf, setSortPerf] = useState({ key: 'month', direction: 'asc' });

  // Sorting state for Doctor Performance Table
  const [sortDoc, setSortDoc] = useState({ key: 'rank', direction: 'asc' });

  // Filtered performance rows
  const filteredPerf = useMemo(() => {
    return data.performance.filter(item => {
      if (selectedMonth !== 'ALL' && item.month !== selectedMonth) return false;
      if (selectedBranch !== 'ALL' && item.branch_name !== selectedBranch) return false;
      return true;
    });
  }, [selectedMonth, selectedBranch]);

  // Interactive Sorted Performance Data
  const sortedPerfData = useMemo(() => {
    if (!sortPerf.key) return filteredPerf;
    return [...filteredPerf].sort((a, b) => {
      let aVal = a[sortPerf.key];
      let bVal = b[sortPerf.key];
      if (typeof aVal === 'string') {
        return sortPerf.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortPerf.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredPerf, sortPerf]);

  const handleSortPerf = (key) => {
    setSortPerf(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: typeof filteredPerf[0]?.[key] === 'number' ? 'desc' : 'asc' };
    });
  };

  // Doctors with True Pre-Calculated Revenue Rank
  const doctorsWithRank = useMemo(() => {
    const sortedByRev = [...data.doctors].sort((a, b) => b.revenue - a.revenue);
    const rankMap = new Map();
    sortedByRev.forEach((doc, idx) => {
      rankMap.set(doc.alias, idx + 1);
    });
    return data.doctors.map(doc => ({
      ...doc,
      rank: rankMap.get(doc.alias)
    }));
  }, []);

  // Interactive Sorted Doctor Performance Data
  const sortedDocData = useMemo(() => {
    if (!sortDoc.key) return doctorsWithRank;
    return [...doctorsWithRank].sort((a, b) => {
      let aVal = a[sortDoc.key];
      let bVal = b[sortDoc.key];
      if (typeof aVal === 'string') {
        return sortDoc.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortDoc.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [doctorsWithRank, sortDoc]);

  const handleSortDoc = (key) => {
    setSortDoc(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: (key === 'rank' || typeof doctorsWithRank[0]?.[key] === 'string') ? 'asc' : 'desc' };
    });
  };

  // Aggregate KPI summary
  const kpis = useMemo(() => {
    const totalRev = filteredPerf.reduce((sum, i) => sum + i.revenue, 0);
    const totalInvoices = filteredPerf.reduce((sum, i) => sum + i.invoices, 0);
    const totalPatients = (selectedMonth === 'ALL' && selectedBranch === 'ALL') ? 21993 : filteredPerf.reduce((sum, i) => sum + i.patients, 0);
    const atv = totalInvoices > 0 ? totalRev / totalInvoices : 0;
    return { totalRev, totalInvoices, totalPatients, atv };
  }, [filteredPerf, selectedMonth, selectedBranch]);

  // Format currency IDR
  const formatIDR = (val) => {
    if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(2)} M`;
    if (val >= 1e6) return `Rp ${(val / 1e6).toFixed(1)} Jt`;
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  const formatNumber = (val) => Math.round(val).toLocaleString('id-ID');

  // Performance chart data grouped by month
  const monthlyTrendData = useMemo(() => {
    const months = ['2022-10', '2022-11', '2022-12'];
    return months.map(m => {
      const items = data.performance.filter(i => i.month === m && (selectedBranch === 'ALL' || i.branch_name === selectedBranch));
      const rev = items.reduce((s, i) => s + i.revenue, 0);
      const inv = items.reduce((s, i) => s + i.invoices, 0);
      const pat = items.reduce((s, i) => s + i.patients, 0);
      return {
        monthLabel: m === '2022-10' ? 'Oktober' : m === '2022-11' ? 'November' : 'Desember',
        Revenue: rev,
        Invoices: inv,
        Patients: pat,
        ATV: inv > 0 ? Math.round(rev / inv) : 0
      };
    });
  }, [selectedBranch]);

  // Branch breakdown comparison data
  const branchComparisonData = useMemo(() => {
    const branches = ['SURABAYA', 'BANDUNG', 'MALANG', 'SIDOARJO'];
    return branches.map(b => {
      const items = data.performance.filter(i => i.branch_name === b && (selectedMonth === 'ALL' || i.month === selectedMonth));
      const rev = items.reduce((s, i) => s + i.revenue, 0);
      const inv = items.reduce((s, i) => s + i.invoices, 0);
      return {
        branch: b,
        Revenue: rev,
        Invoices: inv,
        ATV: inv > 0 ? Math.round(rev / inv) : 0
      };
    });
  }, [selectedMonth]);

  // Customer Segment Summary with Percentages & Color Mapping
  const segmentData = useMemo(() => {
    const segs = ['Repeat Customer', 'Reactivated Customer', 'New Customer', 'Non Member'];
    const rawItems = segs.map(s => {
      const items = data.segments.filter(i => i.segment === s && 
        (selectedMonth === 'ALL' || i.month === selectedMonth) && 
        (selectedBranch === 'ALL' || i.branch_name === selectedBranch));
      const rev = items.reduce((sum, i) => sum + i.revenue, 0);
      const inv = items.reduce((sum, i) => sum + i.invoices, 0);
      return {
        name: s,
        Revenue: rev,
        Invoices: inv,
        ATV: inv > 0 ? Math.round(rev / inv) : 0,
        fill: SEGMENT_COLORS[s] || '#6366f1'
      };
    });

    const totalSegRev = rawItems.reduce((s, i) => s + i.Revenue, 0);
    return rawItems.map(item => ({
      ...item,
      percentage: totalSegRev > 0 ? ((item.Revenue / totalSegRev) * 100).toFixed(1) : 0
    }));
  }, [selectedMonth, selectedBranch]);

  // Custom Donut Label
  const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="800">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const renderSortIcon = (currentSort, colKey) => {
    if (currentSort.key !== colKey) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition" />;
    return currentSort.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400 font-bold" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 selection:bg-indigo-500 selection:text-white">
      {/* Header & Candidate Info Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
                Technical Test Data Analyst
              </span>
              <span className="text-xs font-medium text-slate-400">PT Kosmetika Klinik Indonesia</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5 bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              Executive Business & Patient Migration Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 mt-1">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Kandidat: <strong className="text-slate-100 font-semibold">Al Fitra Nur Ramadhani</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-emerald-400 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Vercel Deployment Ready
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Global Filter Bar */}
        <section className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm">
            <Filter className="w-5 h-5 text-indigo-400" />
            <span>Filter Dashboard Interaktif:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-400">Bulan:</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition cursor-pointer"
              >
                <option value="ALL">Semua Q4 (Oktober - Desember)</option>
                <option value="2022-10">Oktober 2022</option>
                <option value="2022-11">November 2022</option>
                <option value="2022-12">Desember 2022</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-400">Cabang:</label>
              <select 
                value={selectedBranch} 
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition cursor-pointer"
              >
                <option value="ALL">Semua Cabang (1-4)</option>
                <option value="MALANG">Cabang Malang</option>
                <option value="SURABAYA">Cabang Surabaya</option>
                <option value="BANDUNG">Cabang Bandung</option>
                <option value="SIDOARJO">Cabang Sidoarjo</option>
              </select>
            </div>

            {/* Customer Segment Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-400">Segmentasi:</label>
              <select 
                value={selectedSegment} 
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition cursor-pointer"
              >
                <option value="ALL">Semua Kategori Customer</option>
                <option value="Repeat Customer">Repeat Customer</option>
                <option value="Reactivated Customer">Reactivated Customer</option>
                <option value="New Customer">New Customer</option>
                <option value="Non Member">Non Member</option>
              </select>
            </div>

            {(selectedMonth !== 'ALL' || selectedBranch !== 'ALL' || selectedSegment !== 'ALL') && (
              <button 
                onClick={() => { setSelectedMonth('ALL'); setSelectedBranch('ALL'); setSelectedSegment('ALL'); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 flex items-center gap-1 ml-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            )}
          </div>
        </section>

        {/* Executive KPI Summary Cards - Perfectly Symmetrical & Horizontal Aligned */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Revenue */}
          <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-44 group hover:border-indigo-500/60 transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-indigo-300 tracking-wider uppercase truncate">TOTAL REVENUE (Q4)</p>
              <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30 shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{formatIDR(kpis.totalRev)}</h3>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold truncate">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">+10.18% Recovery MoM (Des)</span>
            </div>
          </div>

          {/* Card 2: Invoices */}
          <div className="bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-44 group hover:border-purple-500/60 transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-purple-300 tracking-wider uppercase truncate">TOTAL INVOICE (Q4)</p>
              <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{formatNumber(kpis.totalInvoices)}</h3>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
              <Activity className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              <span className="truncate">Volume Transaksi Terpantau</span>
            </div>
          </div>

          {/* Card 3: Patients */}
          <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-44 group hover:border-emerald-500/60 transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald-300 tracking-wider uppercase truncate">PASIEN UNIK (Q4)</p>
              <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30 shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{formatNumber(kpis.totalPatients)}</h3>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold truncate">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Dominasi Repeat (66.4%)</span>
            </div>
          </div>

          {/* Card 4: ATV */}
          <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-44 group hover:border-amber-500/60 transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-300 tracking-wider uppercase truncate">RATA-RATA ATV (Q4)</p>
              <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{formatIDR(kpis.atv)}</h3>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-amber-400 font-semibold truncate">
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Surabaya Top (Rp 524rb)</span>
            </div>
          </div>

        </section>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2.5 border-b border-slate-800 overflow-x-auto pb-3">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Performa Cabang & Tren</span>
          </button>

          <button 
            onClick={() => setActiveTab('segments')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'segments' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Segmentasi Customer</span>
          </button>

          <button 
            onClick={() => setActiveTab('treatments')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'treatments' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Top Treatment & Produk</span>
          </button>

          <button 
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'doctors' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Performa Dokter & Tipe Tx</span>
          </button>

          <button 
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'insights' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>5 Insight & 3 Action Plan</span>
          </button>

          <button 
            onClick={() => setActiveTab('migration')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'migration' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Rekonsiliasi Migrasi Pasien</span>
          </button>
        </div>

        {/* Tab 1: Overview & Branch Performance */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Trend */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Tren Total Revenue Bulanan (Q4 2022)
                </h3>
                <p className="text-xs text-slate-400 mb-6">Pertumbuhan MoM: Oktober (Rp 8.09M) → November (Rp 7.72M) → Desember (Rp 8.51M)</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="monthLabel" 
                        stroke="#ffffff" 
                        strokeWidth={2}
                        tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        stroke="#ffffff" 
                        strokeWidth={2}
                        tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                        tickFormatter={(val) => val === 0 ? 'Rp 0' : `Rp ${(val / 1e9).toFixed(1)} M`} 
                        width={70} 
                      />
                      <Tooltip 
                        formatter={(val) => [`Rp ${val.toLocaleString('id-ID')}`, 'Revenue']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }}
                        itemStyle={{ color: '#38bdf8' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="Revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Branch Contribution Comparison - Clear Explicit Title */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  Peringkat & Kontribusi Total Revenue Per Cabang (Q4 2022)
                </h3>
                <p className="text-xs text-slate-400 mb-6">Peringkat Revenue: Surabaya memimpin Rp 8,94 M (36,7%), Bandung Rp 6,60 M, Malang Rp 5,18 M, & Sidoarjo Rp 3,61 M (14,8%)</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchComparisonData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        type="number" 
                        stroke="#ffffff" 
                        strokeWidth={2}
                        tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                        tickFormatter={(val) => val === 0 ? 'Rp 0' : `Rp ${(val / 1e9).toFixed(1)} M`} 
                      />
                      <YAxis 
                        dataKey="branch" 
                        type="category" 
                        stroke="#ffffff" 
                        strokeWidth={2}
                        width={90} 
                        tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }} 
                      />
                      <Tooltip 
                        formatter={(val) => [`Rp ${val.toLocaleString('id-ID')}`, 'Total Revenue']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }}
                        itemStyle={{ color: '#34d399' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="Revenue" fill="#10b981" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Performance Detail Table with Interactive Column Sorting */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Tabel Detail Performa Per Cabang & Bulan</h3>
                <span className="text-xs text-indigo-400 font-medium">Klik judul kolom untuk sortir (Sort ▲/▼)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th 
                        onClick={() => handleSortPerf('month')} 
                        className="p-3.5 cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Bulan</span>
                          {renderSortIcon(sortPerf, 'month')}
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSortPerf('branch_name')} 
                        className="p-3.5 cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Cabang</span>
                          {renderSortIcon(sortPerf, 'branch_name')}
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSortPerf('revenue')} 
                        className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Total Revenue</span>
                          {renderSortIcon(sortPerf, 'revenue')}
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSortPerf('invoices')} 
                        className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Invoice</span>
                          {renderSortIcon(sortPerf, 'invoices')}
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSortPerf('patients')} 
                        className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Pasien Unik</span>
                          {renderSortIcon(sortPerf, 'patients')}
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSortPerf('atv')} 
                        className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>ATV</span>
                          {renderSortIcon(sortPerf, 'atv')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {sortedPerfData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition">
                        <td className="p-3.5 font-medium text-white">{item.month}</td>
                        <td className="p-3.5 font-bold text-indigo-400">{item.branch_name}</td>
                        <td className="p-3.5 text-right font-extrabold text-emerald-400">{formatIDR(item.revenue)}</td>
                        <td className="p-3.5 text-right font-medium">{formatNumber(item.invoices)}</td>
                        <td className="p-3.5 text-right font-medium">{formatNumber(item.patients)}</td>
                        <td className="p-3.5 text-right font-bold text-emerald-400">{formatIDR(item.atv)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Customer Segmentation */}
        {activeTab === 'segments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Donut Chart with Percentages & Nominal Values */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-400" />
                    Kontribusi Revenue Per Kategori Customer
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Repeat Customer menyumbang 66.35% (Rp 16,15M) dari total revenue Q4</p>
                  
                  <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={segmentData} 
                          dataKey="Revenue" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={65} 
                          outerRadius={95} 
                          paddingAngle={3}
                          labelLine={false}
                          label={renderCustomizedPieLabel}
                        >
                          {segmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="#0f172a" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(val, name, item) => [`${formatIDR(val)} (${item.payload.percentage}%)`, name]} 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }} 
                          itemStyle={{ color: '#38bdf8' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Donut Center Summary Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <p className="text-xs text-slate-400 font-semibold">Total Revenue</p>
                      <p className="text-sm font-extrabold text-white">{formatIDR(kpis.totalRev)}</p>
                    </div>
                  </div>
                </div>

                {/* Donut Custom Legend Grid */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80">
                  {segmentData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></span>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{formatNumber(item.Invoices)} Invoice</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-white">{item.percentage}%</p>
                        <p className="text-[10px] font-extrabold text-emerald-400">{formatIDR(item.Revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart ATV per Segmen Customer */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    Profil ATV (Rata-Rata Belanja) Per Segmen
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">New Customer memimpin ATV (Rp 750rb), Non Member terendah (Rp 177rb)</p>
                  
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={segmentData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#ffffff" 
                          strokeWidth={2}
                          tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                          interval={0}
                        />
                        <YAxis 
                          stroke="#ffffff" 
                          strokeWidth={2}
                          tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                          tickFormatter={(val) => val === 0 ? 'Rp 0' : `Rp ${(val / 1e3).toFixed(0)} rb`} 
                          width={68} 
                        />
                        <Tooltip 
                          formatter={(val) => [`Rp ${Math.round(val).toLocaleString('id-ID')}`, 'ATV (Rata-Rata Transaksi)']} 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }}
                          itemStyle={{ color: '#38bdf8' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="ATV" radius={[8, 8, 0, 0]}>
                          {segmentData.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ATV Summary Cards - Green text for currency */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80">
                  {segmentData.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">{item.name}</span>
                      <span className="text-xs font-extrabold text-emerald-400">{formatIDR(item.ATV)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Top Treatments & Products */}
        {activeTab === 'treatments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-400" />
                Top 10 Treatment Berdasarkan Revenue
              </h3>
              <div className="space-y-3">
                {data.top_treatments.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-indigo-500/40 transition">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/30">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-slate-100">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.count} transaksi | {t.qty} unit</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-400 text-sm">{formatIDR(t.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                Top 10 Produk Berdasarkan Revenue
              </h3>
              <div className="space-y-3">
                {data.top_products.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-emerald-500/40 transition">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-500/30">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-slate-100">{p.name}</p>
                        <p className="text-xs text-slate-400">{formatNumber(p.qty)} unit terjual</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-400 text-sm">{formatIDR(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Doctor Performance */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-indigo-400" />
                  Peringkat Performa Dokter (Top Revenue & Transaksi)
                </h3>
                <span className="text-xs text-indigo-400 font-medium">Klik judul kolom untuk sortir (Sort ▲/▼)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th 
                        onClick={() => handleSortDoc('rank')} 
                        className="p-3.5 cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Rank</span>
                          {renderSortIcon(sortDoc, 'rank')}
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSortDoc('alias')} 
                        className="p-3.5 cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Alias Dokter</span>
                          {renderSortIcon(sortDoc, 'alias')}
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSortDoc('branch')} 
                        className="p-3.5 cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Cabang Utama</span>
                          {renderSortIcon(sortDoc, 'branch')}
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSortDoc('transactions')} 
                        className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Total Transaksi</span>
                          {renderSortIcon(sortDoc, 'transactions')}
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSortDoc('revenue')} 
                        className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Total Revenue</span>
                          {renderSortIcon(sortDoc, 'revenue')}
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSortDoc('atv')} 
                        className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>ATV Per Dokter</span>
                          {renderSortIcon(sortDoc, 'atv')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {sortedDocData.map((doc, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition">
                        <td className="p-3.5 font-bold text-indigo-400">#{doc.rank}</td>
                        <td className="p-3.5 font-bold text-white">{doc.alias}</td>
                        <td className="p-3.5 text-slate-400">{doc.branch}</td>
                        <td className="p-3.5 text-right font-medium">{formatNumber(doc.transactions)}</td>
                        <td className="p-3.5 text-right font-extrabold text-emerald-400">{formatIDR(doc.revenue)}</td>
                        <td className="p-3.5 text-right text-emerald-400 font-bold">{formatIDR(doc.atv)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: 5 Numerical Insights & 3 Priority Action Plans */}
        {activeTab === 'insights' && (
          <div className="space-y-8">
            {/* 5 Numerical Insights */}
            <div>
              <h3 className="text-xl font-extrabold text-white mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                5 Insight Bisnis Berbasis Angka Konkret
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-indigo-400 font-bold text-sm">
                    <span>Insight 1: Konsentrasi Revenue</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">Cabang</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <strong>Cabang Surabaya & Bandung</strong> menyumbangkan <strong>63,88% (Rp 15,54 M)</strong> dari total revenue Q4. Sementara Sidoarjo terendah hanya <strong>14,83% (Rp 3,60 M)</strong>.
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-emerald-400 font-bold text-sm">
                    <span>Insight 2: Dominasi Repeat Customer</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">Segmentasi</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <strong>Repeat Customer</strong> memberikan kontribusi terbesar sebesar <strong>66,35% (Rp 16,15 M)</strong> dengan 31.044 invoice, menunjukkan loyalitas pasien lama yang sangat solid.
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-purple-400 font-bold text-sm">
                    <span>Insight 3: High ATV New Customer</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">Komersial</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Pasien Baru (<strong>New Customer</strong>) memiliki ATV tertinggi yaitu <strong>Rp 749.905</strong> per transaksi, 42% lebih tinggi dibanding rata-rata ATV bisnis (Rp 478rb).
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-amber-400 font-bold text-sm">
                    <span>Insight 4: Power of Mixed Package</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">Produk</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Transaksi Campuran (<strong>Mixed Treatment + Obat</strong>) menghasilkan ATV fantastis sebesar <strong>Rp 1.432.772</strong> (5x lebih tinggi dibanding Product Only Rp 276rb).
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-pink-400 font-bold text-sm">
                    <span>Insight 5: Low ATV Non Member</span>
                    <span className="text-xs bg-pink-500/20 text-pink-300 px-2.5 py-0.5 rounded-full border border-pink-500/30">Konversi</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Terdapat <strong>10.480 invoice Non Member (20.6%)</strong> dengan ATV sangat rendah (<strong>Rp 177.481</strong>), berpotensi besar ditingkatkan via registrasi member.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Priority Action Plans */}
            <div>
              <h3 className="text-xl font-extrabold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                3 Priority Action Plan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs shrink-0">1</span>
                      <span>Revitalisasi Cabang Sidoarjo</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                      <p><strong>Masalah:</strong> Revenue Sidoarjo terendah (14.8% kontribusi) & ATV paling rendah (Rp 426rb).</p>
                      <p><strong>Tindakan:</strong> Bundling promo khusus Treatment Hero (Skin Booster & Pico Clear) + Pelatihan Cross-selling staf.</p>
                      <p><strong>Target:</strong> Naikkan ATV Sidoarjo ke Rp 480.000 (+12.5%).</p>
                      <p><strong>PIC:</strong> Branch Manager Sidoarjo & Head of Medical.</p>
                      <p><strong>KPI:</strong> Growth Revenue Sidoarjo +15% MoM.</p>
                      <p><strong>Timeline:</strong> Q1 2023 (1-2 Bulan).</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs shrink-0">2</span>
                      <span>Program Konversi Non-Member</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                      <p><strong>Masalah:</strong> 10.480 invoice Non Member (20.6%) belum memiliki profil pasien dan ATV rendah (Rp 177rb).</p>
                      <p><strong>Tindakan:</strong> Program pendaftaran member instan di kasir dengan voucher diskon 10% untuk treatment berikutnya.</p>
                      <p><strong>Target:</strong> Konversi 40% Non Member menjadi Member Terdaftar (4.000+ pasien baru).</p>
                      <p><strong>PIC:</strong> CRM Lead & Front Office Supervisor.</p>
                      <p><strong>KPI:</strong> Pendaftaran Member Baru +4.000 Pasien.</p>
                      <p><strong>Timeline:</strong> 1 Bulan (Januari 2023).</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                      <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs shrink-0">3</span>
                      <span>Upselling Mixed Package SOP</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                      <p><strong>Masalah:</strong> 79.2% transaksi saat ini masih Product Only (ATV Rp 276rb), padahal Mixed Package bernilai ATV Rp 1.43M.</p>
                      <p><strong>Tindakan:</strong> SOP konsultasi dokter wajib merekomendasikan Homecare Skincare pasca-treatment.</p>
                      <p><strong>Target:</strong> Tingkatkan porsi transaksi Mixed dari 14.0% ke 25.0%.</p>
                      <p><strong>PIC:</strong> Commercial Lead & Lead Doctor.</p>
                      <p><strong>KPI:</strong> Porsi Transaksi Mixed mencapai 25% dari total invoice.</p>
                      <p><strong>Timeline:</strong> 2 Bulan (Jan-Feb 2023).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Migration Reconciliation */}
        {activeTab === 'migration' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Status Rekonsiliasi Migrasi Pasien: 100% SUCCESS</h3>
                  <p className="text-xs text-emerald-300 font-medium">Seluruh 21.993 data pasien legacy berhasil dimigrasikan dengan keterlacakan (traceability) 1-to-1</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Total Source Patients</p>
                  <p className="text-xl font-extrabold text-white mt-1">21.993</p>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-emerald-400 font-bold">Total Migrated Patients</p>
                  <p className="text-xl font-extrabold text-emerald-400 mt-1">21.993</p>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Skipped Records</p>
                  <p className="text-xl font-extrabold text-slate-300 mt-1">0</p>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-amber-400 font-bold">Conflicts Logged</p>
                  <p className="text-xl font-extrabold text-amber-400 mt-1">640</p>
                </div>
              </div>
            </div>

            {/* Conflict Breakdown Table */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-4">Rincian Konflik Data & Penanganannya (Log Audit)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Tipe Konflik</th>
                      <th className="p-3.5">Severity</th>
                      <th className="p-3.5 text-right">Jumlah</th>
                      <th className="p-3.5">Penanganan & Aturan Business Rules</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    <tr>
                      <td className="p-3.5 font-bold text-white">DOB_PLACEHOLDER_1970</td>
                      <td className="p-3.5"><span className="px-2.5 py-1 text-xs font-bold bg-slate-800 text-slate-300 rounded-lg border border-slate-700">LOW</span></td>
                      <td className="p-3.5 text-right font-extrabold text-amber-400">501</td>
                      <td className="p-3.5 text-slate-400">Tanggal lahir 1970-01-01 dikonversi menjadi NULL untuk mencegah bias umur.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-white">EMPTY_RM_CODE</td>
                      <td className="p-3.5"><span className="px-2.5 py-1 text-xs font-bold bg-amber-950 text-amber-300 rounded-lg border border-amber-800">MEDIUM</span></td>
                      <td className="p-3.5 text-right font-extrabold text-amber-400">105</td>
                      <td className="p-3.5 text-slate-400">RM kosong dibuatkan kode fallback konsisten berbasis ID legacy (<code className="text-indigo-300">RM-LEGACY-[ID]</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-white">DUPLICATE_RM_CODE</td>
                      <td className="p-3.5"><span className="px-2.5 py-1 text-xs font-bold bg-rose-950 text-rose-300 rounded-lg border border-rose-800">HIGH</span></td>
                      <td className="p-3.5 text-right font-extrabold text-rose-400">34</td>
                      <td className="p-3.5 text-slate-400">RM duplikat tidak ditimpa; dibuatkan kode unik dengan suffix (<code className="text-indigo-300">[RM]-DUP-[ID]</code>).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
