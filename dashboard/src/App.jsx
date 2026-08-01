import React, { useState, useMemo, useRef, useEffect } from 'react';
import data from './data/clinicData.json';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Receipt, CreditCard, Filter, Award, 
  CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet, ArrowRight, UserCheck, Stethoscope, PackageCheck, Activity, RefreshCw,
  ArrowUpDown, ArrowUp, ArrowDown, Check, ChevronDown, Calendar, MapPin
} from 'lucide-react';

const SEGMENT_COLORS = {
  'Repeat Customer': '#6366f1',       // Indigo
  'Reactivated Customer': '#a855f7',  // Purple
  'New Customer': '#10b981',          // Emerald
  'Non Member': '#f59e0b'             // Amber
};

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

// Multi-select matching helper
const matchesFilter = (selectedArr, itemVal) => {
  if (!selectedArr || selectedArr.length === 0 || selectedArr.includes('ALL')) {
    return true;
  }
  return selectedArr.includes(itemVal);
};

// Interactive Multi-Select Dropdown Component
function MultiSelectDropdown({ title, icon: Icon, options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAll = !selected || selected.length === 0 || selected.includes('ALL');

  const handleToggle = (val) => {
    if (val === 'ALL') {
      onChange(['ALL']);
      return;
    }
    let current = isAll ? [] : [...selected];
    if (current.includes(val)) {
      current = current.filter(x => x !== val);
    } else {
      current.push(val);
    }

    if (current.length === 0 || current.length === options.length) {
      onChange(['ALL']);
    } else {
      onChange(current);
    }
  };

  const getLabel = () => {
    if (isAll) return `Semua ${title}`;
    if (selected.length === 1) {
      const opt = options.find(o => o.value === selected[0]);
      return opt ? opt.label : selected[0];
    }
    return `${selected.length} ${title} Dipilih`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-md cursor-pointer ${
          !isAll 
            ? 'bg-indigo-950/90 border-indigo-500/80 text-white shadow-indigo-500/20' 
            : 'bg-slate-950 border-slate-700/80 text-slate-200 hover:border-slate-500'
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
        <span className="truncate max-w-[140px]">{getLabel()}</span>
        {!isAll && (
          <span className="px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[10px] font-black shrink-0">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 min-w-[200px] backdrop-blur-2xl space-y-1">
          <button
            type="button"
            onClick={() => handleToggle('ALL')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isAll 
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>Semua {title}</span>
            {isAll && <Check className="w-3.5 h-3.5 text-indigo-400 stroke-[3]" />}
          </button>
          
          <div className="h-px bg-slate-800/80 my-1" />

          {options.map(opt => {
            const checked = !isAll && selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggle(opt.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                  checked ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:bg-slate-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                    checked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 bg-slate-950'
                  }`}>
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="truncate">{opt.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [selectedMonths, setSelectedMonths] = useState(['ALL']);
  const [selectedBranches, setSelectedBranches] = useState(['ALL']);
  const [selectedSegments, setSelectedSegments] = useState(['ALL']);
  const [activeTab, setActiveTab] = useState('overview');

  // Sorting state for Detail Performa Table
  const [sortPerf, setSortPerf] = useState({ key: 'month', direction: 'asc' });

  // Sorting state for Doctor Performance Table
  const [sortDoc, setSortDoc] = useState({ key: 'rank', direction: 'asc' });

  // Sorting state for Segment Detail Table (Bagian C)
  const [sortSegmentTable, setSortSegmentTable] = useState({ key: 'revenue', direction: 'desc' });

  // Filtered performance rows (aware of Month, Branch, and Segment)
  const filteredPerf = useMemo(() => {
    if (!selectedSegments.includes('ALL')) {
      const map = new Map();
      data.segments.forEach(item => {
        if (!matchesFilter(selectedMonths, item.month)) return;
        if (!matchesFilter(selectedBranches, item.branch_name)) return;
        if (!matchesFilter(selectedSegments, item.segment)) return;
        const key = `${item.month}_${item.branch_name}`;
        const existing = map.get(key) || { 
          month: item.month, 
          branch_name: item.branch_name, 
          invoices: 0, 
          patients: 0, 
          revenue: 0 
        };
        existing.invoices += item.invoices;
        existing.patients += item.customers;
        existing.revenue += item.revenue;
        map.set(key, existing);
      });
      return Array.from(map.values()).map(i => ({
        ...i,
        atv: i.invoices > 0 ? Math.round(i.revenue / i.invoices) : 0
      }));
    }

    return data.performance.filter(item => {
      if (!matchesFilter(selectedMonths, item.month)) return false;
      if (!matchesFilter(selectedBranches, item.branch_name)) return false;
      return true;
    });
  }, [selectedMonths, selectedBranches, selectedSegments]);

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

  // Filtered & Aggregated Top 10 Treatments (Aware of Month, Branch & Segment)
  const topTreatments = useMemo(() => {
    const raw = data.treatments_granular || data.top_treatments || [];
    if (!data.treatments_granular) return data.top_treatments;

    const map = new Map();
    raw.forEach(item => {
      if (!matchesFilter(selectedMonths, item.month)) return;
      if (!matchesFilter(selectedBranches, item.branch_name)) return;
      if (!matchesFilter(selectedSegments, item.segment)) return;

      const existing = map.get(item.name) || { name: item.name, count: 0, qty: 0, revenue: 0 };
      existing.count += item.count;
      existing.qty += item.qty;
      existing.revenue += item.revenue;
      map.set(item.name, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [selectedMonths, selectedBranches, selectedSegments]);

  // Filtered & Aggregated Top 10 Products (Aware of Month, Branch & Segment)
  const topProducts = useMemo(() => {
    const raw = data.products_granular || data.top_products || [];
    if (!data.products_granular) return data.top_products;

    const map = new Map();
    raw.forEach(item => {
      if (!matchesFilter(selectedMonths, item.month)) return;
      if (!matchesFilter(selectedBranches, item.branch_name)) return;
      if (!matchesFilter(selectedSegments, item.segment)) return;

      const existing = map.get(item.name) || { name: item.name, qty: 0, revenue: 0 };
      existing.qty += item.qty;
      existing.revenue += item.revenue;
      map.set(item.name, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [selectedMonths, selectedBranches, selectedSegments]);

  // Filtered & Aggregated Doctors with True Rank (Aware of Month, Branch & Segment)
  const filteredDoctors = useMemo(() => {
    const raw = data.doctors_granular || data.doctors || [];
    if (!data.doctors_granular) {
      const sortedByRev = [...data.doctors].sort((a, b) => b.revenue - a.revenue);
      const rankMap = new Map();
      sortedByRev.forEach((doc, idx) => {
        rankMap.set(doc.alias, idx + 1);
      });
      return data.doctors.map(doc => ({
        ...doc,
        rank: rankMap.get(doc.alias)
      }));
    }

    const map = new Map();
    raw.forEach(item => {
      if (!matchesFilter(selectedMonths, item.month)) return;
      if (!matchesFilter(selectedBranches, item.branch_name)) return;
      if (!matchesFilter(selectedSegments, item.segment)) return;

      const key = item.id || item.alias;
      const existing = map.get(key) || { 
        id: item.id, 
        alias: item.alias, 
        branch: item.branch, 
        transactions: 0, 
        revenue: 0 
      };
      existing.transactions += item.transactions;
      existing.revenue += item.revenue;
      map.set(key, existing);
    });

    const list = Array.from(map.values()).map(doc => ({
      ...doc,
      atv: doc.transactions > 0 ? Math.round(doc.revenue / doc.transactions) : 0
    }));

    list.sort((a, b) => b.revenue - a.revenue);
    return list.map((doc, idx) => ({ ...doc, rank: idx + 1 }));
  }, [selectedMonths, selectedBranches, selectedSegments]);

  // Interactive Sorted Doctor Performance Data
  const sortedDocData = useMemo(() => {
    if (!sortDoc.key) return filteredDoctors;
    return [...filteredDoctors].sort((a, b) => {
      let aVal = a[sortDoc.key];
      let bVal = b[sortDoc.key];
      if (typeof aVal === 'string') {
        return sortDoc.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortDoc.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredDoctors, sortDoc]);

  const handleSortDoc = (key) => {
    setSortDoc(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: (key === 'rank' || typeof filteredDoctors[0]?.[key] === 'string') ? 'asc' : 'desc' };
    });
  };

  // Filtered & Sorted Customer Segment Detail Data (Bagian 1C)
  const sortedSegmentDetail = useMemo(() => {
    const list = data.segments.filter(item => {
      if (!matchesFilter(selectedMonths, item.month)) return false;
      if (!matchesFilter(selectedBranches, item.branch_name)) return false;
      if (!matchesFilter(selectedSegments, item.segment)) return false;
      return true;
    });

    if (!sortSegmentTable.key) return list;

    return [...list].sort((a, b) => {
      let aVal = a[sortSegmentTable.key];
      let bVal = b[sortSegmentTable.key];
      if (sortSegmentTable.key === 'atv') {
        aVal = a.invoices > 0 ? a.revenue / a.invoices : 0;
        bVal = b.invoices > 0 ? b.revenue / b.invoices : 0;
      }
      if (typeof aVal === 'string') {
        return sortSegmentTable.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortSegmentTable.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [selectedMonths, selectedBranches, selectedSegments, sortSegmentTable]);

  const handleSortSegmentTable = (key) => {
    setSortSegmentTable(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: (key === 'month' || key === 'branch_name' || key === 'segment') ? 'asc' : 'desc' };
    });
  };

  // Aggregate KPI summary (Aware of Month, Branch & Segment)
  const kpis = useMemo(() => {
    const totalRev = filteredPerf.reduce((sum, i) => sum + i.revenue, 0);
    const totalInvoices = filteredPerf.reduce((sum, i) => sum + i.invoices, 0);
    const isAllFilters = selectedMonths.includes('ALL') && selectedBranches.includes('ALL') && selectedSegments.includes('ALL');
    const totalPatients = isAllFilters 
      ? 21993 
      : filteredPerf.reduce((sum, i) => sum + i.patients, 0);
    const atv = totalInvoices > 0 ? totalRev / totalInvoices : 0;
    return { totalRev, totalInvoices, totalPatients, atv };
  }, [filteredPerf, selectedMonths, selectedBranches, selectedSegments]);

  // Transaction Types Data with calculated percentages (Aware of Month, Branch & Segment)
  const txTypeData = useMemo(() => {
    const raw = data.tx_types_granular || data.tx_types || [];
    const colors = {
      'Product Only (Obat)': '#3b82f6', // Blue
      'Mixed (Campuran)': '#f59e0b',     // Amber / Gold
      'Treatment Only': '#10b981',       // Emerald
      'Other': '#64748b'                 // Slate
    };

    if (data.tx_types_granular) {
      const map = new Map();
      raw.forEach(item => {
        if (!matchesFilter(selectedMonths, item.month)) return;
        if (!matchesFilter(selectedBranches, item.branch_name)) return;
        if (!matchesFilter(selectedSegments, item.segment)) return;

        const existing = map.get(item.label) || { label: item.label, invoices: 0, revenue: 0 };
        existing.invoices += item.invoices;
        existing.revenue += item.revenue;
        map.set(item.label, existing);
      });

      const order = ['Product Only (Obat)', 'Treatment Only', 'Mixed (Campuran)', 'Other'];
      const aggregated = order.map(lbl => {
        const found = map.get(lbl) || { label: lbl, invoices: 0, revenue: 0 };
        return {
          ...found,
          atv: found.invoices > 0 ? Math.round(found.revenue / found.invoices) : 0
        };
      });

      const totalRev = aggregated.reduce((s, i) => s + i.revenue, 0);
      const totalInv = aggregated.reduce((s, i) => s + i.invoices, 0);

      return aggregated.map(item => ({
        ...item,
        revPercentage: totalRev > 0 ? ((item.revenue / totalRev) * 100).toFixed(1) : '0.0',
        invPercentage: totalInv > 0 ? ((item.invoices / totalInv) * 100).toFixed(1) : '0.0',
        fill: colors[item.label] || '#6366f1'
      }));
    } else {
      const totalRev = data.tx_types.reduce((s, i) => s + i.revenue, 0);
      const totalInv = data.tx_types.reduce((s, i) => s + i.invoices, 0);
      return data.tx_types.map(item => ({
        ...item,
        revPercentage: totalRev > 0 ? ((item.revenue / totalRev) * 100).toFixed(1) : '0.0',
        invPercentage: totalInv > 0 ? ((item.invoices / totalInv) * 100).toFixed(1) : '0.0',
        fill: colors[item.label] || '#6366f1'
      }));
    }
  }, [selectedMonths, selectedBranches, selectedSegments]);

  // Format currency IDR
  const formatIDR = (val) => {
    if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(2)} M`;
    if (val >= 1e6) return `Rp ${(val / 1e6).toFixed(1)} Jt`;
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  const formatNumber = (val) => Math.round(val).toLocaleString('id-ID');

  // Performance chart data grouped by month (Aware of Branch & Segment)
  const monthlyTrendData = useMemo(() => {
    const months = ['2022-10', '2022-11', '2022-12'];
    return months.map(m => {
      const items = data.segments ? data.segments.filter(i => 
        i.month === m && 
        matchesFilter(selectedBranches, i.branch_name) &&
        matchesFilter(selectedSegments, i.segment)
      ) : [];
      const rev = items.reduce((s, i) => s + i.revenue, 0);
      const inv = items.reduce((s, i) => s + i.invoices, 0);
      const pat = items.reduce((s, i) => s + i.customers, 0);
      return {
        monthLabel: m === '2022-10' ? 'Oktober' : m === '2022-11' ? 'November' : 'Desember',
        Revenue: rev,
        Invoices: inv,
        Patients: pat,
        ATV: inv > 0 ? Math.round(rev / inv) : 0
      };
    });
  }, [selectedBranches, selectedSegments]);

  // Branch breakdown comparison data (Aware of Month & Segment)
  const branchComparisonData = useMemo(() => {
    const branches = ['SURABAYA', 'BANDUNG', 'MALANG', 'SIDOARJO'];
    return branches.map(b => {
      const items = data.segments ? data.segments.filter(i => 
        i.branch_name === b && 
        matchesFilter(selectedMonths, i.month) &&
        matchesFilter(selectedSegments, i.segment)
      ) : [];
      const rev = items.reduce((s, i) => s + i.revenue, 0);
      const inv = items.reduce((s, i) => s + i.invoices, 0);
      return {
        branch: b,
        Revenue: rev,
        Invoices: inv,
        ATV: inv > 0 ? Math.round(rev / inv) : 0
      };
    });
  }, [selectedMonths, selectedSegments]);

  // DESC sorted branch data for Revenue & ATV BarCharts
  const branchRevenueSortedData = useMemo(() => {
    return [...branchComparisonData].sort((a, b) => b.Revenue - a.Revenue);
  }, [branchComparisonData]);

  const branchAtvSortedData = useMemo(() => {
    return [...branchComparisonData].sort((a, b) => b.ATV - a.ATV);
  }, [branchComparisonData]);

  // Customer Segment Summary with Percentages & Color Mapping (Aware of Month & Branch)
  const segmentData = useMemo(() => {
    const segs = ['Repeat Customer', 'Reactivated Customer', 'New Customer', 'Non Member'];
    const rawItems = segs.map(s => {
      const items = data.segments.filter(i => i.segment === s && 
        matchesFilter(selectedMonths, i.month) && 
        matchesFilter(selectedBranches, i.branch_name));
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
      percentage: totalSegRev > 0 ? ((item.Revenue / totalSegRev) * 100).toFixed(1) : '0.0'
    }));
  }, [selectedMonths, selectedBranches]);

  // DESC sorted segment data for ATV BarChart & Revenue Donut
  const segmentAtvSortedData = useMemo(() => {
    return [...segmentData].sort((a, b) => b.ATV - a.ATV);
  }, [segmentData]);

  const segmentRevenueSortedData = useMemo(() => {
    return [...segmentData].sort((a, b) => b.Revenue - a.Revenue);
  }, [segmentData]);

  // Doctor summary aggregated by Primary Branch (Aware of Month, Branch, Segment)
  const doctorBranchSummary = useMemo(() => {
    const branches = ['SURABAYA', 'BANDUNG', 'MALANG', 'SIDOARJO'];
    return branches.map(b => {
      const docsInBranch = filteredDoctors.filter(d => d.branch === b);
      const totalRev = docsInBranch.reduce((s, d) => s + d.revenue, 0);
      const totalTx = docsInBranch.reduce((s, d) => s + d.transactions, 0);
      return {
        branch: b,
        Revenue: totalRev,
        Transactions: totalTx,
        DoctorCount: docsInBranch.length,
        ATV: totalTx > 0 ? Math.round(totalRev / totalTx) : 0
      };
    }).filter(b => matchesFilter(selectedBranches, b.branch))
      .sort((a, b) => b.Revenue - a.Revenue);
  }, [filteredDoctors, selectedBranches]);

  // Top 10 Doctors data for BarChart (Aware of Month, Branch, Segment)
  const top10DoctorsData = useMemo(() => {
    return filteredDoctors.slice(0, 10).map(d => ({
      alias: d.alias,
      branch: d.branch,
      Revenue: d.revenue,
      Transactions: d.transactions,
      ATV: d.atv
    }));
  }, [filteredDoctors]);

  // Treatment vs Skincare Product Breakdown Per Branch (Aware of Month, Branch & Segment)
  const branchTreatmentVsProductData = useMemo(() => {
    const branches = ['SURABAYA', 'BANDUNG', 'MALANG', 'SIDOARJO'];
    const trtdRaw = data.treatments_granular || [];
    const prddRaw = data.products_granular || [];

    return branches.map(b => {
      const trtItems = trtdRaw.filter(i => i.branch_name === b && 
        matchesFilter(selectedMonths, i.month) && 
        matchesFilter(selectedSegments, i.segment));
      const prdItems = prddRaw.filter(i => i.branch_name === b && 
        matchesFilter(selectedMonths, i.month) && 
        matchesFilter(selectedSegments, i.segment));

      const trtRev = trtItems.reduce((sum, i) => sum + i.revenue, 0);
      const prdRev = prdItems.reduce((sum, i) => sum + i.revenue, 0);
      const totalRev = trtRev + prdRev;

      return {
        branch: b,
        'Treatment': trtRev,
        'Skincare Product': prdRev,
        TotalRevenue: totalRev
      };
    }).filter(b => matchesFilter(selectedBranches, b.branch))
      .sort((a, b) => b.TotalRevenue - a.TotalRevenue);
  }, [selectedMonths, selectedBranches, selectedSegments]);

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

  // Multi-line tick renderer for segment bar chart to prevent label collision & clear X-axis line
  const renderSegmentXAxisTick = ({ x, y, payload }) => {
    const parts = payload.value.split(' ');
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="bold">
          <tspan x={0} dy="18">{parts[0]}</tspan>
          {parts[1] && <tspan x={0} dy="14">{parts[1]}</tspan>}
        </text>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 selection:bg-indigo-500 selection:text-white">
      {/* Sticky Header & Filter Toolbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-2xl sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              Executive Business & Patient Migration Dashboard
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-400">
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
                Technical Test Data Analyst
              </span>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kandidat: <strong className="text-slate-100 font-semibold">Al Fitra Nur Ramadhani</strong></span>
              </div>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-medium">Periode: Q4 2022</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-xs font-extrabold text-white shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shrink-0"></span>
              <span className="tracking-wide">PT Kosmetika Klinik Indonesia</span>
            </span>
          </div>
        </div>

        {/* Integrated Sticky Filter Toolbar */}
        <div className="border-t border-slate-800/80 bg-slate-950/90 py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Filter Dashboard Interaktif:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {/* Multi-Select Month Filter */}
              <MultiSelectDropdown
                title="Bulan"
                icon={Calendar}
                options={[
                  { value: '2022-10', label: 'Oktober 2022' },
                  { value: '2022-11', label: 'November 2022' },
                  { value: '2022-12', label: 'Desember 2022' }
                ]}
                selected={selectedMonths}
                onChange={setSelectedMonths}
              />

              {/* Multi-Select Branch Filter */}
              <MultiSelectDropdown
                title="Cabang"
                icon={MapPin}
                options={[
                  { value: 'SURABAYA', label: 'Cabang Surabaya' },
                  { value: 'BANDUNG', label: 'Cabang Bandung' },
                  { value: 'MALANG', label: 'Cabang Malang' },
                  { value: 'SIDOARJO', label: 'Cabang Sidoarjo' }
                ]}
                selected={selectedBranches}
                onChange={setSelectedBranches}
              />

              {/* Multi-Select Customer Segment Filter */}
              <MultiSelectDropdown
                title="Segmentasi"
                icon={Users}
                options={[
                  { value: 'Repeat Customer', label: 'Repeat Customer' },
                  { value: 'Reactivated Customer', label: 'Reactivated Customer' },
                  { value: 'New Customer', label: 'New Customer' },
                  { value: 'Non Member', label: 'Non Member' }
                ]}
                selected={selectedSegments}
                onChange={setSelectedSegments}
              />

              {(!selectedMonths.includes('ALL') || !selectedBranches.includes('ALL') || !selectedSegments.includes('ALL')) && (
                <button 
                  type="button"
                  onClick={() => { 
                    setSelectedMonths(['ALL']); 
                    setSelectedBranches(['ALL']); 
                    setSelectedSegments(['ALL']); 
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 flex items-center gap-1 ml-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">

        {/* Executive KPI Summary Cards - Sleek & Compact Alignment */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Revenue */}
          <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-36 group hover:border-indigo-500/60 transition">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-indigo-300 tracking-wider uppercase truncate">TOTAL REVENUE (Q4)</p>
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{formatIDR(kpis.totalRev)}</h3>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold truncate">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">+10.18% Recovery MoM (Des)</span>
            </div>
          </div>

          {/* Card 2: Invoices */}
          <div className="bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-36 group hover:border-purple-500/60 transition">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-purple-300 tracking-wider uppercase truncate">TOTAL INVOICE (Q4)</p>
              <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30 shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{formatNumber(kpis.totalInvoices)}</h3>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
              <Activity className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              <span className="truncate">Volume Transaksi Terpantau</span>
            </div>
          </div>

          {/* Card 3: Patients */}
          <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-36 group hover:border-emerald-500/60 transition">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-emerald-300 tracking-wider uppercase truncate">PASIEN UNIK (Q4)</p>
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30 shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{formatNumber(kpis.totalPatients)}</h3>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold truncate">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Dominasi Repeat (66.4%)</span>
            </div>
          </div>

          {/* Card 4: ATV */}
          <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-36 group hover:border-amber-500/60 transition">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-amber-300 tracking-wider uppercase truncate">RATA-RATA ATV (Q4)</p>
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{formatIDR(kpis.atv)}</h3>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold truncate">
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
            <Activity className="w-4 h-4 text-cyan-400" />
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
            <Users className="w-4 h-4 text-purple-400" />
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
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span>Top Treatment & Produk</span>
          </button>

          <button 
            onClick={() => setActiveTab('tx_types')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tx_types' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Komposisi Tipe Transaksi</span>
          </button>

          <button 
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'doctors' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-sky-400" />
            <span>Performa Dokter</span>
          </button>

          <button 
            onClick={() => setActiveTab('sidoarjo')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sidoarjo' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Deep Dive Cabang Sidoarjo</span>
          </button>

          <button 
            onClick={() => setActiveTab('profiling')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profiling' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>Audit Profiling Data</span>
          </button>

          <button 
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'insights' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Award className="w-4 h-4 text-amber-300" />
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
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Rekonsiliasi Migrasi Pasien</span>
          </button>
        </div>

        {/* Tab 1: Overview & Branch Performance */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Trend */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-800/80">
                    <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-400" />
                      Tren Revenue Bulanan (Q4 2022)
                    </h3>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30 font-bold shrink-0">Bulanan</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 truncate">Pertumbuhan MoM: Oktober (Rp 8.09M) → November (Rp 7.72M) → Desember (Rp 8.51M)</p>
                </div>
                
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendData} margin={{ top: 25, right: 20, left: 15, bottom: 10 }}>
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
                        width={80} 
                      />
                      <Tooltip 
                        formatter={(val) => [`Rp ${val.toLocaleString('id-ID')}`, 'Revenue']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }}
                        itemStyle={{ color: '#38bdf8' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="Revenue" fill="#6366f1" radius={[8, 8, 0, 0]}>
                        <LabelList 
                          dataKey="Revenue" 
                          position="top" 
                          formatter={(val) => val >= 1e9 ? `Rp ${(val / 1e9).toFixed(2)} M` : `Rp ${(val / 1e6).toFixed(1)} Jt`} 
                          fill="#a5b4fc" 
                          fontSize={11} 
                          fontWeight="bold" 
                          offset={8}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Branch Contribution Comparison - Symmetrical Title */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-800/80">
                    <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400" />
                      Kontribusi Revenue Per Cabang
                    </h3>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 font-bold shrink-0">Cabang</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 truncate">Surabaya Top Rp 8,94M (36.7%), Bandung Rp 6,60M, Malang Rp 5,18M, Sidoarjo Rp 3,61M</p>
                </div>
                
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchRevenueSortedData} layout="vertical" margin={{ top: 10, right: 90, left: 40, bottom: 10 }}>
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
                      <Bar dataKey="Revenue" fill="#10b981" radius={[0, 8, 8, 0]}>
                        <LabelList 
                          dataKey="Revenue" 
                          position="right" 
                          formatter={(val) => val >= 1e9 ? `Rp ${(val / 1e9).toFixed(2)} M` : `Rp ${(val / 1e6).toFixed(1)} Jt`} 
                          fill="#34d399" 
                          fontSize={11} 
                          fontWeight="bold" 
                          offset={8}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Monthly Volume & Patients Line Chart */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-800/80 min-h-[52px] gap-2">
                    <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-white flex items-center gap-2 leading-snug">
                      <Activity className="w-5 h-5 text-purple-400 shrink-0" />
                      <span>Tren Volume Transaksi & Pasien Unik <span className="text-slate-400 font-medium text-xs sm:text-sm">(Q4 2022)</span></span>
                    </h3>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30 font-bold shrink-0">Volume</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 truncate">Kenaikan volume invoice & jumlah pasien unik per bulan</p>
                </div>
                
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: 15, bottom: 10 }}>
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
                        tickFormatter={(val) => formatNumber(val)} 
                        width={60} 
                      />
                      <Tooltip 
                        formatter={(val, name) => [formatNumber(val), name]}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="Invoices" stroke="#a855f7" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} name="Jumlah Invoice" />
                      <Line type="monotone" dataKey="Patients" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} name="Pasien Unik" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Branch ATV Comparison Bar Chart */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-800/80 min-h-[52px] gap-2">
                    <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-white flex items-center gap-2 leading-snug">
                      <CreditCard className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>Profil ATV (Rata-Rata Belanja) Per Cabang</span>
                    </h3>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 font-bold shrink-0">ATV Cabang</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 truncate">Surabaya tertinggi (Rp 524rb), Sidoarjo terendah (Rp 426rb)</p>
                </div>
                
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchAtvSortedData} margin={{ top: 25, right: 20, left: 15, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="branch" 
                        stroke="#ffffff" 
                        strokeWidth={2}
                        tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        stroke="#ffffff" 
                        strokeWidth={2}
                        tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                        tickFormatter={(val) => val === 0 ? 'Rp 0' : `Rp ${(val / 1e3).toFixed(0)} rb`} 
                        width={75} 
                      />
                      <Tooltip 
                        formatter={(val) => [`Rp ${Math.round(val).toLocaleString('id-ID')}`, 'Rata-Rata ATV']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }}
                        itemStyle={{ color: '#f59e0b' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="ATV" fill="#f59e0b" radius={[8, 8, 0, 0]}>
                        <LabelList 
                          dataKey="ATV" 
                          position="top" 
                          formatter={(val) => val >= 1e3 ? `Rp ${Math.round(val / 1e3)}rb` : `Rp ${val}`} 
                          fill="#fde047" 
                          fontSize={11} 
                          fontWeight="bold" 
                          offset={8}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Performance Detail Table with Interactive Column Sorting */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-extrabold text-white">Tabel Detail Performa Per Cabang & Bulan</h3>
                <span className="text-xs text-indigo-400 font-semibold">Klik judul kolom untuk sortir (Sort ▲/▼)</span>
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
                  <h3 className="text-base sm:text-lg font-extrabold text-white mb-1 flex items-center gap-2">
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
                  <h3 className="text-base sm:text-lg font-extrabold text-white mb-1 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    Profil ATV (Rata-Rata Belanja) Per Segmen
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">New Customer memimpin ATV (Rp 750rb), Non Member terendah (Rp 177rb)</p>
                  
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={segmentAtvSortedData} margin={{ top: 25, right: 20, left: 15, bottom: 45 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#ffffff" 
                          strokeWidth={2}
                          interval={0}
                          height={55}
                          tick={renderSegmentXAxisTick}
                        />
                        <YAxis 
                          stroke="#ffffff" 
                          strokeWidth={2}
                          tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                          tickFormatter={(val) => val === 0 ? 'Rp 0' : `Rp ${(val / 1e3).toFixed(0)} rb`} 
                          width={80} 
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
                          <LabelList 
                            dataKey="ATV" 
                            position="top" 
                            formatter={(val) => val >= 1e3 ? `Rp ${Math.round(val / 1e3)}rb` : `Rp ${val}`} 
                            fill="#cbd5e1" 
                            fontSize={11} 
                            fontWeight="bold" 
                            offset={8}
                          />
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

            {/* Rincian Customer & Revenue Per Kategori, Bulan & Cabang Table */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    Rincian Customer & Revenue Per Kategori, Bulan & Cabang
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tabel breakdown jumlah customer unik, invoice, total revenue, dan ATV per segmen customer untuk setiap bulan dan cabang.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-3 py-1.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-xs font-semibold text-indigo-300">
                    Record: <span className="font-extrabold text-white">{sortedSegmentDetail.length}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300">
                    Total Revenue: <span className="font-extrabold text-emerald-400">{formatIDR(sortedSegmentDetail.reduce((s, i) => s + i.revenue, 0))}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th onClick={() => handleSortSegmentTable('month')} className="p-3.5 cursor-pointer hover:bg-slate-700/60 transition select-none group">
                        <div className="flex items-center gap-1.5">
                          <span>Bulan</span>
                          {renderSortIcon(sortSegmentTable, 'month')}
                        </div>
                      </th>
                      <th onClick={() => handleSortSegmentTable('branch_name')} className="p-3.5 cursor-pointer hover:bg-slate-700/60 transition select-none group">
                        <div className="flex items-center gap-1.5">
                          <span>Cabang</span>
                          {renderSortIcon(sortSegmentTable, 'branch_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSortSegmentTable('segment')} className="p-3.5 cursor-pointer hover:bg-slate-700/60 transition select-none group">
                        <div className="flex items-center gap-1.5">
                          <span>Kategori Customer</span>
                          {renderSortIcon(sortSegmentTable, 'segment')}
                        </div>
                      </th>
                      <th onClick={() => handleSortSegmentTable('customers')} className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Jumlah Customer</span>
                          {renderSortIcon(sortSegmentTable, 'customers')}
                        </div>
                      </th>
                      <th onClick={() => handleSortSegmentTable('invoices')} className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Jumlah Invoice</span>
                          {renderSortIcon(sortSegmentTable, 'invoices')}
                        </div>
                      </th>
                      <th onClick={() => handleSortSegmentTable('revenue')} className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Total Revenue</span>
                          {renderSortIcon(sortSegmentTable, 'revenue')}
                        </div>
                      </th>
                      <th onClick={() => handleSortSegmentTable('atv')} className="p-3.5 text-right cursor-pointer hover:bg-slate-700/60 transition select-none group">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>ATV (Rata-Rata)</span>
                          {renderSortIcon(sortSegmentTable, 'atv')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sortedSegmentDetail.length > 0 ? (
                      sortedSegmentDetail.map((item, idx) => {
                        const atvVal = item.invoices > 0 ? Math.round(item.revenue / item.invoices) : 0;
                        const monthText = item.month === '2022-10' ? 'Oktober 2022' : item.month === '2022-11' ? 'November 2022' : 'Desember 2022';
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-medium text-slate-200">{monthText}</td>
                            <td className="p-3.5 font-bold text-white">
                              <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs border border-slate-700/80">
                                {item.branch_name}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{ 
                                  backgroundColor: `${SEGMENT_COLORS[item.segment]}20`,
                                  color: SEGMENT_COLORS[item.segment] || '#ffffff',
                                  border: `1px solid ${SEGMENT_COLORS[item.segment]}40`
                                }}
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[item.segment] }}></span>
                                {item.segment}
                              </span>
                            </td>
                            <td className="p-3.5 text-right font-semibold text-slate-200">{formatNumber(item.customers)} Pasien</td>
                            <td className="p-3.5 text-right font-medium text-slate-300">{formatNumber(item.invoices)} Invoice</td>
                            <td className="p-3.5 text-right font-extrabold text-emerald-400">{formatIDR(item.revenue)}</td>
                            <td className="p-3.5 text-right font-semibold text-purple-300">Rp {formatNumber(atvVal)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-500">
                          Tidak ada data segmen customer yang sesuai dengan filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {sortedSegmentDetail.length > 0 && (
                    <tfoot className="bg-slate-950/80 font-bold text-white border-t-2 border-slate-700/80">
                      <tr>
                        <td colSpan="3" className="p-3.5 text-right uppercase text-xs text-slate-400">Total Filtered:</td>
                        <td className="p-3.5 text-right font-extrabold text-indigo-300">
                          {formatNumber(sortedSegmentDetail.reduce((s, i) => s + i.customers, 0))} Pasien
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-indigo-300">
                          {formatNumber(sortedSegmentDetail.reduce((s, i) => s + i.invoices, 0))} Invoice
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-emerald-400">
                          {formatIDR(sortedSegmentDetail.reduce((s, i) => s + i.revenue, 0))}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-purple-300">
                          Rp {formatNumber(
                            sortedSegmentDetail.reduce((s, i) => s + i.invoices, 0) > 0 
                              ? Math.round(sortedSegmentDetail.reduce((s, i) => s + i.revenue, 0) / sortedSegmentDetail.reduce((s, i) => s + i.invoices, 0)) 
                              : 0
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Top Treatments & Products */}
        {activeTab === 'treatments' && (
          <div className="space-y-6">
            {/* Visual Chart: Per Cabang Treatment vs Product Revenue Breakdown */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-800/80 min-h-[52px] gap-2">
                  <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-white flex items-center gap-2 leading-snug">
                    <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Kontribusi Revenue: Treatment Medis vs Skincare Product Per Cabang</span>
                  </h3>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 font-bold shrink-0">Per Cabang</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 truncate">Perbandingan total omset layanan Treatment Medis dan Penjualan Skincare Homecare di tiap cabang (DESC)</p>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchTreatmentVsProductData} margin={{ top: 25, right: 20, left: 15, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="branch" 
                      stroke="#ffffff" 
                      strokeWidth={2}
                      tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      stroke="#ffffff" 
                      strokeWidth={2}
                      tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                      tickFormatter={(val) => val === 0 ? 'Rp 0' : `Rp ${(val / 1e9).toFixed(1)} M`} 
                      width={80} 
                    />
                    <Tooltip 
                      formatter={(val, name) => [`Rp ${val.toLocaleString('id-ID')}`, name]}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="Treatment" fill="#6366f1" radius={[8, 8, 0, 0]}>
                      <LabelList 
                        dataKey="Treatment" 
                        position="top" 
                        formatter={(val) => val >= 1e9 ? `Rp ${(val / 1e9).toFixed(2)} M` : `Rp ${(val / 1e6).toFixed(1)} Jt`} 
                        fill="#a5b4fc" 
                        fontSize={10} 
                        fontWeight="bold" 
                        offset={8}
                      />
                    </Bar>
                    <Bar dataKey="Skincare Product" fill="#a855f7" radius={[8, 8, 0, 0]}>
                      <LabelList 
                        dataKey="Skincare Product" 
                        position="top" 
                        formatter={(val) => val >= 1e9 ? `Rp ${(val / 1e9).toFixed(2)} M` : `Rp ${(val / 1e6).toFixed(1)} Jt`} 
                        fill="#d8b4fe" 
                        fontSize={10} 
                        fontWeight="bold" 
                        offset={8}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Top 10 Ranking Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80 min-h-[52px] gap-2">
                  <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-white flex items-center gap-2 leading-snug">
                    <PackageCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span>Top 10 Treatment Medis <span className="text-slate-400 font-medium text-xs sm:text-sm">(Rincian Transaksi)</span></span>
                  </h3>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30 font-bold shrink-0">Treatment</span>
                </div>
                <div className="space-y-3">
                  {topTreatments.length > 0 ? (
                    topTreatments.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-indigo-500/40 transition">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-extrabold flex items-center justify-center border border-indigo-500/30 shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-sm text-slate-100 tracking-wide">{t.name}</p>
                            <p className="text-xs text-slate-400">{formatNumber(t.count)} transaksi | {formatNumber(t.qty)} unit</p>
                          </div>
                        </div>
                        <span className="font-extrabold text-emerald-400 text-sm shrink-0 ml-2">{formatIDR(t.revenue)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      Tidak ada data treatment yang sesuai dengan filter.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80 min-h-[52px] gap-2">
                  <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-white flex items-center gap-2 leading-snug">
                    <PackageCheck className="w-5 h-5 text-purple-400 shrink-0" />
                    <span>Top 10 Skincare Homecare <span className="text-slate-400 font-medium text-xs sm:text-sm">(Rincian Transaksi)</span></span>
                  </h3>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30 font-bold shrink-0">Skincare</span>
                </div>
                <div className="space-y-3">
                  {topProducts.length > 0 ? (
                    topProducts.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-emerald-500/40 transition">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold flex items-center justify-center border border-emerald-500/30 shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-sm text-slate-100 tracking-wide">{p.name}</p>
                            <p className="text-xs text-slate-400">{formatNumber(p.qty)} unit terjual</p>
                          </div>
                        </div>
                        <span className="font-extrabold text-emerald-400 text-sm shrink-0 ml-2">{formatIDR(p.revenue)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      Tidak ada data produk yang sesuai dengan filter.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Transaction Composition (Product Only, Treatment Only, Mixed) */}
        {activeTab === 'tx_types' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-400" />
                    Komposisi Tipe Transaksi (Product Only, Treatment Only, Mixed)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluasi porsi dan perbandingan kontribusi revenue, volume invoice, serta rata-rata ATV antara transaksi Skincare Only, Treatment Medis Only, dan Paket Mixed.
                  </p>
                </div>
              </div>

              {/* Grid 3 Cards for Tipe Transaksi Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {txTypeData.filter(t => t.label !== 'Other').map((t, idx) => (
                  <div 
                    key={idx} 
                    className="bg-slate-950/70 border rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden group hover:border-slate-700 transition"
                    style={{ borderColor: `${t.fill}40` }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                        style={{ backgroundColor: `${t.fill}20`, color: t.fill, border: `1px solid ${t.fill}40` }}
                      >
                        {t.label}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{t.invPercentage}% Vol Invoice</span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1">Total Revenue (Q4)</p>
                      <h4 className="text-2xl font-black text-white">{formatIDR(t.revenue)}</h4>
                      <p className="text-xs font-bold text-emerald-400 mt-0.5">{t.revPercentage}% dari Total Revenue</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Volume Invoice</p>
                        <p className="font-bold text-slate-200">{formatNumber(t.invoices)} Invoice</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">ATV (Avg Spend)</p>
                        <p className="font-extrabold text-amber-300">Rp {formatNumber(t.atv)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Tipe Transaksi</th>
                      <th className="p-3.5 text-right">Jumlah Invoice</th>
                      <th className="p-3.5 text-right">Porsi Invoice (%)</th>
                      <th className="p-3.5 text-right">Total Revenue</th>
                      <th className="p-3.5 text-right">Porsi Revenue (%)</th>
                      <th className="p-3.5 text-right">ATV (Rata-Rata)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {txTypeData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></span>
                          {item.label}
                        </td>
                        <td className="p-3.5 text-right font-medium text-slate-200">{formatNumber(item.invoices)}</td>
                        <td className="p-3.5 text-right font-bold text-slate-300">{item.invPercentage}%</td>
                        <td className="p-3.5 text-right font-extrabold text-emerald-400">{formatIDR(item.revenue)}</td>
                        <td className="p-3.5 text-right font-extrabold text-indigo-300">{item.revPercentage}%</td>
                        <td className="p-3.5 text-right font-bold text-amber-300">Rp {formatNumber(item.atv)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950/80 font-bold text-white border-t-2 border-slate-700/80">
                    <tr>
                      <td className="p-3.5 uppercase text-xs text-slate-400">Total / Overall:</td>
                      <td className="p-3.5 text-right font-extrabold text-indigo-300">{formatNumber(txTypeData.reduce((s, i) => s + i.invoices, 0))}</td>
                      <td className="p-3.5 text-right font-bold text-indigo-300">100.0%</td>
                      <td className="p-3.5 text-right font-extrabold text-emerald-400">{formatIDR(txTypeData.reduce((s, i) => s + i.revenue, 0))}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">100.0%</td>
                      <td className="p-3.5 text-right font-extrabold text-amber-300">
                        Rp {formatNumber(Math.round(txTypeData.reduce((s, i) => s + i.revenue, 0) / txTypeData.reduce((s, i) => s + i.invoices, 0)))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Doctor Performance */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Doctor Chart 1: Kontribusi Revenue Dokter Per Cabang */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-800/80 min-h-[52px] gap-2">
                    <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-white flex items-center gap-2 leading-snug">
                      <Stethoscope className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Kontribusi Revenue Dokter Per Cabang</span>
                    </h3>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30 font-bold shrink-0">Per Cabang</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 truncate">Total omset dokter di masing-masing cabang utama (DESC)</p>
                </div>
                
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={doctorBranchSummary} margin={{ top: 25, right: 20, left: 15, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="branch" 
                        stroke="#ffffff" 
                        strokeWidth={2}
                        tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        stroke="#ffffff" 
                        strokeWidth={2}
                        tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                        tickFormatter={(val) => val === 0 ? 'Rp 0' : `Rp ${(val / 1e9).toFixed(1)} M`} 
                        width={80} 
                      />
                      <Tooltip 
                        formatter={(val) => [`Rp ${val.toLocaleString('id-ID')}`, 'Revenue Dokter']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }}
                        itemStyle={{ color: '#38bdf8' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="Revenue" fill="#6366f1" radius={[8, 8, 0, 0]}>
                        <LabelList 
                          dataKey="Revenue" 
                          position="top" 
                          formatter={(val) => val >= 1e9 ? `Rp ${(val / 1e9).toFixed(2)} M` : `Rp ${(val / 1e6).toFixed(1)} Jt`} 
                          fill="#a5b4fc" 
                          fontSize={11} 
                          fontWeight="bold" 
                          offset={8}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Doctor Chart 2: Top 10 Dokter Berdasarkan Revenue */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-800/80 min-h-[52px] gap-2">
                    <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-white flex items-center gap-2 leading-snug">
                      <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Top 10 Dokter Berdasarkan Revenue</span>
                    </h3>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 font-bold shrink-0">Top Dokter</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 truncate">Peringkat 10 dokter dengan pencapaian revenue tertinggi (DESC)</p>
                </div>
                
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top10DoctorsData} layout="vertical" margin={{ top: 10, right: 90, left: 40, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        type="number" 
                        stroke="#ffffff" 
                        strokeWidth={2}
                        tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                        tickFormatter={(val) => val === 0 ? 'Rp 0' : `Rp ${(val / 1e9).toFixed(1)} M`} 
                      />
                      <YAxis 
                        dataKey="alias" 
                        type="category" 
                        stroke="#ffffff" 
                        strokeWidth={2}
                        width={95} 
                        tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                      />
                      <Tooltip 
                        formatter={(val) => [`Rp ${val.toLocaleString('id-ID')}`, 'Revenue Dokter']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }}
                        itemStyle={{ color: '#34d399' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="Revenue" fill="#10b981" radius={[0, 8, 8, 0]}>
                        <LabelList 
                          dataKey="Revenue" 
                          position="right" 
                          formatter={(val) => val >= 1e9 ? `Rp ${(val / 1e9).toFixed(2)} M` : `Rp ${(val / 1e6).toFixed(1)} Jt`} 
                          fill="#34d399" 
                          fontSize={11} 
                          fontWeight="bold" 
                          offset={8}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

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
                    {sortedDocData.length > 0 ? (
                      sortedDocData.map((doc, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/50 transition">
                          <td className="p-3.5 font-bold text-indigo-400">#{doc.rank}</td>
                          <td className="p-3.5 font-bold text-white">{doc.alias}</td>
                          <td className="p-3.5 text-slate-400">{doc.branch}</td>
                          <td className="p-3.5 text-right font-medium">{formatNumber(doc.transactions)}</td>
                          <td className="p-3.5 text-right font-extrabold text-emerald-400">{formatIDR(doc.revenue)}</td>
                          <td className="p-3.5 text-right text-emerald-400 font-bold">{formatIDR(doc.atv)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500">
                          Tidak ada data dokter yang sesuai dengan filter.
                        </td>
                      </tr>
                    )}
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
                    Pasien Baru (<strong>New Customer</strong>) memiliki ATV tertinggi yaitu <strong>Rp 749.905</strong> per transaksi, 57% lebih tinggi dibanding rata-rata ATV bisnis (Rp 478rb).
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

        {/* Tab 7: Deep Dive Cabang Sidoarjo (Bagian 1-E) */}
        {activeTab === 'sidoarjo' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Analisis Cabang Prioritas: CABANG SIDOARJO</h3>
                  <p className="text-xs text-amber-300 font-medium">Cabang dengan kontribusi revenue terendah (14,83%) dan ATV terendah (Rp 426rb)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Total Revenue Q4</p>
                  <p className="text-xl font-extrabold text-amber-400 mt-1">Rp 3,61 Miliar</p>
                  <p className="text-[10px] text-slate-400 mt-1">Kontribusi 14.83% Klinik</p>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Average Transaction Value</p>
                  <p className="text-xl font-extrabold text-rose-400 mt-1">Rp 426.468</p>
                  <p className="text-[10px] text-slate-400 mt-1">Terendah dari 4 Cabang</p>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Total Invoice</p>
                  <p className="text-xl font-extrabold text-white mt-1">8.460</p>
                  <p className="text-[10px] text-slate-400 mt-1">49.6% dari Surabaya</p>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-indigo-400 font-bold">Porsi Transaksi Mixed</p>
                  <p className="text-xl font-extrabold text-indigo-400 mt-1">11,61%</p>
                  <p className="text-[10px] text-slate-400 mt-1">Cross-selling terendah</p>
                </div>
              </div>
            </div>

            {/* Sidoarjo Monthly Growth Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-2">Tren Pertumbuhan Bulanan Sidoarjo (Q4)</h3>
                <p className="text-xs text-slate-400 mb-4">Oktober: Rp 1.09M (ATV Rp 377rb) → November: Rp 1.17M (ATV Rp 456rb) → Desember: Rp 1.35M (ATV Rp 447rb)</p>
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-white">Oktober 2022</p>
                      <p className="text-[11px] text-slate-400">2.884 Invoice | 1.822 Pasien</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-400">Rp 1,09 Miliar</p>
                      <p className="text-[10px] text-slate-400">ATV Rp 377.532</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-white">November 2022</p>
                      <p className="text-[11px] text-slate-400">2.562 Invoice | 1.645 Pasien</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-400">Rp 1,17 Miliar (+7.5%)</p>
                      <p className="text-[10px] text-slate-400">ATV Rp 456.933</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-white">Desember 2022</p>
                      <p className="text-[11px] text-slate-400">3.014 Invoice | 1.901 Pasien</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-400">Rp 1,35 Miliar (+15.2%)</p>
                      <p className="text-[10px] text-slate-400">ATV Rp 447.399</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-2">Akar Masalah Kunci & Strategi Solusi Sidoarjo</h3>
                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-800/50">
                    <p className="font-bold text-rose-300">1. Rendahnya Cross-Selling Treatment + Skincare</p>
                    <p className="mt-1 text-slate-300">Porsi transaksi Mixed hanya 11,6% (terendah dari 4 cabang). Pasien yang melakukan treatment medis tidak direkomendasikan paket skincare homecare pasca-treatment.</p>
                  </div>

                  <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/50">
                    <p className="font-bold text-amber-300">2. Proporsi Non-Member Ber-ATV Rendah Terlalu Tinggi</p>
                    <p className="mt-1 text-slate-300">2.215 invoice Non Member (26,2% transaksi Sidoarjo) dengan ATV hanya Rp 183rb belum mendaftar member resmi.</p>
                  </div>

                  <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/50">
                    <p className="font-bold text-emerald-300">3. Solusi Prioritas & Target Recovery</p>
                    <p className="mt-1 text-slate-300">Terapkan SOP konsultasi resep bundling hero treatment + skincare, tingkatkan ATV Sidoarjo dari Rp 426rb ke Rp 480rb (+12,5%).</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidoarjo Customer Segment & Doctor Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Breakdown Segmen Customer Sidoarjo */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Breakdown Segmen Customer Cabang Sidoarjo
                </h3>
                <p className="text-xs text-slate-400 mb-4">Distribusi pasien, volume invoice, revenue, dan ATV per segmen customer di Cabang Sidoarjo</p>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-indigo-300">Repeat Customer (Loyal)</p>
                      <p className="text-[11px] text-slate-400">4.763 Invoice (56,3% Vol) | 4.031 Pasien</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-400">Rp 2,08 Miliar (57,7%)</p>
                      <p className="text-[10px] text-purple-300">ATV Rp 437.432</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-purple-300">Reactivated Customer</p>
                      <p className="text-[11px] text-slate-400">912 Invoice (10,8% Vol) | 912 Pasien</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-400">Rp 475,47 Jt (13,2%)</p>
                      <p className="text-[10px] text-purple-300">ATV Rp 521.347</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-emerald-300">New Customer (Pasien Baru)</p>
                      <p className="text-[11px] text-slate-400">766 Invoice (9,1% Vol) | 766 Pasien</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-400">Rp 505,48 Jt (14,0%)</p>
                      <p className="text-[10px] text-purple-300">ATV Rp 659.893</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-amber-300">Non Member (Tinggi Tapi ATV Rendah)</p>
                      <p className="text-[11px] text-slate-400">2.219 Invoice (26,2% Vol) | 2.219 Pasien</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-amber-400">Rp 433,69 Jt (12,0%)</p>
                      <p className="text-[10px] text-rose-400 font-bold">ATV Rp 195.442 (Terendah)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Performa Dokter Penanggung Jawab Sidoarjo */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-sky-400" />
                  Performa Dokter Penanggung Jawab Sidoarjo
                </h3>
                <p className="text-xs text-slate-400 mb-4">Peringkat kontribusi dokter yang bertugas di Cabang Sidoarjo</p>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">Doctor-0031</p>
                      <p className="text-[11px] text-slate-400">4.246 Transaksi</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-400">Rp 2,47 Miliar</p>
                      <p className="text-[10px] text-slate-400">ATV Rp 580.990</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">Doctor-0028</p>
                      <p className="text-[11px] text-slate-400">3.625 Transaksi</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-400">Rp 1,80 Miliar</p>
                      <p className="text-[10px] text-slate-400">ATV Rp 497.516</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">Doctor-0030</p>
                      <p className="text-[11px] text-slate-400">2.418 Transaksi</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-400">Rp 1,49 Miliar</p>
                      <p className="text-[10px] text-slate-400">ATV Rp 617.031</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">Doctor-0029</p>
                      <p className="text-[11px] text-slate-400">2.065 Transaksi</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-400">Rp 1,27 Miliar</p>
                      <p className="text-[10px] text-slate-400">ATV Rp 614.052</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Audit & Profiling Data */}
        {activeTab === 'profiling' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
                Hasil Audit Profiling Data & Data Integrity
              </h3>
              <p className="text-xs text-slate-400 mb-6">Pengecekan volume data, duplikasi, data NULL, integritas relasi tabel, dan pencegahan double counting</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-indigo-400">1. Data Volume Audit</p>
                  <p className="text-xs text-slate-300">Total 9 Tabel Utama Terverifikasi Utuh:</p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• <strong className="text-white">transactions</strong>: 50.856 baris</li>
                    <li>• <strong className="text-white">patients_anonymized</strong>: 21.993 baris</li>
                    <li>• <strong className="text-white">product_details</strong>: 168.936 baris</li>
                    <li>• <strong className="text-white">treatment_details</strong>: 32.712 baris</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-amber-400">2. Data NULL & Duplikasi Audit</p>
                  <p className="text-xs text-slate-300">Temuan Log Kualitas Data Pasien Legacy:</p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• <strong className="text-amber-300">105 baris</strong> RM Code NULL/Kosong</li>
                    <li>• <strong className="text-amber-300">34 baris</strong> RM Code Duplikat</li>
                    <li>• <strong className="text-amber-300">501 baris</strong> DOB Placeholder 1970</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-emerald-400">3. Pencegahan Double Counting</p>
                  <p className="text-xs text-slate-300">Audit Total Revenue Q4 2022:</p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• <strong className="text-emerald-400">Header Total Revenue</strong>: Rp 24,33 Miliar</li>
                    <li>• <strong className="text-emerald-400">Sum Item Details</strong>: Rp 24,33 Miliar</li>
                    <li>• <strong className="text-rose-400">Naive Join (Double Counted)</strong>: Rp 46,01 Miliar (+89,1%)</li>
                  </ul>
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
