import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  Star,
  TrendingUp,
  Clock,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  Plus,
  Camera,
  Folder
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Library: React.FC = () => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filters = [
    { id: 'all', label: 'All Photos', count: 247 },
    { id: 'recent', label: 'Recently Added', count: 23 },
    { id: 'favorites', label: 'Favorites', count: 34 },
    { id: 'high-quality', label: 'High Quality', count: 89 }
  ];

  const photos = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
      filename: 'morning-coffee.jpg',
      uploadedAt: '2 hours ago',
      qualityScore: 8.8,
      emotions: ['cozy', 'authentic', 'morning'],
      tags: ['coffee', 'lifestyle', 'morning', 'routine'],
      isFavorite: true,
      fileSize: '2.4 MB'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop',
      filename: 'coffee-shop-interior.jpg',
      uploadedAt: '1 day ago',
      qualityScore: 9.1,
      emotions: ['aesthetic', 'cozy', 'warm'],
      tags: ['interior', 'coffee', 'aesthetic', 'warm lighting'],
      isFavorite: false,
      fileSize: '3.1 MB'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
      filename: 'workspace-setup.jpg',
      uploadedAt: '2 days ago',
      qualityScore: 8.2,
      emotions: ['productive', 'clean', 'minimal'],
      tags: ['workspace', 'productivity', 'minimal', 'tech'],
      isFavorite: true,
      fileSize: '1.8 MB'
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
      filename: 'latte-art.jpg',
      uploadedAt: '3 days ago',
      qualityScore: 7.5,
      emotions: ['artistic', 'crafted', 'detailed'],
      tags: ['latte art', 'coffee', 'skill', 'artistic'],
      isFavorite: false,
      fileSize: '2.7 MB'
    },
    {
      id: 5,
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
      filename: 'golden-hour-nature.jpg',
      uploadedAt: '4 days ago',
      qualityScore: 9.3,
      emotions: ['peaceful', 'golden', 'natural'],
      tags: ['nature', 'golden hour', 'landscape', 'peaceful'],
      isFavorite: true,
      fileSize: '4.2 MB'
    },
    {
      id: 6,
      url: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=400&fit=crop',
      filename: 'city-street-night.jpg',
      uploadedAt: '5 days ago',
      qualityScore: 8.0,
      emotions: ['urban', 'night', 'vibrant'],
      tags: ['city', 'night', 'street', 'urban life'],
      isFavorite: false,
      fileSize: '3.5 MB'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };


  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Photo Library
            </h1>
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Manage your photos and organize your content library
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button
              className="bg-orange-500 px-4 py-2 rounded-lg text-white font-medium hover:bg-orange-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="w-4 h-4 mr-2 inline" />
              Upload Photos
            </motion.button>
            <motion.button
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Camera className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search photos by tags, emotions, or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg backdrop-blur-md ${
                theme === 'dark' 
                  ? 'bg-black/10 border border-white/10 text-white placeholder-gray-400' 
                  : 'bg-white border border-gray-200 shadow-sm text-gray-900 placeholder-gray-600'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* View Toggle */}
          <div className={`flex items-center rounded-lg backdrop-blur-md ${
            theme === 'dark' ? 'bg-black/10 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-l-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-green-600 text-white'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-r-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-green-600 text-white'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedFilter === filter.id
                  ? 'bg-green-600 text-white'
                  : theme === 'dark'
                  ? 'bg-black/10 border border-white/10 text-gray-300 hover:bg-gray-700'
                  : 'bg-white border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </motion.div>

      {/* Photo Grid/List */}
      <motion.div variants={itemVariants}>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                className={`group relative rounded-xl overflow-hidden backdrop-blur-md aspect-[9/16] ${
                  theme === 'dark' 
                    ? 'bg-black/10 border border-white/10' 
                    : 'bg-white border border-gray-200 shadow-sm'
                } hover:scale-105 transition-transform cursor-pointer`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                {/* Background Image */}
                <img 
                  src={photo.url} 
                  alt={photo.filename}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 bg-black/50 rounded-lg backdrop-blur-md hover:bg-black/70">
                    <MoreHorizontal className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button className="p-1.5 bg-black/50 rounded-lg backdrop-blur-md hover:bg-black/70">
                      <Eye className="w-4 h-4 text-white" />
                    </button>
                    <button className="p-1.5 bg-black/50 rounded-lg backdrop-blur-md hover:bg-black/70">
                      <Download className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Favorite Button */}
                <button 
                  className={`absolute top-2 right-12 p-1.5 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity ${
                    photo.isFavorite ? 'bg-yellow-500/50' : 'bg-black/50 hover:bg-black/70'
                  }`}
                >
                  <Star className={`w-4 h-4 ${photo.isFavorite ? 'text-yellow-400 fill-current' : 'text-white'}`} />
                </button>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="font-medium text-sm text-white truncate mb-1">
                    {photo.filename}
                  </h3>
                  <p className="text-xs text-gray-300 mb-2">
                    {photo.uploadedAt}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {photo.emotions.slice(0, 2).map((emotion) => (
                      <span 
                        key={emotion}
                        className="text-xs px-2 py-1 rounded-full bg-blue-500/30 text-blue-200"
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                className={`p-4 rounded-xl backdrop-blur-md ${
                  theme === 'dark' 
                    ? 'bg-black/10 border border-white/10' 
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center space-x-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={photo.url} 
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-medium truncate ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {photo.filename}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {photo.fileSize}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-2">
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {photo.uploadedAt}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {photo.tags.slice(0, 4).map((tag) => (
                        <span 
                          key={tag}
                          className={`text-xs px-2 py-1 rounded-full ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-gray-300' 
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button 
                      className={`p-2 rounded-lg ${
                        photo.isFavorite ? 'text-yellow-400' : 'text-gray-400'
                      } hover:bg-gray-700`}
                    >
                      <Star className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-700">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-700">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Empty State for No Results */}
      {photos.length === 0 && (
        <motion.div 
          className="text-center py-12"
          variants={itemVariants}
        >
          <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            No photos found
          </h3>
          <p className={`text-sm mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Upload some photos to get started creating viral content
          </p>
          <motion.button
            className="bg-orange-500 px-6 py-3 rounded-lg text-white font-medium hover:bg-orange-600 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5 mr-2 inline" />
            Upload Your First Photo
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Library;