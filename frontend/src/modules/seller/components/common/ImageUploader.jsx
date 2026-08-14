/**
 * ImageUploader Component
 * Drag-and-drop multi-image and video upload with preview, reorder, and remove.
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Upload, X, GripVertical, Image as ImageIcon, Video as VideoIcon, Play } from 'lucide-react';

const ImageUploader = ({
  images = [],
  onChange,
  maxImages = 12,
  label = 'Product Media (Images & Videos)',
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files)
      .filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
      .slice(0, maxImages - images.length);

    if (!fileArray.length) return;

    const processFile = (file) =>
      new Promise((resolve) => {
        const isVideo = file.type.startsWith('video/');
        if (isVideo) {
          const videoUrl = URL.createObjectURL(file);
          resolve({ preview: videoUrl, isVideo: true });
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1000;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve({ preview: canvas.toDataURL('image/jpeg', 0.8), isVideo: false });
          };
          img.onerror = () => resolve({ preview: e.target.result, isVideo: false });
          img.src = e.target.result;
        };
        reader.onerror = () => resolve({ preview: null, isVideo: false });
        reader.readAsDataURL(file);
      });

    const newMedia = await Promise.all(
      fileArray.map(async (file) => {
        const { preview, isVideo } = await processFile(file);
        return {
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          type: isVideo ? 'video' : 'image',
          preview: preview || '',
          url: preview || '',
          name: file.name,
        };
      })
    );

    onChange?.([...images, ...newMedia]);
  }, [images, maxImages, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleRemove = useCallback((id) => {
    onChange?.(images.filter((img) => img.id !== id));
  }, [images, onChange]);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}

      {/* Drop Zone */}
      <div
        onClick={() => images.length < maxImages && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragOver
            ? 'border-blue-400 bg-blue-50/50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50/50'
          }
          ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          aria-label="Upload images or videos"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isDragOver ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload size={24} className={isDragOver ? 'text-blue-500' : 'text-gray-400'} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragOver ? 'Drop files here' : 'Click to upload images & videos or drag and drop'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, WEBP, MP4, WEBM up to 50MB • {images.length}/{maxImages} items
            </p>
          </div>
        </div>
      </div>

      {/* Media Previews */}
      {images.length > 0 && (
        <Reorder.Group
          axis="x"
          values={images}
          onReorder={(newOrder) => onChange?.(newOrder)}
          className="flex flex-wrap gap-3 mt-4"
        >
          <AnimatePresence>
            {images.map((item) => {
              const isVideo = item.type === 'video' || item.isVideo || item.url?.match(/\.(mp4|webm|ogg|mov)$/i);
              return (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className="relative group"
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-100 hover:border-blue-200 transition-colors bg-black/5"
                  >
                    {item.preview || item.url ? (
                      isVideo ? (
                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                          <video
                            src={item.preview || item.url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Play size={20} className="text-white fill-white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={item.preview || item.url}
                          alt={item.name || 'Product Image'}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        {isVideo ? <VideoIcon size={20} className="text-gray-300" /> : <ImageIcon size={20} className="text-gray-300" />}
                      </div>
                    )}

                    {/* Media Type Badge */}
                    {isVideo && (
                      <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 z-10">
                        <VideoIcon size={10} /> VIDEO
                      </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                        className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                        aria-label="Remove item"
                      >
                        <X size={14} className="text-red-500" />
                      </button>
                      <div className="p-1.5 bg-white/90 rounded-lg cursor-grab">
                        <GripVertical size={14} className="text-gray-500" />
                      </div>
                    </div>
                  </motion.div>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  );
};

export default ImageUploader;
