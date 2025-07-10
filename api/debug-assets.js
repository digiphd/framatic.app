const { db } = require('./src/lib/supabase/client.ts');

const MVP_USER_ID = '00000000-0000-0000-0000-000000000001';

async function debugAssets() {
  try {
    console.log('🔍 Debugging asset query issue...\n');
    
    // Get ALL assets to see what's available
    const allAssets = await db.getAllAssets(MVP_USER_ID, 50);
    console.log(`Total assets found: ${allAssets.length}\n`);
    
    // Show all assets with their scores and tags
    allAssets.forEach((asset, index) => {
      console.log(`Asset ${index + 1}:`);
      console.log(`  ID: ${asset.id.substring(0, 8)}...`);
      console.log(`  File: ${asset.original_filename || 'Unknown'}`);
      console.log(`  Viral Score: ${asset.viral_potential_score || 'N/A'}`);
      console.log(`  Quality Score: ${asset.quality_score || 'N/A'}`);
      console.log(`  Status: ${asset.analysis_status}`);
      console.log(`  Description: ${asset.ai_analysis?.scene_description || 'N/A'}`);
      console.log(`  Tags: [${asset.ai_analysis?.tags?.join(', ') || 'N/A'}]`);
      console.log(`  Emotions: [${asset.ai_analysis?.emotions?.join(', ') || 'N/A'}]`);
      console.log(`  Created: ${asset.created_at}`);
      console.log('---');
    });
    
    console.log('\n🎯 Testing getAnalyzedAssets with limit 10:');
    const analyzedAssets = await db.getAnalyzedAssets(MVP_USER_ID, 10);
    console.log(`Assets returned by getAnalyzedAssets: ${analyzedAssets.length}`);
    
    analyzedAssets.forEach((asset, index) => {
      console.log(`  ${index + 1}. Score: ${asset.viral_potential_score || 'N/A'}, Tags: [${asset.ai_analysis?.tags?.join(', ') || 'N/A'}]`);
    });
    
    // Check specifically for aviation/museum assets
    console.log('\n✈️  Looking for aviation/museum assets:');
    const aviationAssets = allAssets.filter(asset => {
      const tags = asset.ai_analysis?.tags || [];
      const description = asset.ai_analysis?.scene_description || '';
      const hasAviation = tags.some(tag => 
        ['aviation', 'aircraft', 'plane', 'museum', 'military', 'vintage aircraft', 'air force'].includes(tag.toLowerCase())
      );
      const hasAviationDescription = description.toLowerCase().includes('aircraft') || 
                                   description.toLowerCase().includes('museum') || 
                                   description.toLowerCase().includes('plane');
      return hasAviation || hasAviationDescription;
    });
    
    console.log(`Aviation-related assets found: ${aviationAssets.length}`);
    aviationAssets.forEach((asset, index) => {
      console.log(`  ${index + 1}. Score: ${asset.viral_potential_score || 'N/A'}, Description: ${asset.ai_analysis?.scene_description || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugAssets();