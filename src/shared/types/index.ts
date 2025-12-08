/* ===================================================
   CréaVisuel SaaS - Types Index
   Centralized export of all type definitions
   ================================================= */

// Tenant types
export type {
  Tenant,
  TenantBranding,
  AIConfig,
  PWAConfig,
  TenantConfig,
  TenantWithConfig,
  PricingPlan,
} from './tenant';

// Content types
export type {
  ContentType,
  ContentPlatform,
  ContentMetadata,
  ContentLibraryItem,
  TemplateCategory,
  FormField,
  FormSchema,
  Template,
  TemplateFormData,
  GeneratedContent,
} from './content';

// Automation types
export type {
  AutomationFrequency,
  AutomationStatus,
  AutomationSchedule,
  RunStatus,
  AutomationRun,
  AutomationStatistics,
} from './automation';

// Tools types
export type {
  ToolCategory,
  ToolCatalog,
  TenantToolAccess,
  TenantToolAccessWithTool,
  TokenUsage,
  TokenUsageStatistics,
} from './tools';
