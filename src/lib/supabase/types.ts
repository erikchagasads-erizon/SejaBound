/**
 * Type helpers for Supabase query results.
 * Supabase's generic inference can struggle with complex joins/selects
 * in Server Components. These types let us annotate results explicitly.
 */

export interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'collaborator' | 'client';
  preferred_lang: string;
  theme: string;
  created_at: string;
}

export interface ClientRow {
  id: string;
  name: string;
  logo_url: string | null;
  company: string | null;
  primary_color: string | null;
  contact_email: string | null;
  created_by: string;
  created_at: string;
}

export interface ClientUserRow {
  id: string;
  client_id: string;
  profile_id: string;
}

export interface KanbanColumnRow {
  id: string;
  name: string;
  color: string | null;
  position: number;
  is_final: boolean;
  created_by: string;
  created_at: string;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  type: string;
  client_id: string;
  column_id: string;
  assignee_id: string | null;
  due_date: string | null;
  priority: string;
  sprint_week: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskActivityRow {
  id: string;
  task_id: string;
  actor_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface DeliveryRow {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'revision_requested';
  client_feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_by: string;
  created_at: string;
}

export interface DeliveryFileRow {
  id: string;
  delivery_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface BriefingRow {
  id: string;
  client_id: string;
  submitted_by: string;
  title: string;
  description: string;
  category: string | null;
  attachments: unknown;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
}

export interface ReportRow {
  id: string;
  client_id: string;
  title: string;
  period_start: string | null;
  period_end: string | null;
  data: unknown;
  created_by: string;
  created_at: string;
}
