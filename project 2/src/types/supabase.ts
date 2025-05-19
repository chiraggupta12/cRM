export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string
          company: string | null
          position: string | null
          lead_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone: string
          company?: string | null
          position?: string | null
          lead_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          company?: string | null
          position?: string | null
          lead_id?: string | null
          user_id?: string
        }
      }
      leads: {
        Row: {
          id: string
          created_at: string
          title: string
          source: string
          status: string
          value: number | null
          description: string | null
          user_id: string
          assigned_to: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          source: string
          status: string
          value?: number | null
          description?: string | null
          user_id: string
          assigned_to?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          source?: string
          status?: string
          value?: number | null
          description?: string | null
          user_id?: string
          assigned_to?: string | null
        }
      }
      activities: {
        Row: {
          id: string
          created_at: string
          lead_id: string
          user_id: string
          type: string
          notes: string | null
          scheduled_at: string | null
          completed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          lead_id: string
          user_id: string
          type: string
          notes?: string | null
          scheduled_at?: string | null
          completed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          lead_id?: string
          user_id?: string
          type?: string
          notes?: string | null
          scheduled_at?: string | null
          completed?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}