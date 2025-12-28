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
      family_members: {
        Row: {
          id: string
          name: string
          initials: string
          color: string
          email: string | null
          push_subscription: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          initials: string
          color: string
          email?: string | null
          push_subscription?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          initials?: string
          color?: string
          email?: string | null
          push_subscription?: Json | null
          created_at?: string
        }
      }
      chores: {
        Row: {
          id: string
          name: string
          frequency: 'daily' | 'weekly' | 'every_other_day'
          eligible_member_ids: string[]
          current_member_idx: number
          token_value: number
          linked_chore_id: string | null
          delegated_to: string | null
          delegation_note: string | null
          last_completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          frequency: 'daily' | 'weekly' | 'every_other_day'
          eligible_member_ids: string[]
          current_member_idx?: number
          token_value?: number
          linked_chore_id?: string | null
          delegated_to?: string | null
          delegation_note?: string | null
          last_completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          frequency?: 'daily' | 'weekly' | 'every_other_day'
          eligible_member_ids?: string[]
          current_member_idx?: number
          token_value?: number
          linked_chore_id?: string | null
          delegated_to?: string | null
          delegation_note?: string | null
          last_completed_at?: string | null
          created_at?: string
        }
      }
      chore_completions: {
        Row: {
          id: string
          chore_id: string
          member_id: string
          completed_at: string
          date: string
        }
        Insert: {
          id?: string
          chore_id: string
          member_id: string
          completed_at?: string
          date: string
        }
        Update: {
          id?: string
          chore_id?: string
          member_id?: string
          completed_at?: string
          date?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          assigned_to: string
          due_date: string | null
          completed: boolean
          completed_at: string | null
          note: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          title: string
          assigned_to: string
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          note?: string | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          title?: string
          assigned_to?: string
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          note?: string | null
          created_at?: string
          created_by?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          datetime: string | null
          all_day: boolean
          member_ids: string[]
          recurring: string | null
          recurring_end: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          datetime?: string | null
          all_day?: boolean
          member_ids: string[]
          recurring?: string | null
          recurring_end?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          datetime?: string | null
          all_day?: boolean
          member_ids?: string[]
          recurring?: string | null
          recurring_end?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      presence: {
        Row: {
          id: string
          member_id: string
          date: string
          morning: boolean
          afternoon: boolean
          evening: boolean
          note: string | null
        }
        Insert: {
          id?: string
          member_id: string
          date: string
          morning?: boolean
          afternoon?: boolean
          evening?: boolean
          note?: string | null
        }
        Update: {
          id?: string
          member_id?: string
          date?: string
          morning?: boolean
          afternoon?: boolean
          evening?: boolean
          note?: string | null
        }
      }
      tokens: {
        Row: {
          id: string
          member_id: string
          amount: number
          reason: string
          chore_completion_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          amount: number
          reason: string
          chore_completion_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          amount?: number
          reason?: string
          chore_completion_id?: string | null
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          name: string
          cost: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          cost: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          cost?: number
          active?: boolean
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
