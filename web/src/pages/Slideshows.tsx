import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  Star,
  TrendingUp,
  Clock,
  MoreHorizontal,
  Download,
  Share2,
  Copy,
  Edit,
  Trash2,
  Plus,
  Zap,
  Calendar
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useModal } from '../hooks/useModal';
import { SlideshowEditor } from '../components/slideshow/SlideshowEditor';
import type { Slideshow } from '../types/slideshow';

const Slideshows: React.FC = () => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const slideshowModal = useModal<Slideshow>();

  const filters = [
    { id: 'all', label: 'All Slideshows', count: 47 },
    { id: 'viral', label: 'Gone Viral', count: 12 },
    { id: 'recent', label: 'Recent', count: 8 },
    { id: 'favorites', label: 'Favorites', count: 15 },
    { id: 'draft', label: 'Drafts', count: 3 }
  ];

  const slideshows: (Slideshow & { 
    thumbnail: string; 
    duration: string; 
    slideCount: number; 
    createdAt: string; 
    viralScore: number; 
    isViral: boolean; 
    isFavorite: boolean; 
    platforms: string[];
  })[] = [
    {
      id: '1',
      title: 'Morning Coffee Routine',
      template: 'Day in My Life',
      slides: [
        {
          id: 'slide1',
          imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop',
          text: 'Starting my morning right ☕',
          textPosition: { x: 0.5, y: 0.1 },
          textScale: 1,
          textRotation: 0,
        }
      ],
      viralHook: 'You won\'t believe what happened during my morning routine!',
      caption: 'The secret to a perfect morning routine that changed my life',
      hashtags: ['#morningroutine', '#coffee', '#lifestyle'],
      estimatedViralScore: 8.5,
      thumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop',
      duration: '45s',
      slideCount: 8,
      createdAt: '2 hours ago',
      viralScore: 8.5,
      isViral: true,
      isFavorite: true,
      status: 'published',
      platforms: ['tiktok', 'instagram']
    },
    {
      id: '2',
      title: 'Hidden Coffee Shops NYC',
      template: 'Hidden Gems',
      slides: [
        {
          id: 'slide2',
          imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop',
          text: 'Hidden gem in SoHo ✨',
          textPosition: { x: 0.5, y: 0.8 },
          textScale: 1.2,
          textRotation: 0,
        }
      ],
      viralHook: 'These hidden NYC coffee shops will blow your mind!',
      caption: 'Secret spots only locals know about',
      hashtags: ['#hiddengems', '#nyc', '#coffee'],
      estimatedViralScore: 7.2,
      thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop',
      duration: '52s',
      slideCount: 10,
      createdAt: '1 day ago',
      viralScore: 7.2,
      isViral: false,
      isFavorite: true,
      status: 'published',
      platforms: ['tiktok']
    },
    {
      id: '3',
      title: 'Before & After Workspace',
      template: 'Before/After',
      slides: [
        {
          id: 'slide3',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop',
          text: 'My workspace transformation 🚀',
          textPosition: { x: 0.5, y: 0.9 },
          textScale: 1.1,
          textRotation: 0,
        }
      ],
      viralHook: 'This workspace transformation will inspire you!',
      caption: 'From chaos to productivity paradise',
      hashtags: ['#workspace', '#beforeafter', '#productivity'],
      estimatedViralScore: 9.1,
      thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop',
      duration: '38s',
      slideCount: 6,
      createdAt: '3 days ago',
      viralScore: 9.1,
      isViral: true,
      isFavorite: true,
      status: 'published',
      platforms: ['tiktok', 'instagram', 'youtube']
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


  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok': return '📱';
      case 'instagram': return '📷';
      case 'youtube': return '📺';
      default: return '🔗';
    }
  };

  const handleSlideshowClick = (slideshow: any) => {
    // Convert the extended slideshow object to base Slideshow type
    const baseSlidshow: Slideshow = {
      id: slideshow.id,
      title: slideshow.title,
      template: slideshow.template,
      slides: slideshow.slides,
      viralHook: slideshow.viralHook,
      caption: slideshow.caption,
      hashtags: slideshow.hashtags,
      estimatedViralScore: slideshow.estimatedViralScore,
      status: slideshow.status,
      platforms: slideshow.platforms
    };
    slideshowModal.open(baseSlidshow);
  };

  const handleSlideshowSave = (updatedSlideshow: Slideshow) => {
    // Handle slideshow save logic here
    console.log('Saving slideshow:', updatedSlideshow);
    slideshowModal.close();
  };

  const handleSlideshowExport = (slideshow: Slideshow) => {
    // Handle slideshow export logic here
    console.log('Exporting slideshow:', slideshow);
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
              My Slideshows
            </h1>
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Track performance and manage your viral content
            </p>
          </div>
          
          <motion.button
            className="bg-orange-500 px-6 py-3 rounded-lg text-white font-medium hover:bg-orange-600 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5 mr-2 inline" />
            Create New Slideshow
          </motion.button>
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
              placeholder="Search slideshows by title, template, or content..."
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

      {/* Slideshows Grid/List */}
      <motion.div variants={itemVariants}>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {slideshows.map((slideshow, index) => (
              <motion.div
                key={slideshow.id}
                className={`group relative rounded-xl overflow-hidden backdrop-blur-md aspect-[9/16] ${
                  theme === 'dark' 
                    ? 'bg-black/10 border border-white/10' 
                    : 'bg-white border border-gray-200 shadow-sm'
                } hover:scale-105 transition-transform cursor-pointer`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                onClick={() => handleSlideshowClick(slideshow)}
              >
                {/* Background Image */}
                <img 
                  src={slideshow.thumbnail} 
                  alt={slideshow.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {slideshow.isViral && (
                    <span className="px-2 py-1 bg-teal-500 text-white text-xs font-medium rounded-full flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Viral
                    </span>
                  )}
                  {slideshow.status === 'draft' && (
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                      Draft
                    </span>
                  )}
                </div>

                {/* Duration & Viral Score */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-md ${
                    slideshow.viralScore >= 8.5 
                      ? 'bg-teal-500/20 text-teal-400' 
                      : slideshow.viralScore >= 7 
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {slideshow.viralScore}/10
                  </span>
                  <div className="bg-black/50 px-2 py-1 rounded-lg text-white text-xs backdrop-blur-md">
                    {slideshow.duration}
                  </div>
                </div>

                {/* Favorite */}
                <button className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur-md ${
                  slideshow.isFavorite ? 'bg-yellow-500/20' : 'bg-black/20'
                } opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <Star className={`w-4 h-4 ${
                    slideshow.isFavorite ? 'text-yellow-400 fill-current' : 'text-white'
                  }`} />
                </button>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {slideshow.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      slideshow.viralScore >= 8.5 
                        ? 'bg-teal-500/20 text-teal-400' 
                        : slideshow.viralScore >= 7 
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {slideshow.viralScore}/10
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {slideshow.template}
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {slideshow.slideCount} slides
                    </span>
                  </div>


                  {/* Platforms */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {slideshow.platforms.map((platform) => (
                        <span key={platform} className="text-sm">
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                    </div>
                    <span className={`text-xs ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {slideshow.createdAt}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {slideshows.map((slideshow, index) => (
              <motion.div
                key={slideshow.id}
                className={`p-4 rounded-xl backdrop-blur-md ${
                  theme === 'dark' 
                    ? 'bg-black/10 border border-white/10' 
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSlideshowClick(slideshow)}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center space-x-4">
                  {/* Thumbnail */}
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={slideshow.thumbnail} 
                      alt={slideshow.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/50 px-1 py-0.5 rounded text-white text-xs">
                      {slideshow.duration}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold truncate ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {slideshow.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {slideshow.isViral && (
                          <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs rounded-full">
                            Viral
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          slideshow.viralScore >= 8.5 
                            ? 'bg-teal-500/20 text-teal-400' 
                            : slideshow.viralScore >= 7 
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {slideshow.viralScore}/10
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-2">
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {slideshow.template}
                      </span>
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {slideshow.slideCount} slides
                      </span>
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {slideshow.createdAt}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {slideshow.platforms.map((platform) => (
                          <span key={platform} className="text-sm">
                            {getPlatformIcon(platform)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button 
                      className={`p-2 rounded-lg ${
                        slideshow.isFavorite ? 'text-yellow-400' : 'text-gray-400'
                      } hover:bg-gray-700`}
                    >
                      <Star className={`w-4 h-4 ${slideshow.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-700">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-700">
                      <Share2 className="w-4 h-4" />
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

      {/* Empty State */}
      {slideshows.length === 0 && (
        <motion.div 
          className="text-center py-12"
          variants={itemVariants}
        >
          <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            No slideshows yet
          </h3>
          <p className={`text-sm mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Create your first viral slideshow and start growing your audience
          </p>
          <motion.button
            className="bg-orange-500 px-6 py-3 rounded-lg text-white font-medium hover:bg-orange-600 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5 mr-2 inline" />
            Create Your First Slideshow
          </motion.button>
        </motion.div>
      )}

      {/* Slideshow Editor Modal */}
      <SlideshowEditor
        slideshow={slideshowModal.data}
        isOpen={slideshowModal.isOpen}
        onClose={slideshowModal.close}
        onSave={handleSlideshowSave}
        onExport={handleSlideshowExport}
      />
    </motion.div>
  );
};

export default Slideshows;