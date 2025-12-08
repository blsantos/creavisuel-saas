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
    if (!user || !isSupabaseConfigured() || !supabase) {
      console.error('User must be authenticated and Supabase configured to upload files');
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  return {
    uploadMedia,
    isUploading,
  };
};
