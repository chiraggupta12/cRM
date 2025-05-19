import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Trash2, Plus, Loader2, User, Calendar, Check, Phone, Mail, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Lead {
  id: string;
  created_at: string;
  user_id: string;
  academic_councellor: string | null;
  full_name: string;
  source: string;
  status: string;
  revenue: number | null;
  notes: string | null;
  email: string;
  phone_number: string;
  name: string;
  specialization: string | null;
  batch_date: string | null;
  job_title: string | null;
}

interface Activity {
  id: string;
  lead_id: string;
  user_id: string;
  type: string;
  notes: string | null;
  scheduled_at: string | null;
  completed: boolean;
  created_at: string;
}

interface FormValues {
  full_name: string;
  source: string;
  status: string;
  revenue: string;
  notes: string;
  email: string;
  phone_number: string;
  specialization: string;
  batch_date: string;
  job_title: string;
}

interface ActivityFormValues {
  type: string;
  notes: string;
  scheduled_at: string;
}

const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();
  
  const {
    register: registerActivity,
    handleSubmit: handleSubmitActivity,
    reset: resetActivity,
    formState: { errors: activityErrors },
  } = useForm<ActivityFormValues>();

  const sources = [
    'Website',
    'Referral',
    'LinkedIn',
    'Email Campaign',
    'Facebook',
    'Google',
    'Conference',
    'Other',
  ];

  const statuses = [
    'New Lead',
    'Junk Lead',
    'Prospecting',
    'Qualified',
    'Paid',
    'Lost Lead',
    'Postpone',
  ];
  
  const activityTypes = [
    'Call',
    'Email',
    'Meeting',
    'Demo',
    'Proposal',
    'Follow-up',
    'Other',
  ];

  const specializationOptions = [
    '',
    'Product Management',
    'Digital Marketing',
    'Cyber Security',
    'Data Science',
  ];

  useEffect(() => {
    if (!id || !user) return;
    
    const fetchLeadDetails = async () => {
      try {
        setLoading(true);
        
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (leadError) throw leadError;
        
        setLead(leadData);
        reset({
          full_name: leadData.full_name,
          source: leadData.source,
          status: leadData.status,
          revenue: leadData.revenue?.toString() || '',
          notes: leadData.notes || '',
          email: leadData.email || '',
          phone_number: leadData.phone_number || '',
          specialization: leadData.specialization || '',
          batch_date: leadData.batch_date || '',
          job_title: leadData.job_title || '',
        });
        
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .eq('lead_id', id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (activitiesError) throw activitiesError;
        
        setActivities(activitiesData || []);
      } catch (error) {
        console.error('Error fetching lead details:', error);
        toast.error('Failed to load lead details');
        navigate('/leads');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeadDetails();
  }, [id, user, reset, navigate]);

  const onSubmit = async (data: FormValues) => {
    if (!id || !user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('leads')
        .update({
          full_name: data.full_name,
          source: data.source,
          status: data.status,
          revenue: data.revenue ? parseFloat(data.revenue) : null,
          notes: data.notes,
          email: data.email,
          phone_number: data.phone_number,
          specialization: data.specialization || null,
          batch_date: data.batch_date || null,
          job_title: data.job_title || null,
        })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      if (lead) {
        setLead({
          ...lead,
          full_name: data.full_name,
          source: data.source,
          status: data.status,
          revenue: data.revenue ? parseFloat(data.revenue) : null,
          notes: data.notes,
          email: data.email,
          phone_number: data.phone_number,
          specialization: data.specialization || null,
          batch_date: data.batch_date || null,
          job_title: data.job_title || null,
        });
      }
      
      toast.success('Lead updated successfully');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const deleteLead = async () => {
    if (!id || !user) return;
    
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast.success('Lead deleted successfully');
      navigate('/leads');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    } finally {
      setSaving(false);
    }
  };
  
  const addActivity = async (data: ActivityFormValues) => {
    if (!id || !user) return;
    
    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          lead_id: id,
          user_id: user.id,
          type: data.type,
          notes: data.notes,
          scheduled_at: data.scheduled_at || null,
          completed: false,
        });
        
      if (error) throw error;
      
      const { data: newActivities, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      setActivities(newActivities || []);
      resetActivity();
      setShowActivityForm(false);
      toast.success('Activity added successfully');
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to add activity');
    }
  };
  
  const toggleActivityCompletion = async (activityId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ completed: !completed })
        .eq('id', activityId)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      setActivities(
        activities.map(activity => 
          activity.id === activityId 
            ? { ...activity, completed: !completed } 
            : activity
        )
      );
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Failed to update activity');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new lead':
        return 'badge-outline';
      case 'junk lead':
        return 'badge-destructive';
      case 'prospecting':
        return 'badge-warning';
      case 'qualified':
        return 'badge-warning';
      case 'paid':
        return 'badge-success';
      case 'lost lead':
        return 'badge-destructive';
      case 'postpone':
        return 'badge-primary';
      default:
        return 'badge-outline';
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 mr-2 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Lead Details</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 mr-2 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Lead Not Found</h1>
            <p className="text-muted-foreground">The requested lead could not be found</p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 text-center">
          <p className="mb-4">This lead might have been deleted or you don't have permission to view it.</p>
          <Link to="/leads" className="btn btn-primary">
            Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header Section with Lead Info */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link to="/leads" className="btn btn-ghost btn-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Link>
            <h1 className="text-2xl font-bold">{lead.full_name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </button>
            <button
              onClick={deleteLead}
              disabled={saving}
              className="btn btn-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Lead
            </button>
          </div>
        </div>

        {/* Lead Status and Info Bar */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                lead.status === 'New Lead' ? 'bg-blue-100 text-blue-800' :
                lead.status === 'Junk Lead' ? 'bg-red-100 text-red-800' :
                lead.status === 'Prospecting' ? 'bg-yellow-100 text-yellow-800' :
                lead.status === 'Qualified' ? 'bg-orange-100 text-orange-800' :
                lead.status === 'Paid' ? 'bg-green-100 text-green-800' :
                lead.status === 'Lost Lead' ? 'bg-red-100 text-red-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {lead.status}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created: {format(new Date(lead.created_at), 'MMM d, yyyy')}
              </div>
              {lead.batch_date && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Batch: {format(new Date(lead.batch_date), 'MMM d, yyyy')}
                </div>
              )}
              {lead.specialization && (
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  {lead.specialization}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              {lead.phone_number && (
                <a
                  href={`tel:${lead.phone_number}`}
                  className="btn btn-outline btn-sm"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </a>
              )}
              {lead.phone_number && (
                <a
                  href={`https://wa.me/${lead.phone_number.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  WhatsApp
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="btn btn-outline btn-sm"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Lead Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information Group */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('full_name', { required: 'Full name is required' })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors.full_name && (
                      <p className="text-destructive text-sm mt-1">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('email', { required: 'Email is required' })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors.email && (
                      <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Phone Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register('phone_number', { required: 'Phone number is required' })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors.phone_number && (
                      <p className="text-destructive text-sm mt-1">{errors.phone_number.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      {...register('job_title')}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Lead Details Group */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Source <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('source', { required: 'Source is required' })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors.source && (
                      <p className="text-destructive text-sm mt-1">{errors.source.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Status <span className="text-destructive">*</span>
                    </label>
                    <select
                      {...register('status', { required: 'Status is required' })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {errors.status && (
                      <p className="text-destructive text-sm mt-1">{errors.status.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Revenue (₹)
                    </label>
                    <input
                      type="number"
                      {...register('revenue')}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Specialization
                    </label>
                    <select
                      {...register('specialization')}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {specializationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option || 'Select Specialization'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              <textarea
                {...register('notes')}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px]"
                placeholder="Add notes about this lead..."
              />
            </div>
          </div>

          {/* Activities Section */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Activities</h2>
                <button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="btn btn-ghost btn-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </button>
              </div>

              {showActivityForm && (
                <form onSubmit={handleSubmitActivity(addActivity)} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Activity Type <span className="text-destructive">*</span>
                    </label>
                    <select
                      {...registerActivity('type', { required: 'Activity type is required' })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {activityTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {activityErrors.type && (
                      <p className="text-destructive text-sm mt-1">{activityErrors.type.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Notes <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      {...registerActivity('notes', { required: 'Notes are required' })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                    />
                    {activityErrors.notes && (
                      <p className="text-destructive text-sm mt-1">{activityErrors.notes.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Scheduled Date <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...registerActivity('scheduled_at', { required: 'Scheduled date is required' })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {activityErrors.scheduled_at && (
                      <p className="text-destructive text-sm mt-1">{activityErrors.scheduled_at.message}</p>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary w-full">
                    Add Activity
                  </button>
                </form>
              )}

              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{activity.type}</h3>
                        <button
                          onClick={() => toggleActivityCompletion(activity.id, !activity.completed)}
                          className={`btn btn-sm ${
                            activity.completed ? 'btn-success' : 'btn-ghost'
                          }`}
                        >
                          {activity.completed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Calendar className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{activity.notes}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(activity.scheduled_at || activity.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetails;