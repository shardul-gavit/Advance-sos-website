import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MediaPlayerProps {
  media: {
    id: string;
    file_name: string;
    file_url: string;
    file_type: 'image' | 'video' | 'audio';
    file_size: number;
    duration?: number;
  };
  onClose?: () => void;
  showControls?: boolean;
  autoPlay?: boolean;
  className?: string;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  media,
  onClose,
  showControls = true,
  autoPlay = false,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    const handleLoadedMetadata = () => {
      setDuration(mediaElement.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(mediaElement.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Failed to load media');
      setIsLoading(false);
    };

    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('ended', handleEnded);
    mediaElement.addEventListener('error', handleError);

    return () => {
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('ended', handleEnded);
      mediaElement.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = () => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    if (isPlaying) {
      mediaElement.pause();
    } else {
      mediaElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    mediaElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    mediaElement.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    mediaElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = media.file_url;
    link.download = media.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (error) {
    return (
      <Card className={`bg-red-500/10 border-red-500/50 ${className}`}>
        <CardContent className="p-4 text-center">
          <div className="text-red-400 mb-2">⚠️ Media Error</div>
          <div className="text-sm text-gray-400">{error}</div>
          {onClose && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="mt-2"
            >
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (media.file_type === 'image') {
    return (
      <Card className={`bg-black/50 border-cyan-400/50 ${className}`}>
        <CardContent className="p-0 relative">
          {showControls && onClose && (
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={downloadMedia}
                className="bg-black/50 text-white border-white/20 hover:bg-black/70"
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="bg-black/50 text-white border-white/20 hover:bg-black/70"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          <img
            src={media.file_url}
            alt={media.file_name}
            className="w-full h-auto max-h-96 object-contain rounded-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => setError('Failed to load image')}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-black/50 border-cyan-400/50 ${className}`} ref={containerRef}>
      <CardContent className="p-0 relative">
        {showControls && onClose && (
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={downloadMedia}
              className="bg-black/50 text-white border-white/20 hover:bg-black/70"
            >
              <Download className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="bg-black/50 text-white border-white/20 hover:bg-black/70"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {media.file_type === 'video' ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={media.file_url}
            className="w-full h-auto max-h-96 object-contain rounded-lg"
            autoPlay={autoPlay}
            muted={isMuted}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={() => setIsLoading(false)}
            onError={() => setError('Failed to load video')}
          />
        ) : (
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={media.file_url}
            autoPlay={autoPlay}
            muted={isMuted}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={() => setIsLoading(false)}
            onError={() => setError('Failed to load audio')}
          />
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        )}

        {showControls && (media.file_type === 'video' || media.file_type === 'audio') && (
          <div className="p-4 space-y-3">
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-12">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-gray-400 w-12">
                {formatTime(duration)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={togglePlay}
                  className="bg-cyan-500/20 text-cyan-300 border-cyan-400 hover:bg-cyan-500/30"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleMute}
                    className="bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-gray-500/30"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {media.file_type === 'video' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleFullscreen}
                    className="bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-gray-500/30"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* File Info */}
            <div className="text-xs text-gray-400">
              {media.file_name} • {formatFileSize(media.file_size)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 