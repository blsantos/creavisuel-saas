import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/shared/integrations/supabase/client';
import { useAuth } from '@/shared/contexts/AuthContext';

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const uploadMedia = useCallback(async (
    file: File,
    conversationId: string
  ): Promise<string | null> => {
    console.log('🔍 useMediaUpload - Starting upload:', {
      fileName: file.name,
      conversationId,
      hasUser: !!user,
      isConfigured: isSupabaseConfigured(),
      hasSupabase: !!supabase
    });

    if (!user) {
      console.error('❌ No user authenticated');
      return null;
    }

    if (!isSupabaseConfigured()) {
      console.error('❌ Supabase not configured');
      return null;
    }

    if (!supabase) {
      console.error('❌ Supabase client not available');
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;

      console.log('📁 Uploading to path:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ File uploaded successfully');

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      console.log('🔗 Public URL:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('❌ Error uploading media:', error);
      return null;
    } finally {
      setIsUploading(false);
      console.log('🏁 Upload process completed');
    }
  }, [user]);

  return {
    uploadMedia,
    isUploading,
  };
};
