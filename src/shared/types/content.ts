/* ===================================================
   CréaVisuel SaaS - Content Types
   Content library and template type definitions
   ================================================= */

export type ContentType = 'post' | 'image' | 'video' | 'audio' | 'document';

export type ContentPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'other';

export interface ContentMetadata {
  platform?: ContentPlatform[];
  campaign?: string;
  tags?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // For video/audio in seconds
  fileSize?: number; // In bytes
  format?: string; // e.g., 'mp4', 'jpg', 'mp3'
  generatedBy?: 'ai' | 'manual' | 'template';
}

export interface ContentLibraryItem {
  id: string;
  tenant_id: string;
  user_id?: string;
  type: ContentType;
  title: string;
  content?: string; // Caption/text content
  media_url?: string; // URL to Supabase Storage
  thumbnail_url?: string;
  metadata: ContentMetadata;
  template_id?: string;
  published_to?: ContentPlatform[];
  is_archived: boolean;
  created_at: string;
  updated_at?: string;
}

export type TemplateCategory =
  | 'social_post'
  | 'blog'
  | 'email'
  | 'image'
  | 'video'
  | 'audio'
  | 'custom';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'file';
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  options?: { label: string; value: string }[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormSchema {
  fields: FormField[];
  submitLabel?: string;
}

export interface Template {
  id: string;
  tenant_id?: string; // Null if global template
  name: string;
  description?: string;
  category: TemplateCategory;
  prompt_template: string; // e.g., "Create a {tone} post about {topic} for {platform}"
  form_schema: FormSchema; // JSON Schema for dynamic form
  is_global: boolean; // Available to all tenants
  is_premium: boolean; // Requires premium plan
  thumbnail_url?: string;
  usage_count: number;
  created_at: string;
  updated_at?: string;
}

export interface TemplateFormData {
  [key: string]: string | number | File;
}

export interface GeneratedContent {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  metadata?: ContentMetadata;
}
