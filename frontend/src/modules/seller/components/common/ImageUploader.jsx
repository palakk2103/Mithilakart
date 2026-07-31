/**
 * ImageUploader Component
 * Drag-and-drop multi-image upload with preview, reorder, and remove.
 * Frontend only — uses dummy file handling.
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Upload, X, GripVertical, Image as ImageIcon } from 'lucide-react';

const ImageUploader = ({
  images = [],
  onChange,
  maxImages = 8,
  label = 'Product Images',
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, maxImages - images.length);

    if (!fileArray.length) return;

    const compressImage = (file) =>
      new Promise((resolve) => {
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
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = () => resolve(e.target.result);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });

    const newImages = await Promise.all(
      fileArray.map(async (file) => {
        const dataUrl = (await compressImage(file)) || '';
        return {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview: dataUrl,
          url: dataUrl,
          name: file.name,
        };
      })
    );

    onChange?.([...images, ...newImages]);
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
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          aria-label="Upload images"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isDragOver ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload size={24} className={isDragOver ? 'text-blue-500' : 'text-gray-400'} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragOver ? 'Drop images here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, WEBP up to 5MB • {images.length}/{maxImages} images
            </p>
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <Reorder.Group
          axis="x"
          values={images}
          onReorder={(newOrder) => onChange?.(newOrder)}
          className="flex flex-wrap gap-3 mt-4"
        >
          <AnimatePresence>
            {images.map((image) => (
              <Reorder.Item
                key={image.id}
                value={image}
                className="relative group"
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-100 hover:border-blue-200 transition-colors"
                >
                  {image.preview ? (
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon size={20} className="text-gray-300" />
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(image.id); }}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      aria-label="Remove image"
                    >
                      <X size={14} className="text-red-500" />
                    </button>
                    <div className="p-1.5 bg-white/90 rounded-lg cursor-grab">
                      <GripVertical size={14} className="text-gray-500" />
                    </div>
                  </div>
                </motion.div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  );
};

export default ImageUploader;
