'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadToIPFS, ipfsToHttp, getFromLocalStorage } from '@/lib/ipfs';

interface ImageUploadProps {
  value: string;
  onChange: (uri: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getImageSrc = useCallback((uri: string): string => {
    if (!uri) return '';
    if (uri.startsWith('local://')) {
      const stored = getFromLocalStorage(uri);
      return stored || '';
    }
    if (uri.startsWith('ipfs://')) {
      return ipfsToHttp(uri);
    }
    return uri;
  }, []);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const uri = await uploadToIPFS(file);
      onChange(uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const imageSrc = getImageSrc(value);

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400 font-rajdhani font-semibold flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        Token Image
      </label>

      {value && imageSrc ? (
        // Preview uploaded image
        <div className="relative group">
          <div className="relative w-full aspect-square max-w-[200px] rounded-xl overflow-hidden border-2 border-cyan-500/30">
            <img
              src={imageSrc}
              alt="Token preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 truncate max-w-[200px]">
            {value.startsWith('ipfs://') ? value.slice(0, 30) + '...' : 'Local preview'}
          </p>
        </div>
      ) : (
        // Upload area
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative w-full aspect-square max-w-[200px] rounded-xl border-2 border-dashed
            transition-all cursor-pointer
            flex flex-col items-center justify-center gap-3
            ${dragActive
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-gray-700 bg-gray-900/50 hover:border-cyan-500/50 hover:bg-gray-900'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              <span className="text-sm text-gray-400 font-rajdhani">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className={`w-10 h-10 ${dragActive ? 'text-cyan-400' : 'text-gray-500'}`} />
              <div className="text-center">
                <span className="text-sm text-gray-400 font-rajdhani">
                  Drop image here or click to upload
                </span>
                <p className="text-xs text-gray-600 mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 font-rajdhani">{error}</p>
      )}
    </div>
  );
}
