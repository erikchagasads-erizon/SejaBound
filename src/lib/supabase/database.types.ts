export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'collaborator' | 'client'
export type TaskType = 'design' | 'social_media' | 'traffic' | 'content' | 'web' | 'video' | 'photo' | 'report' | 'other'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type DeliveryStatus = 'pending' | 'approved' | 'revision_requested'
export type BriefingStatus = 'open' | 'in_progress' | 'closed'
export type EmailStatus = 'sent' | 'failed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          preferred_lang: string
          theme: string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          preferred_lang?: string
          theme?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          preferred_lang?: string
          theme?: string
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          company: string | null
          primary_color: string | null
          contact_email: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          company?: string | null
          primary_color?: string | null
          contact_email?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          company?: string | null
          primary_color?: string | null
          contact_email?: string | null
          created_by?: string
          created_at?: string
        }
      }
      client_users: {
        Row: {
          id: string
          client_id: string
          profile_id: string
        }
        Insert: {
          id?: string
          client_id: string
          profile_id: string
        }
        Update: {
          id?: string
          client_id?: string
          profile_id?: string
        }
      }
      collaborator_clients: {
        Row: {
          id: string
          collaborator_id: string
          client_id: string
        }
        Insert: {
          id?: string
          collaborator_id: string
          client_id: string
        }
        Update: {
          id?: string
          collaborator_id?: string
          client_id?: string
        }
      }
      kanban_columns: {
        Row: {
          id: string
          name: string
          color: string | null
          position: number
          is_final: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          position: number
          is_final?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string | null
          position?: number
          is_final?: boolean
          created_by?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          type: TaskType
          client_id: string
          column_id: string
          assignee_id: string | null
          due_date: string | null
          priority: TaskPriority
          sprint_week: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type?: TaskType
          client_id: string
          column_id: string
          assignee_id?: string | null
          due_date?: string | null
          priority?: TaskPriority
          sprint_week?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: TaskType
          client_id?: string
          column_id?: string
          assignee_id?: string | null
          due_date?: string | null
          priority?: TaskPriority
          sprint_week?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      task_activity: {
        Row: {
          id: string
          task_id: string
          actor_id: string
          action: string
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          actor_id: string
          action: string
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          actor_id?: string
          action?: string
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
      }
      task_labels: {
        Row: {
          id: string
          task_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      deliveries: {
        Row: {
          id: string
          task_id: string
          title: string
          description: string | null
          status: DeliveryStatus
          client_feedback: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          title: string
          description?: string | null
          status?: DeliveryStatus
          client_feedback?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          title?: string
          description?: string | null
          status?: DeliveryStatus
          client_feedback?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_by?: string
          created_at?: string
        }
      }
      delivery_files: {
        Row: {
          id: string
          delivery_id: string
          file_name: string
          file_url: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          delivery_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          delivery_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string
          created_at?: string
        }
      }
      briefings: {
        Row: {
          id: string
          client_id: string
          submitted_by: string
          title: string
          description: string
          category: string | null
          attachments: Json
          status: BriefingStatus
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          submitted_by: string
          title: string
          description: string
          category?: string | null
          attachments?: Json
          status?: BriefingStatus
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          submitted_by?: string
          title?: string
          description?: string
          category?: string | null
          attachments?: Json
          status?: BriefingStatus
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          client_id: string
          title: string
          period_start: string | null
          period_end: string | null
          data: Json
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          period_start?: string | null
          period_end?: string | null
          data?: Json
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          period_start?: string | null
          period_end?: string | null
          data?: Json
          created_by?: string
          created_at?: string
        }
      }
      email_notifications: {
        Row: {
          id: string
          recipient_id: string
          template: string | null
          subject: string | null
          sent_at: string
          status: EmailStatus
        }
        Insert: {
          id?: string
          recipient_id: string
          template?: string | null
          subject?: string | null
          sent_at?: string
          status?: EmailStatus
        }
        Update: {
          id?: string
          recipient_id?: string
          template?: string | null
          subject?: string | null
          sent_at?: string
          status?: EmailStatus
        }
      }
      dna_briefing_submissions: {
        Row: {
          id: string
          problema_real: string
          clientes_atuais: string
          objecao_venda: string
          ticket_medio: string
          meta_faturamento: string
          concorrentes: string
          diferencial: string
          founder_story: string
          marketing_anterior: string
          submitted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          problema_real: string
          clientes_atuais: string
          objecao_venda: string
          ticket_medio: string
          meta_faturamento: string
          concorrentes: string
          diferencial: string
          founder_story: string
          marketing_anterior: string
          submitted_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          problema_real?: string
          clientes_atuais?: string
          objecao_venda?: string
          ticket_medio?: string
          meta_faturamento?: string
          concorrentes?: string
          diferencial?: string
          founder_story?: string
          marketing_anterior?: string
          submitted_at?: string
          created_at?: string
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
      user_role: UserRole
      task_type: TaskType
      task_priority: TaskPriority
      delivery_status: DeliveryStatus
      briefing_status: BriefingStatus
      email_status: EmailStatus
    }
  }
}
