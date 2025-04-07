// Supabase database types generated by CLI
// We'll likely refine these and generate them properly later

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // User Profiles Table (extends auth.users)
      profiles: {
        Row: {
          id: string; // UUID corresponding to auth.users.id
          updated_at: string | null;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string; // Must match auth.users.id
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      // Loops Table (Journal Entries)
      loops: {
        Row: {
          id: string; // UUID primary key
          user_id: string; // Foreign key to profiles.id
          created_at: string;
          updated_at: string | null;
          content: string;
          summary: string | null;
          sentiment_score: number | null; // Example: -1.0 to 1.0
        };
        Insert: {
          id?: string; // Defaults to gen_random_uuid()
          user_id: string;
          created_at?: string; // Defaults to now()
          updated_at?: string | null;
          content: string;
          summary?: string | null;
          sentiment_score?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string | null;
          content?: string;
          summary?: string | null;
          sentiment_score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "loops_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // Tasks Table
      tasks: {
        Row: {
          id: string; // UUID primary key
          user_id: string; // Foreign key to profiles.id
          loop_id: string; // Foreign key to loops.id
          created_at: string;
          description: string;
          is_completed: boolean;
          due_date: string | null;
        };
        Insert: {
          id?: string; // Defaults to gen_random_uuid()
          user_id: string;
          loop_id: string;
          created_at?: string; // Defaults to now()
          description: string;
          is_completed?: boolean; // Defaults to false
          due_date?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          loop_id?: string;
          created_at?: string;
          description?: string;
          is_completed?: boolean;
          due_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_loop_id_fkey";
            columns: ["loop_id"];
            referencedRelation: "loops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      // Placeholder
      [_ in never]: never;
    };
    Functions: {
      // Placeholder
      [_ in never]: never;
    };
    Enums: {
      // Placeholder
      [_ in never]: never;
    };
    CompositeTypes: {
      // Placeholder
      [_ in never]: never;
    };
  };
}

// Type helpers for cleaner usage (optional but recommended)
type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
// ... add more helpers as needed for Insert, Update types etc.
