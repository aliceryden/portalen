import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  currentImage?: string;
  onUploadComplete: (url: string) => void;
  type: 'profile' | 'horse';
  label?: string;
}

export default function ImageUpload({ currentImage, onUploadComplete, type, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validera filtyp
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Ogiltig filtyp. Använd JPG, PNG eller GIF');
      return;
    }

    // Validera filstorlek (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Filen är för stor. Max 5MB');
      return;
    }

    // Visa förhandsvisning
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Ladda upp
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = type === 'profile' ? '/upload/profile-image' : '/upload/horse-image';
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.url;
      onUploadComplete(imageUrl);
      toast.success('Bild uppladdad!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Kunde inte ladda upp bild');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}
      
      <div className="flex items-center gap-4">
        {/* Preview */}
        {preview ? (
          <div className="relative">
            <img
              src={preview.startsWith('http') || preview.startsWith('data:') ? preview : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${preview}`}
              alt="Preview"
              className="w-24 h-24 rounded-xl object-cover border-2 border-earth-200"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-xl bg-earth-100 border-2 border-dashed border-earth-300 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-earth-400" />
          </div>
        )}

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id={`image-upload-${type}`}
            disabled={uploading}
          />
          <label
            htmlFor={`image-upload-${type}`}
            className={`btn-secondary cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-earth-600 border-t-transparent rounded-full animate-spin" />
                Laddar upp...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                {preview ? 'Byt bild' : 'Ladda upp bild'}
              </>
            )}
          </label>
          <p className="text-xs text-earth-500 mt-1">
            JPG, PNG eller GIF. Max 5MB
          </p>
        </div>
      </div>
    </div>
  );
}

