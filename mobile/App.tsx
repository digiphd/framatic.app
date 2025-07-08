import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/components/screens/HomeScreen';
import { AssetLibraryScreen } from './src/components/screens/AssetLibraryScreen';
import { MagicCreateScreen } from './src/components/screens/MagicCreateScreen';
import { PreviewScreen } from './src/components/screens/PreviewScreen';

type Screen = 'home' | 'library' | 'magic-create' | 'preview';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentSlideshow, setCurrentSlideshow] = useState<any>(null);

  const handleMagicCreate = () => {
    console.log('Magic Create pressed! 🪄');
    setCurrentScreen('magic-create');
  };

  const handleTemplateSelect = (template: string) => {
    console.log('Template selected:', template);
    // TODO: Navigate to template customization or direct creation
  };

  const handleViewLibrary = () => {
    console.log('Navigating to Photo Library');
    setCurrentScreen('library');
  };

  const handleBack = () => {
    setCurrentScreen('home');
  };

  const handlePreview = (slideshow: any) => {
    setCurrentSlideshow(slideshow);
    setCurrentScreen('preview');
  };

  const handleExport = (slideshow: any) => {
    console.log('Exporting slideshow:', slideshow);
    setCurrentScreen('home');
  };

  const handleEditMetadata = (slideshow: any) => {
    console.log('Edit metadata:', slideshow);
    // For now, just go back to home
    setCurrentScreen('home');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'library':
        return <AssetLibraryScreen onBack={handleBack} />;
      case 'magic-create':
        return <MagicCreateScreen onBack={handleBack} onPreview={handlePreview} />;
      case 'preview':
        return currentSlideshow ? (
          <PreviewScreen 
            slideshow={currentSlideshow} 
            onBack={handleBack} 
            onExport={handleExport} 
            onEditMetadata={handleEditMetadata}
          />
        ) : null;
      default:
        return (
          <HomeScreen
            onMagicCreate={handleMagicCreate}
            onTemplateSelect={handleTemplateSelect}
            onViewLibrary={handleViewLibrary}
            // Mock data for development
            stats={{
          totalSlideshows: 12,
          viralHits: 3,
          totalViews: '2.1M',
          librarySize: 45,
        }}
        recentSlideshows={[
          {
            id: '1',
            title: 'Morning Coffee Routine',
            template: 'day_in_life',
            views: '234K',
            viralScore: 85,
            createdAt: '2 hours ago',
          },
          {
            id: '2',
            title: 'Hidden NYC Spots',
            template: 'hidden_gems',
            views: '1.2M',
            viralScore: 92,
            createdAt: 'Yesterday',
          },
          {
            id: '3',
            title: 'Glow Up Journey',
            template: 'before_after',
            views: '567K',
            viralScore: 78,
            createdAt: '3 days ago',
          },
            ]}
            // analysisProgress={75} // Uncomment to show analysis progress
          />
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <StatusBar style="light" />
    </>
  );
}