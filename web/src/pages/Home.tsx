import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Star, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  Play,
  Sparkles,
  X,
  Check,
  Upload,
  Users,
  Brain,
  Layers,
  Eye,
  MessageSquare,
  Palette
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Home: React.FC = () => {
  const { theme } = useTheme();

  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Creation',
      description: 'Create engaging slideshows in under 10 seconds with AI that understands what makes content compelling.'
    },
    {
      icon: Star,
      title: 'Professional Templates',
      description: 'Curated templates designed for maximum engagement across social platforms.'
    },
    {
      icon: Clock,
      title: 'Lightning Fast',
      description: 'From idea to finished slideshow in seconds. No editing skills required.'
    },
    {
      icon: TrendingUp,
      title: 'Smart Optimization',
      description: 'AI analyzes your photos and optimizes everything for maximum impact automatically.'
    }
  ];

  const stats = [
    { value: '10s', label: 'Creation Time' },
    { value: '24/7', label: 'AI Available' },
    { value: '100+', label: 'Templates' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      theme === 'dark' 
        ? 'bg-gray-950' 
        : 'bg-gray-50'
    }`}>
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full opacity-10 ${
          theme === 'dark' ? 'bg-blue-500' : 'bg-blue-200'
        }`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10 ${
          theme === 'dark' ? 'bg-orange-500' : 'bg-orange-200'
        }`}></div>
        <div className={`absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-5 ${
          theme === 'dark' ? 'bg-teal-500' : 'bg-teal-200'
        }`}></div>
      </div>
      {/* Navigation */}
      <nav className={`backdrop-blur-md relative z-20 ${
        theme === 'dark' 
          ? 'bg-black/10 border-b border-white/10' 
          : 'bg-white/10 border-b border-black/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className={`ml-3 text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Framatic
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-300 hover:text-white' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                Sign In
              </motion.button>
              <motion.button
                className="bg-orange-500 px-6 py-2 rounded-lg text-white font-medium hover:bg-orange-600 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16 relative"
          variants={itemVariants}
        >
          {/* Left Phone */}
          <motion.div 
            className="absolute left-0 top-0 hidden lg:block"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <svg width="240" height="480" viewBox="0 0 240 480" className="drop-shadow-2xl">
              {/* Phone Frame */}
              <rect x="20" y="20" width="200" height="440" rx="30" ry="30" 
                    fill={theme === 'dark' ? '#1f2937' : '#ffffff'} 
                    stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} 
                    strokeWidth="2"/>
              {/* Screen */}
              <rect x="35" y="50" width="170" height="300" rx="15" ry="15" 
                    fill={theme === 'dark' ? '#111827' : '#f9fafb'}/>
              {/* Content Preview */}
              <rect x="50" y="70" width="140" height="80" rx="8" fill="#f59e0b"/>
              <rect x="50" y="160" width="100" height="8" rx="4" fill={theme === 'dark' ? '#4b5563' : '#d1d5db'}/>
              <rect x="50" y="180" width="120" height="8" rx="4" fill={theme === 'dark' ? '#4b5563' : '#d1d5db'}/>
              <rect x="50" y="200" width="80" height="8" rx="4" fill={theme === 'dark' ? '#4b5563' : '#d1d5db'}/>
            </svg>
          </motion.div>

          {/* Right Phone */}
          <motion.div 
            className="absolute right-0 top-0 hidden lg:block"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            <svg width="240" height="480" viewBox="0 0 240 480" className="drop-shadow-2xl">
              {/* Phone Frame */}
              <rect x="20" y="20" width="200" height="440" rx="30" ry="30" 
                    fill={theme === 'dark' ? '#1f2937' : '#ffffff'} 
                    stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} 
                    strokeWidth="2"/>
              {/* Screen */}
              <rect x="35" y="50" width="170" height="300" rx="15" ry="15" 
                    fill={theme === 'dark' ? '#111827' : '#f9fafb'}/>
              {/* Content Preview */}
              <rect x="50" y="70" width="140" height="80" rx="8" fill="#3b82f6"/>
              <rect x="50" y="160" width="90" height="8" rx="4" fill={theme === 'dark' ? '#4b5563' : '#d1d5db'}/>
              <rect x="50" y="180" width="110" height="8" rx="4" fill={theme === 'dark' ? '#4b5563' : '#d1d5db'}/>
              <rect x="50" y="200" width="130" height="8" rx="4" fill={theme === 'dark' ? '#4b5563' : '#d1d5db'}/>
            </svg>
          </motion.div>

          <motion.h1 
            className={`text-5xl md:text-7xl font-bold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Create Amazing
            <br />
            <span className="text-orange-500">
              Slideshows
            </span>
            <br />
            in Seconds
          </motion.h1>
          
          <motion.p 
            className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Transform your authentic photos into engaging TikTok/Instagram content with AI assistance. 
            No editing skills required.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to="/dashboard">
              <motion.button
                className="bg-orange-500 px-8 py-4 rounded-lg text-white font-semibold text-lg hover:bg-orange-600 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-5 h-5 mr-2 inline" />
                Start Creating
              </motion.button>
            </Link>
            <motion.button
              className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all backdrop-blur-md ${
                theme === 'dark' 
                  ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' 
                  : 'bg-black/10 border border-black/20 text-gray-900 hover:bg-black/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-5 h-5 mr-2 inline" />
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto"
          variants={itemVariants}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className={`text-center p-6 rounded-xl backdrop-blur-md ${
                theme === 'dark' 
                  ? 'bg-black/10 border border-white/10' 
                  : 'bg-white/10 border border-black/10'
              }`}
              whileHover={{ scale: 1.05 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`text-3xl md:text-4xl font-bold mb-2 ${
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
        </motion.div>

        {/* Features */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
          variants={itemVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={`p-8 rounded-xl backdrop-blur-md ${
                theme === 'dark' 
                  ? 'bg-black/10 border border-white/10' 
                  : 'bg-white/10 border border-black/10'
              }`}
              whileHover={{ scale: 1.02 }}
              initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <feature.icon className={`w-12 h-12 mb-4 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
              <h3 className={`text-xl font-semibold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {feature.title}
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Problem Section */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Tired of Spending Hours on Slideshows?
          </h2>
          <p className={`text-xl mb-8 max-w-4xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Creating slideshows manually is painful. Upload images one by one, manually place text, 
            adjust formatting for every single slide, write captions, and repeat the process for each platform. 
            There has to be a better way.
          </p>
        </motion.div>

        {/* Old Way vs New Way */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
          variants={itemVariants}
        >
          {/* Old Way */}
          <motion.div
            className={`p-8 rounded-xl backdrop-blur-md ${
              theme === 'dark' 
                ? 'bg-red-500/5 border border-red-500/20' 
                : 'bg-red-50 border border-red-200'
            }`}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center mb-4">
              <X className="w-8 h-8 text-red-500 mr-3" />
              <h3 className={`text-2xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                The Old Way
              </h3>
            </div>
            <ul className="space-y-3">
              {[
                'Upload images manually, one by one',
                'Write captions and text overlays yourself',
                'Adjust formatting for every single slide',
                'Resize and reformat for each platform',
                'Spend hours on what should take minutes',
                'No creative guidance or optimization'
              ].map((item, index) => (
                <li key={index} className={`flex items-start ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <X className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* New Way */}
          <motion.div
            className={`p-8 rounded-xl backdrop-blur-md ${
              theme === 'dark' 
                ? 'bg-teal-500/5 border border-teal-500/20' 
                : 'bg-teal-50 border border-teal-200'
            }`}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center mb-4">
              <Check className="w-8 h-8 text-teal-500 mr-3" />
              <h3 className={`text-2xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                The Framatic Way
              </h3>
            </div>
            <ul className="space-y-3">
              {[
                'Upload once, AI handles everything',
                'AI writes engaging captions automatically',
                'Perfect formatting applied instantly',
                'Optimized for all platforms automatically',
                'Complete slideshows in under 10 seconds',
                'Built-in creative expertise and optimization'
              ].map((item, index) => (
                <li key={index} className={`flex items-start ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Check className="w-5 h-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Key Differentiators */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          variants={itemVariants}
        >
          {[
            {
              icon: Layers,
              title: 'Bulk Creation',
              description: 'Upload 100+ photos and get dozens of ready-to-post slideshows. Scale your content creation like never before.'
            },
            {
              icon: Brain,
              title: 'Creator Persona AI',
              description: 'Train our AI to write in your unique voice. Consistent style and tone across all your content, automatically.'
            },
            {
              icon: Users,
              title: 'Zero Creative Input Needed',
              description: 'Advanced image analysis writes compelling captions based on what it sees. No brainstorming, no writer\'s block.'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className={`p-6 rounded-xl backdrop-blur-md text-center ${
                theme === 'dark' 
                  ? 'bg-black/10 border border-white/10' 
                  : 'bg-white/10 border border-black/10'
              }`}
              whileHover={{ scale: 1.05 }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <feature.icon className={`w-12 h-12 mx-auto mb-4 ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`} />
              <h3 className={`text-xl font-semibold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {feature.title}
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Vision Section */}
        <motion.div 
          className={`p-12 rounded-2xl backdrop-blur-md mb-16 ${
            theme === 'dark' 
              ? 'bg-black/10 border border-white/10' 
              : 'bg-white/10 border border-black/10'
          }`}
          variants={itemVariants}
        >
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Advanced AI Vision Technology
            </h2>
            <p className={`text-xl max-w-4xl mx-auto ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Our AI doesn't just see your photos—it understands them. Every image is analyzed for content, emotion, 
              and context to create narratives that feel authentically you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Eye,
                title: 'Deep Image Analysis',
                description: 'AI examines every detail: lighting, composition, subjects, emotions, and context to understand the story your photo tells.'
              },
              {
                icon: MessageSquare,
                title: 'Consistent Messaging',
                description: 'Maintains your unique voice across all content. The AI learns your style and ensures every caption feels like you wrote it.'
              },
              {
                icon: Palette,
                title: 'Narrative Coherence',
                description: 'Creates storylines that connect your images meaningfully, building compelling sequences that engage your audience.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className={`p-6 rounded-xl ${
                  theme === 'dark' 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-black/5 border border-black/10'
                }`}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <feature.icon className={`w-10 h-10 mb-4 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`} />
                <h3 className={`text-lg font-semibold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className={`mt-8 p-6 rounded-xl text-center ${
            theme === 'dark' 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <h4 className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              The Result?
            </h4>
            <p className={`${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Slideshows that feel intentional, personal, and professionally crafted—even though they're created in seconds. 
              Your audience sees cohesive storytelling, not random images with generic text.
            </p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className={`text-center p-12 rounded-2xl backdrop-blur-md ${
            theme === 'dark' 
              ? 'bg-black/10 border border-white/10' 
              : 'bg-white/10 border border-black/10'
          }`}
          variants={itemVariants}
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Ready to Transform Your Content?
          </h2>
          <p className={`text-lg mb-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Join thousands of creators who've streamlined their content creation with AI-powered slideshows.
          </p>
          <Link to="/dashboard">
            <motion.button
              className="bg-orange-500 px-8 py-4 rounded-lg text-white font-semibold text-lg hover:bg-orange-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRight className="w-5 h-5 mr-2 inline" />
              Start Your Creative Journey
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;