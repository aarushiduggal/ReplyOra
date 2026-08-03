/**
 * Hand-authored Database types mirroring supabase/migrations/0001_init.sql.
 *
 * This is a stub so the Supabase client is strongly typed from Phase 0.
 * Once your Supabase project is linked, regenerate the real types with:
 *
 *   npm run gen:types        # supabase gen types typescript --linked > types/db.ts
 *
 * and delete this notice. Keep it in sync after every migration.
 */

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          plan: "free" | "starter" | "growth" | "pro";
          plan_status: "active" | "past_due" | "canceled";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          name?: string;
          slug: string;
          owner_id: string;
          plan?: string;
          plan_status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: Timestamp;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: string;
          created_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["workspace_members"]["Insert"]
        >;
        Relationships: [];
      };
      business_profiles: {
        Row: {
          workspace_id: string;
          industry: string | null;
          description: string | null;
          website: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          hours: Json | null;
          timezone: string | null;
          updated_at: Timestamp;
        };
        Insert: {
          workspace_id: string;
          industry?: string | null;
          description?: string | null;
          website?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          hours?: Json | null;
          timezone?: string | null;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["business_profiles"]["Insert"]
        >;
        Relationships: [];
      };
      knowledge_sources: {
        Row: {
          id: string;
          workspace_id: string;
          type: "text" | "faq" | "file" | "url" | "pricing" | "service";
          title: string | null;
          storage_path: string | null;
          status: "pending" | "processing" | "ready" | "failed";
          error: string | null;
          metadata: Json | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          type: string;
          title?: string | null;
          storage_path?: string | null;
          status?: string;
          error?: string | null;
          metadata?: Json | null;
          created_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["knowledge_sources"]["Insert"]
        >;
        Relationships: [];
      };
      knowledge_chunks: {
        Row: {
          id: string;
          workspace_id: string;
          source_id: string;
          content: string;
          embedding: string | null;
          token_count: number | null;
          metadata: Json | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          source_id: string;
          content: string;
          embedding?: string | null;
          token_count?: number | null;
          metadata?: Json | null;
          created_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["knowledge_chunks"]["Insert"]
        >;
        Relationships: [];
      };
      assistants: {
        Row: {
          id: string;
          workspace_id: string;
          public_key: string;
          name: string | null;
          tone: string | null;
          system_prompt: string | null;
          model: string | null;
          temperature: number | null;
          brand_color: string | null;
          welcome_message: string | null;
          suggested_questions: Json | null;
          lead_fields: Json | null;
          allowed_domains: string[] | null;
          status: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          public_key: string;
          name?: string | null;
          tone?: string | null;
          system_prompt?: string | null;
          model?: string | null;
          temperature?: number | null;
          brand_color?: string | null;
          welcome_message?: string | null;
          suggested_questions?: Json | null;
          lead_fields?: Json | null;
          allowed_domains?: string[] | null;
          status?: string | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["assistants"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          workspace_id: string;
          assistant_id: string | null;
          visitor_id: string | null;
          channel: string | null;
          page_url: string | null;
          status: "open" | "closed";
          started_at: Timestamp;
          last_message_at: Timestamp;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          assistant_id?: string | null;
          visitor_id?: string | null;
          channel?: string | null;
          page_url?: string | null;
          status?: string;
          started_at?: Timestamp;
          last_message_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["conversations"]["Insert"]
        >;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          workspace_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          citations: Json | null;
          tokens: number | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          workspace_id: string;
          role: string;
          content: string;
          citations?: Json | null;
          tokens?: number | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          workspace_id: string;
          conversation_id: string | null;
          name: string | null;
          email: string | null;
          phone: string | null;
          intent: string | null;
          qualification: Json | null;
          status: "new" | "qualified" | "booked" | "lost";
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          conversation_id?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          intent?: string | null;
          qualification?: Json | null;
          status?: string;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      usage_counters: {
        Row: {
          workspace_id: string;
          period_start: string;
          messages_used: number;
          leads_count: number;
        };
        Insert: {
          workspace_id: string;
          period_start: string;
          messages_used?: number;
          leads_count?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["usage_counters"]["Insert"]
        >;
        Relationships: [];
      };
      stripe_events: {
        Row: { id: string; type: string | null; processed_at: Timestamp };
        Insert: { id: string; type?: string | null; processed_at?: Timestamp };
        Update: Partial<
          Database["public"]["Tables"]["stripe_events"]["Insert"]
        >;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string | null;
          actor_id: string | null;
          action: string | null;
          target: string | null;
          metadata: Json | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          actor_id?: string | null;
          action?: string | null;
          target?: string | null;
          metadata?: Json | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_member: {
        Args: { p_workspace: string };
        Returns: boolean;
      };
      is_admin: {
        Args: { p_workspace: string };
        Returns: boolean;
      };
      match_chunks: {
        Args: {
          p_workspace: string;
          p_query: string;
          p_match_count?: number;
        };
        Returns: {
          content: string;
          similarity: number;
          metadata: Json;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
