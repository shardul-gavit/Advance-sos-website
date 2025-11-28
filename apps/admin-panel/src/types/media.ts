export type MediaType = 'image' | 'video' | 'audio';

export interface Media {
  id: string;
  sos_id: string | null;
  sos_event_id: string | null;
  user_id: string;
  chunk_url: string | null;
  timestamp: string | null;
  chunk_sequence: number | null;
  file_size_bytes: number | null;
  camera_type: string | null;
  is_uploaded: boolean | null;
  created_at: string;
  media_data: any | null;
  chunk_number: number | null;
  chunk_size: number | null;
  file_url: string | null;
  media_type: string | null;
  metadata: any | null;
  user?: {
    name: string;
    email: string;
  };
  sos_event?: {
    emergency_type: string;
    status: string;
  };
  // Legacy fields for backward compatibility
  file_name?: string;
  file_type?: MediaType;
  file_size?: number;
  duration?: number | null;
}

export interface MediaUpload {
  file: File;
  sos_event_id: string;
  user_id: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (media: Media) => void;
  onError?: (error: string) => void;
}

export interface MediaFilters {
  file_type?: MediaType[];
  sos_event_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface MediaStats {
  total: number;
  byType: Record<MediaType, number>;
  totalSize: number;
  avgFileSize: number;
}

export interface VideoPlayerConfig {
  autoplay: boolean;
  controls: boolean;
  muted: boolean;
  loop: boolean;
  preload: 'auto' | 'metadata' | 'none';
}

export interface AudioPlayerConfig {
  autoplay: boolean;
  controls: boolean;
  muted: boolean;
  loop: boolean;
  preload: 'auto' | 'metadata' | 'none';
}

export interface ImageViewerConfig {
  zoom: boolean;
  fullscreen: boolean;
  download: boolean;
  share: boolean;
}

export interface MediaGalleryConfig {
  layout: 'grid' | 'list';
  columns: number;
  showThumbnails: boolean;
  showFileInfo: boolean;
  enableDownload: boolean;
  enableDelete: boolean;
}

export interface MediaCompressionConfig {
  images: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    format: 'jpeg' | 'webp' | 'png';
  };
  videos: {
    maxWidth: number;
    maxHeight: number;
    bitrate: number;
    format: 'mp4' | 'webm';
  };
  audio: {
    bitrate: number;
    format: 'mp3' | 'aac';
  };
}

export interface StorageBucket {
  name: string;
  public: boolean;
  allowedMimeTypes: string[];
  maxFileSize: number;
  compression: MediaCompressionConfig;
}

export const STORAGE_BUCKETS: Record<string, StorageBucket> = {
  'media-images': {
    name: 'media-images',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    compression: {
      images: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'webp',
      },
      videos: {
        maxWidth: 1920,
        maxHeight: 1080,
        bitrate: 2000000,
        format: 'mp4',
      },
      audio: {
        bitrate: 128000,
        format: 'mp3',
      },
    },
  },
  'media-videos': {
    name: 'media-videos',
    public: true,
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    compression: {
      images: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'webp',
      },
      videos: {
        maxWidth: 1920,
        maxHeight: 1080,
        bitrate: 2000000,
        format: 'mp4',
      },
      audio: {
        bitrate: 128000,
        format: 'mp3',
      },
    },
  },
  'media-audio': {
    name: 'media-audio',
    public: true,
    allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    compression: {
      images: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'webp',
      },
      videos: {
        maxWidth: 1920,
        maxHeight: 1080,
        bitrate: 2000000,
        format: 'mp4',
      },
      audio: {
        bitrate: 128000,
        format: 'mp3',
      },
    },
  },
};

export const DEFAULT_VIDEO_CONFIG: VideoPlayerConfig = {
  autoplay: false,
  controls: true,
  muted: true,
  loop: false,
  preload: 'metadata',
};

export const DEFAULT_AUDIO_CONFIG: AudioPlayerConfig = {
  autoplay: false,
  controls: true,
  muted: false,
  loop: false,
  preload: 'metadata',
};

export const DEFAULT_IMAGE_CONFIG: ImageViewerConfig = {
  zoom: true,
  fullscreen: true,
  download: true,
  share: true,
};

export const DEFAULT_GALLERY_CONFIG: MediaGalleryConfig = {
  layout: 'grid',
  columns: 4,
  showThumbnails: true,
  showFileInfo: true,
  enableDownload: true,
  enableDelete: false,
}; 