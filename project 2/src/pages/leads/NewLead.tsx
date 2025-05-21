import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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

const NewLead: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

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

  const specializationOptions = [
    '',
    'Product Management',
    'Digital Marketing',
    'Cyber Security',
    'Data Science',
  ];

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase.from('leads').insert({
        user_id: user.id,
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
      
      if (error) throw error;
      
      toast.success('Lead created successfully');
      navigate('/leads');
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold">New Lead</h1>
          <p className="text-muted-foreground">Create a new sales lead</p>
        </div>
      </div>
      
      <motion.div 
        className="bg-card rounded-lg shadow-sm border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  {...register('full_name', { required: 'Full Name is required' })}
                  className="input"
                  placeholder="Lead full name"
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>
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
                  Revenue ($)
                </label>
                <input
                  type="number"
                  {...register('revenue')}
                  className="input"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="input"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone_number', { required: 'Phone Number is required' })}
                  className="input"
                />
                {errors.phone_number && (
                  <p className="mt-1 text-xs text-destructive">{errors.phone_number.message}</p>
                )}
              </div>
               
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  {...register('job_title')}
                  className="input"
                  placeholder="Job Title"
                />
              </div>
               
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Specialization
                </label>
                <select
                  {...register('specialization')}
                  className="input"
                >
                  {specializationOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Batch Date
                </label>
                <input
                  type="date"
                  {...register('batch_date')}
                  className="input"
                />
              </div>

            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Notes
              </label>
              <textarea
                {...register('notes')}
                className="input !h-full min-h-[220px]"
                placeholder="Enter additional details about this lead..."
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/leads')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Lead
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default NewLead;