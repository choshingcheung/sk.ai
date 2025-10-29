'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileImage, FolderOpen } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (imageUrls: string[]) => void;
}

export default function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('Please select valid image files');
      return;
    }

    const imageUrls: string[] = [];
    let loadedCount = 0;

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        imageUrls.push(result);
        loadedCount++;

        if (loadedCount === imageFiles.length) {
          setUploadedCount(imageUrls.length);
          onImageUpload(imageUrls);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const openFileExplorer = () => {
    inputRef.current?.click();
  };

  const openFolderExplorer = () => {
    folderInputRef.current?.click();
  };

  const removeImages = () => {
    setUploadedCount(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
    onImageUpload([]);
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        accept="image/*"
        // @ts-expect-error - webkitdirectory is not in TypeScript types but works in browsers
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleChange}
        className="hidden"
      />

      {uploadedCount === 0 ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? 'border-cyan-400 bg-cyan-500/10 scale-105'
              : 'border-white/30 hover:border-white/50 hover:bg-white/5'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-blue-300" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white mb-2">Drop your X-ray images here</p>
              <p className="text-sm text-blue-200/70">Supports multiple files and folders</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={openFileExplorer}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/30 flex items-center space-x-2"
              >
                <FileImage className="h-4 w-4" />
                <span>Select Files</span>
              </button>

              <button
                onClick={openFolderExplorer}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-lg transition-all flex items-center space-x-2"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Select Folder</span>
              </button>
            </div>

            <p className="text-xs text-blue-200/50">Supports JPG, PNG, DICOM, and other image formats</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500/30 p-2 rounded-lg">
                  <FileImage className="h-6 w-6 text-green-300" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {uploadedCount} image{uploadedCount > 1 ? 's' : ''} uploaded
                  </p>
                  <p className="text-green-200/70 text-sm">Ready for detection</p>
                </div>
              </div>
              <button
                onClick={removeImages}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-lg p-2 transition-all"
                title="Remove all images"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={openFileExplorer}
                className="flex-1 text-sm text-white hover:text-blue-200 font-medium py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
              >
                Add more files
              </button>
              <button
                onClick={openFolderExplorer}
                className="flex-1 text-sm text-white hover:text-blue-200 font-medium py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
              >
                Add folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
