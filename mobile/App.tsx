import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/components/screens/HomeScreen';

export default function App() {
  const handleMagicCreate = () => {
    console.log('Magic Create pressed! 🪄');
    // TODO: Navigate to MagicCreateScreen
  };

  const handleTemplateSelect = (template: string) => {
    console.log('Template selected:', template);
    // TODO: Navigate to template customization or direct creation
  };

  return (
    <>
      <HomeScreen
        onMagicCreate={handleMagicCreate}
        onTemplateSelect={handleTemplateSelect}
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
      <StatusBar style="light" />
    </>
  );
}