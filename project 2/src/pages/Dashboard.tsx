import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
}

interface LeadsBySource {
  source: string;
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
  });
  const [leadsBySource, setLeadsBySource] = useState<LeadsBySource[]>([]);
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
        
        // Calculate stats
        const totalLeads = leads?.length || 0;
        const totalValue = leads?.reduce((sum, lead) => sum + (lead.value || 0), 0) || 0;
        const activeLeads = leads?.filter(lead => lead.status !== 'closed' && lead.status !== 'lost').length || 0;
        const newLeads = leads?.filter(lead => lead.status === 'new').length || 0;
        const qualifiedLeads = leads?.filter(lead => lead.status === 'qualified').length || 0;
        const negotiationLeads = leads?.filter(lead => lead.status === 'negotiation').length || 0;
        const closedLeads = leads?.filter(lead => lead.status === 'closed').length || 0;
        const lostLeads = leads?.filter(lead => lead.status === 'lost').length || 0;
        const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;
        
        setStats({
          totalLeads,
          totalValue,
          activeLeads,
          newLeads,
          qualifiedLeads,
          negotiationLeads,
          closedLeads,
          lostLeads,
          conversionRate: parseFloat(conversionRate.toFixed(1)),
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
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: <Users className="h-6 w-6 text-primary" />,
      color: 'bg-blue-50',
    },
    {
      title: 'Total Value',
      value: `₹${stats.totalValue.toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6 text-success" />,
      color: 'bg-green-50',
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
      icon: <Plus className="h-6 w-6 text-primary" />,
      color: 'bg-blue-50',
    },
    {
      title: 'Qualified',
      value: stats.qualifiedLeads,
      icon: <CheckCircle className="h-6 w-6 text-warning" />,
      color: 'bg-amber-50',
    },
    {
      title: 'In Negotiation',
      value: stats.negotiationLeads,
      icon: <Clock className="h-6 w-6 text-secondary" />,
      color: 'bg-purple-50',
    },
    {
      title: 'Closed Deals',
      value: stats.closedLeads,
      icon: <CheckCircle className="h-6 w-6 text-success" />,
      color: 'bg-green-50',
    },
    {
      title: 'Lost Deals',
      value: stats.lostLeads,
      icon: <XCircle className="h-6 w-6 text-destructive" />,
      color: 'bg-red-50',
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
        
        <motion.div 
          className="bg-card rounded-lg shadow-sm border border-border p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Leads</h2>
            <Link to="/leads" className="text-sm text-primary hover:underline flex items-center">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded-md"></div>
                ))}
              </div>
            ) : leadsBySource.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No leads found</p>
                <Link to="/leads/new" className="text-primary hover:underline block mt-2">
                  Create your first lead
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Recent leads would go here */}
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Add your first leads to see them here</p>
                  <Link to="/leads/new" className="text-primary hover:underline block mt-2">
                    Create your first lead
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;