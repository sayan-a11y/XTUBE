'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileVideo, Image as ImageIcon, CheckCircle } from 'lucide-react';

type TabType = 'video' | 'image';
type QualityType = 'auto' | '1080p' | '2k' | '4k';

export default function UploadSection() {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<QualityType>('auto');
  const uploadTimerRef = useRef<NodeJS.Timeout | null>(null);

  const simulateUpload = useCallback(() => {
    setIsUploading(true);
    setIsUploadComplete(false);
    setUploadProgress(0);

    let progress = 0;
    uploadTimerRef.current = setInterval(() => {
      progress += Math.random() * 3 + 1;
      if (progress >= 100) {
        progress = 100;
        if (uploadTimerRef.current) {
          clearInterval(uploadTimerRef.current);
        }
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setIsUploadComplete(true);
        }, 500);
      } else {
        setUploadProgress(Math.round(progress));
      }
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current);
      }
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!isUploading && !isUploadComplete) {
        simulateUpload();
      }
    },
    [isUploading, isUploadComplete, simulateUpload]
  );

  const handleChooseFile = useCallback(() => {
    if (!isUploading && !isUploadComplete) {
      simulateUpload();
    }
  }, [isUploading, isUploadComplete, simulateUpload]);

  const getUploadedSize = () => {
    const totalGB = 5;
    const uploadedGB = (uploadProgress / 100) * totalGB;
    return `${uploadedGB.toFixed(2)} GB / ${totalGB} GB`;
  };

  const getSpeed = () => {
    if (uploadProgress >= 100) return '0 MB/s';
    return `${(30 + Math.random() * 30).toFixed(1)} MB/s`;
  };

  const getTimeRemaining = () => {
    if (uploadProgress >= 100) return '0s';
    const remaining = ((100 - uploadProgress) / 100) * 170;
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.round(remaining % 60);
    return `${minutes}m ${seconds}s`;
  };

  const qualities: { key: QualityType; label: string }[] = [
    { key: 'auto', label: 'Auto' },
    { key: '1080p', label: '1080p' },
    { key: '2k', label: '2K' },
    { key: '4k', label: '4K' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5"
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={() => setActiveTab('video')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'video'
              ? 'bg-[#E50914] text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white'
          }`}
        >
          Video Ad
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'image'
              ? 'bg-[#E50914] text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white'
          }`}
        >
          Image Ad
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'video' ? (
          <motion.div
            key="video"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Upload Complete State */}
            {isUploadComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 mb-4 border-2 border-green-500/30 rounded-xl bg-green-500/5"
              >
                <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
                <span className="text-sm text-green-400 font-medium">
                  Upload Complete!
                </span>
              </motion.div>
            )}

            {/* Drag & Drop Upload Area */}
            {(!isUploading && !isUploadComplete) && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl py-8 flex flex-col items-center justify-center transition-colors duration-200 ${
                  isDragging
                    ? 'border-[#E50914] bg-[#E50914]/5'
                    : 'border-[#333]'
                }`}
              >
                <Upload className="w-10 h-10 text-gray-500 mb-3" />
                <span className="text-sm text-gray-400">
                  Drag &amp; drop your video ad here
                </span>
                <span className="text-xs text-gray-500 my-2">or</span>
                <button
                  onClick={handleChooseFile}
                  className="bg-[#E50914] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#b0070f] transition-colors"
                >
                  Choose File
                </button>
              </div>
            )}

            {/* File Upload Progress */}
            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileVideo className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white">
                      Ad_Video_4K_UHD.mp4
                    </span>
                  </div>
                  <span className="text-sm text-[#E50914] font-medium">
                    {uploadProgress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#E50914] to-[#ff4d5a] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>

                {/* Upload Details */}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{getUploadedSize()}</span>
                  <span>Speed: {getSpeed()}</span>
                  <span>Time remaining: {getTimeRemaining()}</span>
                </div>
              </motion.div>
            )}

            {/* Quality Selector */}
            <div className="mt-4">
              <label className="text-xs text-gray-400 mb-2 block">
                Upload Quality
              </label>
              <div className="flex gap-2">
                {qualities.map((q) => (
                  <button
                    key={q.key}
                    onClick={() => setSelectedQuality(q.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      selectedQuality === q.key
                        ? 'bg-[#E50914]/20 border border-[#E50914] text-[#E50914]'
                        : 'bg-[#1a1a1a] border border-[#1f1f1f] text-gray-400 hover:text-white'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Note */}
            <p className="mt-2 text-[10px] text-gray-500 italic">
              Auto quality will deliver best experience across all devices.
            </p>

            {/* Supported Formats */}
            <div className="mt-3">
              <p className="text-xs text-gray-500">
                Supported: MP4, MOV, WebM, HLS
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Upload video ads up to 5GB
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="image"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Image Upload Complete State */}
            {isUploadComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 mb-4 border-2 border-green-500/30 rounded-xl bg-green-500/5"
              >
                <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
                <span className="text-sm text-green-400 font-medium">
                  Upload Complete!
                </span>
              </motion.div>
            )}

            {/* Image Drag & Drop Area */}
            {(!isUploading && !isUploadComplete) && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl py-8 flex flex-col items-center justify-center transition-colors duration-200 ${
                  isDragging
                    ? 'border-[#E50914] bg-[#E50914]/5'
                    : 'border-[#333]'
                }`}
              >
                <ImageIcon className="w-10 h-10 text-gray-500 mb-3" />
                <span className="text-sm text-gray-400">
                  Drag &amp; drop your image ad here
                </span>
                <span className="text-xs text-gray-500 my-2">or</span>
                <button
                  onClick={handleChooseFile}
                  className="bg-[#E50914] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#b0070f] transition-colors"
                >
                  Choose File
                </button>
              </div>
            )}

            {/* Image Upload Progress */}
            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white">
                      Ad_Image_HD.png
                    </span>
                  </div>
                  <span className="text-sm text-[#E50914] font-medium">
                    {uploadProgress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#E50914] to-[#ff4d5a] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>

                {/* Upload Details */}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{((uploadProgress / 100) * 10).toFixed(1)} MB / 10 MB</span>
                  <span>Speed: {(5 + Math.random() * 10).toFixed(1)} MB/s</span>
                  <span>Time remaining: {Math.max(1, Math.round(((100 - uploadProgress) / 100) * 5))}s</span>
                </div>
              </motion.div>
            )}

            {/* Supported Formats for Image */}
            <div className="mt-3">
              <p className="text-xs text-gray-500">
                Supported: JPG, PNG, WebP, GIF
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max size: 10MB
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
