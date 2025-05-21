import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Users, DollarSign, TrendingUp, Activity, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { FC } from 'react';

// Chart colors
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'] as const;

// Type for PieChart data (commented out since it's not currently used)
// interface PieChartData {
//   name: string;
//   value: number;
// }

interface DashboardStats {
  totalLeads: number;
  totalValue: number;
  activeLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  negotiationLeads: number;
  closedLeads: number;
  lostLeads: number;
  junkLeads: number;
  prospectingLeads: number;
  paidLeads: number;
  postponeLeads: number;
  revenueGenerated: number;
  potentialRevenue: number;
  commission: number;
  potentialCommission: number;
  newLeadsThisWeek: number;
  newLeadsThisMonth: number;
  conversionRate: number;
}

interface LeadsBySpecialization {
  specialization: string;
  count: number;
  percent?: number;
}

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  className?: string;
}

const StatusCard: FC<StatusCardProps> = ({ title, value, icon, trend, change, className = '' }) => (
  <motion.div 
    className={`bg-white rounded-xl shadow-sm p-6 ${className}`}
    variants={{
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
    }}
    initial="hidden"
    animate="show"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
        {change && (
          <p className={`text-xs mt-2 ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {change}
          </p>
        )}
      </div>
      <div className="p-2 rounded-lg bg-blue-100">
        {icon}
      </div>
    </div>
  </motion.div>
);

const Dashboard: FC = () => {
  const { user } = useAuth();
  
  // Add missing loading state
  const [loading, setLoading] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalValue: 0,
    activeLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    negotiationLeads: 0,
    closedLeads: 0,
    lostLeads: 0,
    junkLeads: 0,
    prospectingLeads: 0,
    paidLeads: 0,
    postponeLeads: 0,
    revenueGenerated: 0,
    potentialRevenue: 0,
    commission: 0,
    potentialCommission: 0,
    newLeadsThisWeek: 0,
    newLeadsThisMonth: 0,
    conversionRate: 0,
  });
  // Leads by specialization for the chart
  const [leadsBySpecialization, setLeadsBySpecialization] = useState<LeadsBySpecialization[]>([]);

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '₹0';
    return `₹${new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount)}`;
  };

  // Animation variants
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);

      if (leadsError) throw leadsError;

      const leads = leadsData || [];
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);

      const paidLeads = leads.filter(lead => lead.status === 'paid').length;
      const newLeadsThisWeek = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= oneWeekAgo && lead.status === 'new';
      }).length;

      const newLeadsThisMonth = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= oneMonthAgo && lead.status === 'new';
      }).length;

      const revenueGenerated = leads
        .filter(lead => lead.status === 'paid')
        .reduce((sum, lead) => sum + (lead.revenue || 0), 0);

      const potentialRevenue = leads
        .filter(lead => ['qualified', 'proposal_sent', 'negotiation'].includes(lead.status))
        .reduce((sum, lead) => sum + (lead.revenue || 0), 0);

      const newStats: DashboardStats = {
        totalLeads: leads.length,
        totalValue: leads.reduce((sum, lead) => sum + (lead.revenue || 0), 0),
        activeLeads: leads.filter(lead => 
          ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation'].includes(lead.status)
        ).length,
        newLeads: leads.filter(lead => lead.status === 'new').length,
        qualifiedLeads: leads.filter(lead => lead.status === 'qualified').length,
        negotiationLeads: leads.filter(lead => lead.status === 'negotiation').length,
        closedLeads: leads.filter(lead => lead.status === 'closed').length,
        lostLeads: leads.filter(lead => lead.status === 'lost').length,
        junkLeads: leads.filter(lead => lead.status === 'junk').length,
        prospectingLeads: leads.filter(lead => lead.status === 'prospecting').length,
        paidLeads,
        postponeLeads: leads.filter(lead => lead.status === 'postpone').length,
        revenueGenerated,
        potentialRevenue,
        commission: revenueGenerated * 0.1, // 10% commission
        potentialCommission: potentialRevenue * 0.1, // 10% commission
        newLeadsThisWeek,
        newLeadsThisMonth,
        conversionRate: leads.length > 0 ? (paidLeads / leads.length) * 100 : 0,
      };

      const specializationMap = new Map<string, number>();
      leads.forEach(lead => {
        if (lead.specialization) {
          const count = specializationMap.get(lead.specialization) || 0;
          specializationMap.set(lead.specialization, count + 1);
        }
      });

      const leadsBySpecialization = Array.from(specializationMap.entries())
        .map(([specialization, count]) => ({
          specialization,
          count,
          percent: (count / leads.length) * 100
        }))
        .sort((a, b) => b.count - a.count);

      setLeadsBySpecialization(leadsBySpecialization);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();

    const subscription = supabase
      .channel('leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchDashboardData, user]);

  const getUserEmail = () => {
    try {
      return user?.email?.split('@')[0] || 'User';
    } catch {
      return user?.email?.split('@')[0] || 'User';
    }
  };

  // Revenue Cards
  const revenueCards = [
    {
      title: 'Revenue Generated',
      value: formatCurrency(stats.revenueGenerated),
      icon: <DollarSign className="h-6 w-6 text-green-500" />,
      trend: 'up' as const,
      change: '12% from last month'
    },
    {
      title: 'Potential Revenue',
      value: formatCurrency(stats.potentialRevenue),
      icon: <DollarSign className="h-6 w-6 text-blue-500" />,
      trend: 'up' as const,
      change: '8% from last month'
    },
    {
      title: 'Conversion Rate',
      value: stats.totalLeads > 0 ? `${((stats.paidLeads / stats.totalLeads) * 100).toFixed(1)}%` : '0%',
      icon: <TrendingUp className="h-6 w-6 text-yellow-600" />,
      trend: 'up' as const,
      change: '2% from last month'
    },
    {
      title: 'Commission',
      value: formatCurrency(stats.commission),
      icon: <DollarSign className="h-6 w-6 text-purple-500" />,
      trend: 'up' as const,
      change: '10% from last month'
    },
    {
      title: 'Potential Commission',
      value: formatCurrency(stats.potentialCommission),
      icon: <DollarSign className="h-6 w-6 text-yellow-500" />,
      trend: 'up' as const,
      change: '7% from last month'
    }
  ];

  // Lead Status Cards
  const leadStatusCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: <Users className="h-6 w-6 text-blue-500" />,
      trend: 'up' as const,
      change: `${stats.newLeadsThisWeek} new this week`
    },
    {
      title: 'Active Leads',
      value: stats.activeLeads,
      icon: <Users className="h-6 w-6 text-green-500" />,
      trend: 'up' as const,
      change: '5 more than last week'
    },
    {
      title: 'New Leads',
      value: stats.newLeads,
      icon: <Users className="h-6 w-6 text-yellow-500" />,
      trend: 'up' as const,
      change: `${stats.newLeadsThisWeek} this week`
    },
    {
      title: 'Qualified',
      value: stats.qualifiedLeads,
      icon: <Users className="h-6 w-6 text-purple-500" />,
      trend: 'up' as const,
      change: '3 more than last week'
    },
    {
      title: 'In Negotiation',
      value: stats.negotiationLeads,
      icon: <Users className="h-6 w-6 text-indigo-500" />,
      trend: 'neutral' as const,
      change: 'No change'
    },
    {
      title: 'Closed',
      value: stats.closedLeads,
      icon: <Users className="h-6 w-6 text-green-600" />,
      trend: 'up' as const,
      change: '2 closed this week'
    },
    {
      title: 'Lost',
      value: stats.lostLeads,
      icon: <Users className="h-6 w-6 text-red-500" />,
      trend: 'down' as const,
      change: '1 less than last week'
    },
    {
      title: 'Junk',
      value: stats.junkLeads,
      icon: <Users className="h-6 w-6 text-gray-500" />,
      trend: 'down' as const,
      change: '2 marked as junk'
    },
    {
      title: 'Postponed',
      value: stats.postponeLeads,
      icon: <Users className="h-6 w-6 text-gray-400" />,
      trend: 'neutral' as const,
      change: 'No change'
    }
  ];

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: <Users className="h-6 w-6 text-primary" />,
      color: 'bg-blue-50',
    },
    {
      title: 'Revenue Generated',
      value: `₹${stats.revenueGenerated.toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6 text-success" />,
      color: 'bg-green-50',
    },
    {
      title: 'Potential Revenue',
      value: `₹${stats.potentialRevenue.toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6 text-warning" />,
      color: 'bg-amber-50',
    },
    {
      title: 'Active Leads',
      value: stats.activeLeads,
      icon: <Users className="h-6 w-6 text-secondary" />,
      color: 'bg-purple-50',
    },
    {
      title: 'New Leads',
      value: stats.newLeads,
      icon: <Plus className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-50',
    },
    {
      title: 'Junk Leads',
      value: stats.junkLeads,
      icon: <Users className="h-6 w-6 text-destructive" />,
      color: 'bg-red-50',
    },
    {
      title: 'Prospecting',
      value: stats.prospectingLeads,
      icon: <Users className="h-6 w-6 text-warning" />,
      color: 'bg-amber-50',
    },
    {
      title: 'Qualified',
      value: stats.qualifiedLeads,
      icon: <Users className="h-6 w-6 text-success" />,
      color: 'bg-green-50',
    },
    {
      title: 'Paid Deals',
      value: stats.paidLeads,
      icon: <DollarSign className="h-6 w-6 text-success" />,
      color: 'bg-green-50',
    },
    {
      title: 'Lost Deals',
      value: stats.lostLeads,
      icon: <Users className="h-6 w-6 text-destructive" />,
      color: 'bg-red-50',
    },
    {
      title: 'Postpone',
      value: stats.postponeLeads,
      icon: <Users className="h-6 w-6 text-primary" />,
      color: 'bg-blue-50',
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-20 sm:pb-6">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Welcome back, {getUserEmail()}!</h1>
        <p className="text-sm sm:text-base text-gray-600">Here&apos;s what&apos;s happening with your leads today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-blue-500"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total Leads</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-800">{stats.totalLeads}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.newLeadsThisWeek} new this week</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-blue-50">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-green-500"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Revenue Generated</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-800">{formatCurrency(stats.revenueGenerated)}</p>
              <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-green-50">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-yellow-500"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-800">
                {stats.totalLeads > 0 ? `${((stats.paidLeads / stats.totalLeads) * 100).toFixed(1)}%` : '0%'}
              </p>
              <p className="text-xs text-yellow-600 mt-1">↑ 2% from last month</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-yellow-50">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-purple-500"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Active Leads</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-800">{stats.activeLeads}</p>
              <p className="text-xs text-purple-600 mt-1">5 more than last week</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-purple-50">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Revenue Cards - Responsive Grid */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-0">Revenue Overview</h2>
          <select className="text-xs sm:text-sm border rounded-md px-2 sm:px-3 py-1.5 max-w-[180px]">
            <option>This Month</option>
            <option>Last Month</option>
            <option>Last 3 Months</option>
          </select>
        </div>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {revenueCards.map((card, index) => (
            <StatusCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              trend={card.trend}
              change={card.change}
              className="hover:shadow-md transition-shadow"
            />
          ))}
        </motion.div>
      </div>

      {/* Lead Status Cards - Responsive Grid */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-0">Lead Status</h2>
          <Link to="/leads" className="text-xs sm:text-sm text-blue-600 hover:underline">
            View All Leads →
          </Link>
        </div>
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {leadStatusCards.map((card, index) => (
            <StatusCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              trend={card.trend}
              change={card.change}
              className="text-sm hover:shadow-md transition-shadow"
            />
          ))}
        </motion.div>
      </div>

      {/* Recent Activity - Responsive */}
      <motion.div
        className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8"
        variants={item}
        initial="hidden"
        animate="show"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Recent Activity</h2>
          <Link to="/activity" className="text-xs sm:text-sm text-blue-600 hover:underline">
            View All →
          </Link>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((activityItem) => (
            <div
              key={activityItem}
              className="flex items-start mb-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full mr-3 flex-shrink-0">
                <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                  New lead added from {['Website', 'Email', 'Referral'][activityItem % 3]}
                </p>
                <p className="text-xs text-gray-500">
                  {activityItem} {activityItem === 1 ? 'hour' : 'hours'} ago • {activityItem * 2} minutes ago
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Dashboard Overview - Desktop Only */}
      <div className="hidden lg:block mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Dashboard Overview</h2>
            <p className="text-gray-600">Comprehensive lead statistics</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link to="/leads/new">
              <button className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-4 py-2 rounded-md flex items-center text-sm sm:text-base">
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </button>
            </Link>
          </div>
        </div>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {statCards.map((stat, index) => (
            <motion.div 
              key={index} 
              className={`bg-white rounded-lg shadow-sm p-4 ${stat.color} hover:shadow-md transition-shadow`}
              variants={item}
            >
              <div className="flex items-center mb-2">
                <div className={`p-1.5 rounded-md ${stat.color.replace('50', '100')}`}>
                  {stat.icon}
                </div>
                <h3 className="text-sm font-medium ml-2 text-gray-700">{stat.title}</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Leads by Specialization Chart - Responsive */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Leads by Specialization</h2>
        <motion.div 
          className="bg-white rounded-lg shadow-sm p-4 sm:p-6"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <div className="h-64 sm:h-80 flex items-center justify-center">
            {leadsBySpecialization.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsBySpecialization}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ specialization, percent }) => {
                      if (percent && percent < 10) return '';
                      return `${specialization}: ${percent ? percent.toFixed(0) : 0}%`;
                    }}
                  >
                    {leadsBySpecialization.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.5rem' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm sm:text-base text-gray-500">No specialization data available.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity - Mobile Only */}
      <div className="lg:hidden mb-8">
        <motion.div
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
          <div className="text-center py-6 text-gray-400">
            <Activity className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm sm:text-base">Recent lead activities will appear here</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;