import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, Video, Music, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface MediaUploadProps {
  sosEventId: string;
  userId: string;
  onUploadComplete?: (media: any) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  sosEventId,
  userId,
  onUploadComplete,
  onUploadError,
  className = ''
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg']
  };

  const maxFileSize = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024 // 50MB
  };

  const getFileType = (file: File): 'image' | 'video' | 'audio' | null => {
    if (allowedTypes.image.includes(file.type)) return 'image';
    if (allowedTypes.video.includes(file.type)) return 'video';
    if (allowedTypes.audio.includes(file.type)) return 'audio';
    return null;
  };

  const validateFile = (file: File): string | null => {
    const fileType = getFileType(file);
    if (!fileType) {
      return 'File type not supported';
    }

    if (file.size > maxFileSize[fileType]) {
      return `File size too large. Max size: ${formatFileSize(maxFileSize[fileType])}`;
    }

    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (files: FileList) => {
    const newUploads: UploadProgress[] = [];
    
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        onUploadError?.(error);
        return;
      }

      newUploads.push({
        file,
        progress: 0,
        status: 'uploading'
      });
    });

    setUploads(prev => [...prev, ...newUploads]);
    
    // Start uploading each file
    newUploads.forEach(upload => {
      uploadFile(upload.file);
    });
  };

  const uploadFile = async (file: File) => {
    const fileType = getFileType(file);
    if (!fileType) return;

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `sos-recordings/${sosEventId}/${fileName}`;
      
      // Determine bucket based on file type
      let bucket = 'media-images';
      if (fileType === 'video') bucket = 'media-videos';
      if (fileType === 'audio') bucket = 'media-audio';

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Save to sos_media table
      const { data: mediaData, error: mediaError } = await supabase
        .from('sos_media')
        .insert({
          sos_event_id: sosEventId,
          user_id: userId,
          file_url: urlData.publicUrl,
          media_type: fileType,
          file_size_bytes: file.size,
          is_uploaded: true,
          timestamp: new Date().toISOString(),
          metadata: {
            file_name: file.name,
            original_size: file.size,
            uploaded_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Update upload status
      setUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { ...upload, progress: 100, status: 'completed' as const }
          : upload
      ));

      onUploadComplete?.(mediaData);
      
      // Remove completed upload after 3 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(upload => upload.file !== file));
      }, 3000);

    } catch (error: any) {
      console.error('Upload failed:', error);
      
      setUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { ...upload, status: 'error' as const, error: error.message }
          : upload
      ));

      onUploadError?.(error.message);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(upload => upload.file !== file));
  };

  const getFileIcon = (file: File) => {
    const fileType = getFileType(file);
    switch (fileType) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`bg-black/50 border-cyan-400/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-cyan-300 text-sm font-medium">MEDIA UPLOAD</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-cyan-400 bg-cyan-400/10'
              : 'border-gray-600 hover:border-cyan-400/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-400 mb-1">
            Drag and drop files here or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supported: Images (10MB), Videos (100MB), Audio (50MB)
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Uploading...</h4>
            {uploads.map((upload, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
                {getFileIcon(upload.file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{upload.file.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-600 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          upload.status === 'completed'
                            ? 'bg-green-500'
                            : upload.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{upload.progress}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {upload.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeUpload(upload.file)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 