import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/components/screens/HomeScreen';
import { AssetLibraryScreen } from './src/components/screens/AssetLibraryScreen';
import { MySlideshowsScreen } from './src/components/screens/MySlideshowsScreen';
import { MagicCreateScreen } from './src/components/screens/MagicCreateScreen';
import { PreviewScreen } from './src/components/screens/PreviewScreen';
import { MetadataEditScreen } from './src/components/screens/MetadataEditScreen';
import { ToastContainer } from './src/components/ui/ToastContainer';

type Screen = 'home' | 'library' | 'magic-create' | 'preview' | 'slideshows' | 'metadata-edit';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentSlideshow, setCurrentSlideshow] = useState<any>(null);

  const handleMagicCreate = () => {
    console.log('Magic Create pressed! 🪄');
    setCurrentScreen('magic-create');
  };


  const handleViewLibrary = () => {
    console.log('Navigating to Photo Library');
    setCurrentScreen('library');
  };

  const handleViewSlideshows = () => {
    console.log('Navigating to My Slideshows');
    setCurrentScreen('slideshows');
  };

  const handleCreateNew = () => {
    console.log('Create new slideshow');
    setCurrentScreen('library');
  };

  const handleBack = () => {
    if (currentScreen === 'metadata-edit') {
      setCurrentScreen('preview');
    } else {
      setCurrentScreen('home');
    }
  };

  const handlePreview = (slideshow: any) => {
    setCurrentSlideshow(slideshow);
    setCurrentScreen('preview');
  };

  const handleSlideshowUpdate = (updatedSlideshow: any) => {
    console.log('📝 Updating current slideshow state with:', updatedSlideshow);
    setCurrentSlideshow(updatedSlideshow);
  };

  const handleExport = (slideshow: any) => {
    console.log('Exporting slideshow:', slideshow);
    setCurrentScreen('home');
  };

  const handleEditMetadata = (slideshow: any) => {
    console.log('Edit metadata:', slideshow);
    setCurrentSlideshow(slideshow);
    setCurrentScreen('metadata-edit');
  };

  const handleSaveMetadata = (slideshow: any) => {
    console.log('Save metadata:', slideshow);
    setCurrentSlideshow(slideshow);
    // Could navigate back to preview or show success message
    setCurrentScreen('preview');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'library':
        return <AssetLibraryScreen onBack={handleBack} onNavigateToSlideshows={handleViewSlideshows} />;
      case 'slideshows':
        return <MySlideshowsScreen onBack={handleBack} onCreateNew={handleCreateNew} onEditSlideshow={handlePreview} />;
      case 'magic-create':
        return <MagicCreateScreen onBack={handleBack} onPreview={handlePreview} />;
      case 'preview':
        return currentSlideshow ? (
          <PreviewScreen 
            slideshow={currentSlideshow} 
            onBack={handleBack} 
            onExport={handleExport} 
            onEditMetadata={handleEditMetadata}
            onSlideshowUpdate={handleSlideshowUpdate}
          />
        ) : null;
      case 'metadata-edit':
        return currentSlideshow ? (
          <MetadataEditScreen 
            slideshow={currentSlideshow} 
            onBack={handleBack} 
            onSave={handleSaveMetadata}
            onExport={handleExport}
          />
        ) : null;
      default:
        return (
          <HomeScreen
            onMagicCreate={handleMagicCreate}
            onViewLibrary={handleViewLibrary}
            onViewSlideshows={handleViewSlideshows}
            onVoiceCreate={handleMagicCreate} // Direct to voice creation
            onPreviewSlideshow={handlePreview} // Open slideshow in preview
            // analysisProgress={75} // Uncomment to show analysis progress
          />
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <ToastContainer />
      <StatusBar style="light" />
    </>
  );
}