import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.lecoach.digital';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
