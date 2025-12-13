/**
 * Service d'intégration avec le No-Code Architects Toolkit
 * API Documentation: https://tools.lecoach.digital
 */

// Configuration de l'API Toolkit
// Via nginx-proxy → ncat (avec HTTPS + Let's Encrypt + CORS)
const TOOLKIT_API_URL = 'https://tools.creavisuel.pro';
const TOOLKIT_API_KEY = 'ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs';

// Types pour les APIs du toolkit
export interface ToolkitJobResponse {
  job_id: string;
  job_status: 'queued' | 'running' | 'done' | 'failed';
  response?: any;
  message?: string;
  queue_length?: number;
  build_number?: string;
}

export interface ImageToVideoParams {
  image_url: string;
  // Note: duration et fps ne sont PAS acceptés par l'API (validation stricte)
  // L'API utilise des valeurs par défaut fixes
  webhook_url?: string;
  id?: string;
}

export interface CaptionVideoParams {
  video_url: string;
  captions: Array<{
    text: string;
    start_time: number; // en secondes
    end_time: number;
    position?: { x: number; y: number };
    style?: {
      font_size?: number;
      font_family?: string;
      color?: string;
      font_weight?: string;
      background_color?: string;
      border_color?: string;
      border_width?: number;
    };
  }>;
  webhook_url?: string;
  id?: string;
}

export interface CombineVideosParams {
  video_urls: Array<{ video_url: string }>;
  webhook_url?: string;
  id?: string;
}

export interface TrimVideoParams {
  video_url: string;
  start_time: number; // secondes
  end_time: number;
  webhook_url?: string;
  id?: string;
}

export interface ConcatenateMediaParams {
  media_urls: Array<{ media_url: string }>;
  webhook_url?: string;
  id?: string;
}

export interface MediaMetadataParams {
  media_url: string;
}

export interface UploadParams {
  file: File;
  path?: string;
}

/**
 * Service Toolkit API
 */
class ToolkitAPIService {
  private baseUrl: string;

  constructor(baseUrl: string = TOOLKIT_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Appel générique à l'API
   */
  private async callApi<T>(endpoint: string, params: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TOOLKIT_API_KEY,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Toolkit API Error: ${error}`);
    }

    return response.json();
  }

  /**
   * 1. Convertir une image en vidéo
   */
  async imageToVideo(params: ImageToVideoParams): Promise<ToolkitJobResponse> {
    return this.callApi('/image-to-video', params);
  }

  /**
   * 2. Ajouter des sous-titres/texte sur une vidéo
   */
  async captionVideo(params: CaptionVideoParams): Promise<ToolkitJobResponse> {
    return this.callApi('/caption-video', params);
  }

  /**
   * 3. Combiner plusieurs vidéos
   */
  async combineVideos(params: CombineVideosParams): Promise<ToolkitJobResponse> {
    return this.callApi('/combine-videos', params);
  }

  /**
   * 4. Découper une vidéo
   */
  async trimVideo(params: TrimVideoParams): Promise<ToolkitJobResponse> {
    return this.callApi('/v1/video/trim', params);
  }

  /**
   * 5. Concaténer des médias
   */
  async concatenateMedia(params: ConcatenateMediaParams): Promise<ToolkitJobResponse> {
    return this.callApi('/concatenate', params);
  }

  /**
   * 6. Obtenir les métadonnées d'un média
   */
  async getMediaMetadata(params: MediaMetadataParams): Promise<any> {
    return this.callApi('/metadata', params);
  }

  /**
   * 7. Vérifier le statut d'un job
   */
  async getJobStatus(jobId: string): Promise<ToolkitJobResponse> {
    return this.callApi('/v1/toolkit/job/status', { job_id: jobId });
  }

  /**
   * 8. Convertir média en MP3
   */
  async mediaToMp3(params: { media_url: string; webhook_url?: string; id?: string }): Promise<ToolkitJobResponse> {
    return this.callApi('/media-to-mp3', params);
  }

  /**
   * 9. Extraire les frames clés d'une vidéo
   */
  async extractKeyframes(params: { video_url: string; interval?: number; webhook_url?: string; id?: string }): Promise<ToolkitJobResponse> {
    return this.callApi('/extract-keyframes', params);
  }

  /**
   * 10. Mélanger plusieurs pistes audio
   */
  async mixAudio(params: { audio_urls: Array<{ audio_url: string; volume?: number }>; webhook_url?: string; id?: string }): Promise<ToolkitJobResponse> {
    return this.callApi('/audio-mixing', params);
  }

  /**
   * 11. Générer une miniature à partir d'une vidéo
   */
  async generateThumbnail(params: { video_url: string; time?: number; webhook_url?: string; id?: string }): Promise<ToolkitJobResponse> {
    return this.callApi('/thumbnail', params);
  }

  /**
   * 12. Transcrire un média (audio/vidéo)
   */
  async transcribeMedia(params: { media_url: string; language?: string; webhook_url?: string; id?: string }): Promise<ToolkitJobResponse> {
    return this.callApi('/media-transcribe', params);
  }

  /**
   * 13. Télécharger un fichier depuis une URL
   */
  async downloadFile(params: { url: string; webhook_url?: string; id?: string }): Promise<ToolkitJobResponse> {
    return this.callApi('/download', params);
  }

  /**
   * 14. Capturer une page web en image
   */
  async screenshotWebpage(params: { url: string; width?: number; height?: number; webhook_url?: string; id?: string }): Promise<ToolkitJobResponse> {
    return this.callApi('/screenshot-webpage', params);
  }

  /**
   * Helper: Attendre qu'un job soit terminé
   */
  async waitForJob(jobId: string, maxAttempts: number = 60, intervalMs: number = 2000): Promise<ToolkitJobResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getJobStatus(jobId);

      if (status.job_status === 'done') {
        return status;
      }

      if (status.job_status === 'failed') {
        throw new Error(`Job failed: ${status.message}`);
      }

      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Job timeout: took too long to complete');
  }
}

// Export singleton
export const toolkitApi = new ToolkitAPIService();
export default toolkitApi;
