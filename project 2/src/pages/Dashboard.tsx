import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { ArrowRight, Plus, Users, DollarSign, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalLeads: number;
  totalValue: number;
  activeLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  negotiationLeads: number;
  closedLeads: number;
  lostLeads: number;
  conversionRate: number;
  junkLeads: number;
  prospectingLeads: number;
  paidLeads: number;
  postponeLeads: number;
  revenueGenerated: number;
  potentialRevenue: number;
}

interface LeadsBySource {
  source: string;
  count: number;
}

interface LeadsBySpecialization {
  specialization: string;
  count: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalValue: 0,
    activeLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    negotiationLeads: 0,
    closedLeads: 0,
    lostLeads: 0,
    conversionRate: 0,
    junkLeads: 0,
    prospectingLeads: 0,
    paidLeads: 0,
    postponeLeads: 0,
    revenueGenerated: 0,
    potentialRevenue: 0,
  });
  const [leadsBySource, setLeadsBySource] = useState<LeadsBySource[]>([]);
  const [leadsBySpecialization, setLeadsBySpecialization] = useState<LeadsBySpecialization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id);
          
        if (leadsError) throw leadsError;
        
        console.log('Fetched leads for dashboard:', leads);
        leads?.forEach(lead => {
          console.log('Lead ID:', lead.id, 'Status:', lead.status);
        });
        
        // Calculate stats
        const totalLeads = leads?.length || 0;
        const totalValue = leads?.reduce((sum, lead) => sum + (lead.revenue || 0), 0) || 0;
        const activeLeads = leads?.filter(lead => lead.status !== 'Paid' && lead.status !== 'Lost Lead' && lead.status !== 'Junk Lead').length || 0;
        const newLeads = leads?.filter(lead => lead.status === 'New Lead').length || 0;
        const junkLeads = leads?.filter(lead => lead.status === 'Junk Lead').length || 0;
        const prospectingLeads = leads?.filter(lead => lead.status === 'Prospecting').length || 0;
        const qualifiedLeads = leads?.filter(lead => lead.status === 'Qualified').length || 0;
        const paidLeads = leads?.filter(lead => lead.status === 'Paid').length || 0;
        const negotiationLeads = leads?.filter(lead => lead.status === 'Negotiation').length || 0;
        const closedLeads = leads?.filter(lead => lead.status === 'Closed').length || 0;
        const lostLeads = leads?.filter(lead => lead.status === 'Lost Lead').length || 0;
        const postponeLeads = leads?.filter(lead => lead.status === 'Postpone').length || 0;

        // Calculate new revenue metrics
        const revenueGenerated = leads?.filter(lead => lead.status === 'Paid').reduce((sum, lead) => sum + (lead.revenue || 0), 0) || 0;
        const potentialRevenue = leads?.filter(lead => lead.status === 'Prospecting' || lead.status === 'Qualified').reduce((sum, lead) => sum + (lead.revenue || 0), 0) || 0;

        // Recalculate conversion rate based on new stages (Paid / (Total Leads - Junk Leads))
        const convertibleLeads = totalLeads - junkLeads;
        const conversionRate = convertibleLeads > 0 ? (paidLeads / convertibleLeads) * 100 : 0;
        
        console.log('Calculated stats:', {
          totalLeads,
          totalValue,
          activeLeads,
          newLeads,
          qualifiedLeads,
          negotiationLeads,
          closedLeads,
          lostLeads,
          junkLeads,
          prospectingLeads,
          paidLeads,
          postponeLeads,
          conversionRate,
          revenueGenerated,
          potentialRevenue,
        });

        setStats({
          totalLeads,
          totalValue,
          activeLeads,
          newLeads,
          qualifiedLeads,
          negotiationLeads,
          closedLeads,
          lostLeads,
          junkLeads,
          prospectingLeads,
          paidLeads,
          postponeLeads,
          conversionRate: parseFloat(conversionRate.toFixed(1)),
          revenueGenerated,
          potentialRevenue,
        });
        
        // Group leads by source
        const sourceMap: Record<string, number> = {};
        leads?.forEach(lead => {
          sourceMap[lead.source] = (sourceMap[lead.source] || 0) + 1;
        });
        
        const sourceData = Object.entries(sourceMap).map(([source, count]) => ({
          source,
          count,
        }));
        
        setLeadsBySource(sourceData);

        // Group leads by specialization
        const specializationMap: Record<string, number> = {};
        leads?.forEach(lead => {
          const spec = lead.specialization || 'Unknown';
          specializationMap[spec] = (specializationMap[spec] || 0) + 1;
        });

        const specializationData = Object.entries(specializationMap).map(([specialization, count]) => ({
          specialization,
          count,
        }));

        setLeadsBySpecialization(specializationData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();

    const channel = supabase.channel('leads-changes');

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload: any) => {
        console.log('Lead Inserted via Subscription!', payload);
        fetchDashboardData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload: any) => {
        console.log('Lead Updated via Subscription!', payload);
        fetchDashboardData();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, (payload: any) => {
        console.log('Lead Deleted via Subscription!', payload);
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };

  }, [user]);

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
      icon: <Activity className="h-6 w-6 text-secondary" />,
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
      icon: <XCircle className="h-6 w-6 text-destructive" />,
      color: 'bg-red-50',
    },
    {
      title: 'Prospecting',
      value: stats.prospectingLeads,
      icon: <Activity className="h-6 w-6 text-warning" />,
      color: 'bg-amber-50',
    },
    {
      title: 'Qualified',
      value: stats.qualifiedLeads,
      icon: <CheckCircle className="h-6 w-6 text-success" />,
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
      icon: <XCircle className="h-6 w-6 text-destructive" />,
      color: 'bg-red-50',
    },
    {
      title: 'Postpone',
      value: stats.postponeLeads,
      icon: <Clock className="h-6 w-6 text-primary" />,
      color: 'bg-blue-50',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.email?.split('@')[0]}</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <Link to="/leads/new">
            <button className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </button>
          </Link>
        </div>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {statCards.map((card, index) => (
          <motion.div 
            key={index}
            className={`bg-card rounded-lg shadow-sm border border-border p-5 ${card.color}`}
            variants={item}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <h3 className="text-2xl font-bold mt-1">{loading ? '-' : card.value}</h3>
              </div>
              <div className="p-2 rounded-md bg-white border border-border">
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          className="bg-card rounded-lg shadow-sm border border-border p-5 col-span-1 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Leads by Source</h2>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsBySource} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" angle={-45} textAnchor="end" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Specialization Pie Chart */}
        <motion.div 
          className="bg-card rounded-lg shadow-sm border border-border p-5 col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Leads by Specialization</h2>
          </div>

          <div className="h-72 flex items-center justify-center">
             {leadsBySpecialization.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsBySpecialization}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ specialization, percent }) => `${specialization}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {leadsBySpecialization.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No specialization data available.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;