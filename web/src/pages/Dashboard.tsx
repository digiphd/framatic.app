import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Upload, 
  Image, 
  Play, 
  TrendingUp,
  Clock,
  MoreHorizontal,
  Download
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Dashboard: React.FC = () => {
  const { theme } = useTheme();

  const quickActions = [
    {
      icon: Zap,
      title: 'AI Create',
      description: 'AI-powered slideshow in 10 seconds',
      color: 'bg-orange-500',
      action: 'create'
    },
    {
      icon: Upload,
      title: 'Upload Photos',
      description: 'Add to your library for faster creation',
      color: 'bg-blue-500',
      action: 'upload'
    },
    {
      icon: Image,
      title: 'Browse Library',
      description: 'Manage your photo collection',
      color: 'bg-teal-500',
      action: 'library'
    },
    {
      icon: Play,
      title: 'View Slideshows',
      description: 'See all your created content',
      color: 'bg-slate-500',
      action: 'slideshows'
    }
  ];

  const recentSlideshows = [
    {
      id: 1,
      title: 'Morning Coffee Routine',
      template: 'Day in My Life',
      thumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
      createdAt: '2 hours ago',
      slideCount: 8,
      duration: '45s'
    },
    {
      id: 2,
      title: 'Hidden Coffee Shops NYC',
      template: 'Hidden Gems',
      thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
      createdAt: '1 day ago',
      slideCount: 10,
      duration: '52s'
    },
    {
      id: 3,
      title: 'Before & After Workspace',
      template: 'Before/After',
      thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
      createdAt: '3 days ago',
      slideCount: 6,
      duration: '38s'
    }
  ];

  const stats = [
    { label: 'Total Slideshows', value: '47', icon: Play },
    { label: 'Photos in Library', value: '247', icon: Image },
    { label: 'This Month', value: '12', icon: Clock },
    { label: 'Templates Used', value: '8', icon: TrendingUp }
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
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className={`text-3xl font-bold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Welcome back! 👋
        </h1>
        <p className={`text-lg ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Ready to create some viral content?
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className={`text-xl font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              className={`p-6 rounded-xl backdrop-blur-md cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-black/10 border border-white/10 hover:bg-black/20' 
                  : 'bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {action.title}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {action.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <h2 className={`text-xl font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Quick Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className={`p-6 rounded-xl backdrop-blur-md ${
                theme === 'dark' 
                  ? 'bg-black/10 border border-white/10' 
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-center mb-2">
                <stat.icon className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
              <div className={`text-2xl font-bold mb-1 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {stat.value}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Slideshows */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Recent Slideshows
          </h2>
          <motion.button
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-green-400 hover:bg-green-400/10' 
                : 'text-green-600 hover:bg-green-600/10'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            View All
          </motion.button>
        </div>
        
        <div className="grid gap-4">
          {recentSlideshows.map((slideshow, index) => (
            <motion.div
              key={slideshow.id}
              className={`p-4 rounded-xl backdrop-blur-md ${
                theme === 'dark' 
                  ? 'bg-black/10 border border-white/10' 
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
              whileHover={{ scale: 1.01 }}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-4">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img 
                    src={slideshow.thumbnail} 
                    alt={slideshow.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {slideshow.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {slideshow.template}
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      •
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {slideshow.slideCount} slides • {slideshow.duration}
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      •
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {slideshow.createdAt}
                    </span>
                  </div>

                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <motion.button
                    className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;