import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Trash2, Plus, Loader2, User, Calendar, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Lead {
  id: string;
  title: string;
  source: string;
  status: string;
  value: number | null;
  description: string | null;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  position: string | null;
}

interface Activity {
  id: string;
  type: string;
  notes: string | null;
  scheduled_at: string | null;
  completed: boolean;
  created_at: string;
}

interface FormValues {
  title: string;
  source: string;
  status: string;
  value: string;
  description: string;
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
  const [contacts, setContacts] = useState<Contact[]>([]);
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
    'New',
    'Contacted',
    'Qualified',
    'Negotiation',
    'Closed',
    'Lost',
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

  useEffect(() => {
    if (!id || !user) return;
    
    const fetchLeadDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch lead
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (leadError) throw leadError;
        
        setLead(leadData);
        reset({
          title: leadData.title,
          source: leadData.source,
          status: leadData.status,
          value: leadData.value?.toString() || '',
          description: leadData.description || '',
        });
        
        // Fetch contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .eq('lead_id', id)
          .eq('user_id', user.id);
          
        if (contactsError) throw contactsError;
        
        setContacts(contactsData || []);
        
        // Fetch activities
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
          title: data.title,
          source: data.source,
          status: data.status,
          value: data.value ? parseFloat(data.value) : 0,
          description: data.description,
        })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      if (lead) {
        setLead({
          ...lead,
          title: data.title,
          source: data.source,
          status: data.status,
          value: data.value ? parseFloat(data.value) : 0,
          description: data.description,
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
      
      // Refresh activities
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
      case 'new':
        return 'badge-primary';
      case 'qualified':
        return 'badge-secondary';
      case 'negotiation':
        return 'badge-warning';
      case 'closed':
        return 'badge-success';
      case 'lost':
        return 'badge-destructive';
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
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 mr-2 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{lead.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${getStatusColor(lead.status)}`}>
              {lead.status}
            </span>
            <span className="text-sm text-muted-foreground">
              Created on {format(new Date(lead.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          className="bg-card rounded-lg shadow-sm border border-border col-span-1 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Lead Information</h2>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    className="input"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Source <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('source', { required: 'Source is required' })}
                    className="input"
                  >
                    <option value="">Select source</option>
                    {sources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                  {errors.source && (
                    <p className="mt-1 text-xs text-destructive">{errors.source.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Status <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('status', { required: 'Status is required' })}
                    className="input"
                  >
                    <option value="">Select status</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-xs text-destructive">{errors.status.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Value ($)
                  </label>
                  <input
                    type="number"
                    {...register('value')}
                    className="input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  className="input !h-full min-h-[180px]"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={deleteLead}
                className="btn btn-outline text-destructive hover:bg-destructive hover:text-white"
                disabled={saving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Lead
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
        
        <motion.div 
          className="space-y-6 lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              <Link to={`/contacts/new?leadId=${id}`} className="btn btn-sm btn-outline">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Link>
            </div>
            
            <div className="p-4">
              {contacts.length === 0 ? (
                <div className="text-center py-4">
                  <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No contacts added yet</p>
                  <Link to={`/contacts/new?leadId=${id}`} className="text-primary hover:underline text-sm block mt-1">
                    Add a contact
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {contacts.map(contact => (
                    <li key={contact.id} className="border border-border rounded-md p-3">
                      <Link to={`/contacts/${contact.id}`} className="block hover:bg-muted transition-colors -m-3 p-3">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                        {contact.phone && (
                          <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        )}
                        {(contact.company || contact.position) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {contact.position}{contact.position && contact.company ? ' at ' : ''}
                            {contact.company}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">Activities</h2>
              <button 
                onClick={() => setShowActivityForm(!showActivityForm)}
                className="btn btn-sm btn-outline"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
            
            {showActivityForm && (
              <div className="p-4 border-b border-border bg-muted/30">
                <form onSubmit={handleSubmitActivity(addActivity)} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Type <span className="text-destructive">*</span>
                    </label>
                    <select
                      {...registerActivity('type', { required: 'Type is required' })}
                      className="input"
                    >
                      <option value="">Select type</option>
                      {activityTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {activityErrors.type && (
                      <p className="mt-1 text-xs text-destructive">{activityErrors.type.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Notes
                    </label>
                    <textarea
                      {...registerActivity('notes')}
                      className="input min-h-[80px]"
                      placeholder="Activity details..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Scheduled Date
                    </label>
                    <input
                      type="datetime-local"
                      {...registerActivity('scheduled_at')}
                      className="input"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowActivityForm(false)}
                      className="btn btn-sm btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary"
                    >
                      Add Activity
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="p-4">
              {activities.length === 0 ? (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No activities recorded yet</p>
                  <button 
                    onClick={() => setShowActivityForm(true)}
                    className="text-primary hover:underline text-sm block mt-1 mx-auto"
                  >
                    Add an activity
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {activities.map(activity => (
                    <li key={activity.id} className="border border-border rounded-md p-3 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="badge badge-outline mr-2">{activity.type}</span>
                            {activity.completed && (
                              <span className="badge badge-success">Completed</span>
                            )}
                          </div>
                          
                          {activity.notes && (
                            <p className="text-sm mt-2">{activity.notes}</p>
                          )}
                          
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <span>Created: {format(new Date(activity.created_at), 'MMM d, yyyy')}</span>
                            {activity.scheduled_at && (
                              <span className="ml-3">
                                Due: {format(new Date(activity.scheduled_at), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleActivityCompletion(activity.id, activity.completed)}
                          className={`p-2 rounded-md ${
                            activity.completed 
                              ? 'bg-success/10 text-success hover:bg-success/20' 
                              : 'bg-muted text-muted-foreground hover:bg-muted/70'
                          } transition-colors`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LeadDetails;