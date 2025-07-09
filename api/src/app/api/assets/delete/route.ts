import { NextRequest, NextResponse } from 'next/server';
import { deleteFromR2, extractKeyFromUrl } from '@/lib/r2/client';
import { db } from '@/lib/supabase/client';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('id');
    const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000001';

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // Get asset details to find R2 URL
    const asset = await db.getAsset(assetId);
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Verify user owns the asset
    if (asset.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this asset' },
        { status: 403 }
      );
    }

    try {
      // Delete from R2 storage
      const r2Key = extractKeyFromUrl(asset.r2_url);
      await deleteFromR2(r2Key);
      console.log('Deleted from R2:', r2Key);
    } catch (r2Error) {
      console.error('Failed to delete from R2:', r2Error);
      // Continue with database deletion even if R2 fails
    }

    // Delete from database
    await db.deleteAsset(assetId);
    console.log('Deleted from database:', assetId);

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully',
      assetId
    });

  } catch (error) {
    console.error('Delete asset error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete asset',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { assetIds, userId = '00000000-0000-0000-0000-000000000001' } = await request.json();

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'Asset IDs array is required' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Process deletions in parallel
    const deletePromises = assetIds.map(async (assetId: string) => {
      try {
        // Get asset details
        const asset = await db.getAsset(assetId);
        if (!asset) {
          throw new Error(`Asset ${assetId} not found`);
        }

        // Verify user owns the asset
        if (asset.user_id !== userId) {
          throw new Error(`Unauthorized to delete asset ${assetId}`);
        }

        // Delete from R2 storage
        try {
          const r2Key = extractKeyFromUrl(asset.r2_url);
          await deleteFromR2(r2Key);
          console.log('Deleted from R2:', r2Key);
        } catch (r2Error) {
          console.error(`Failed to delete ${assetId} from R2:`, r2Error);
          // Continue with database deletion
        }

        // Delete from database
        await db.deleteAsset(assetId);
        console.log('Deleted from database:', assetId);

        return { success: true, assetId };
      } catch (error) {
        console.error(`Failed to delete asset ${assetId}:`, error);
        return { 
          success: false, 
          assetId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const deleteResults = await Promise.all(deletePromises);
    
    deleteResults.forEach(result => {
      if (result.success) {
        results.push(result.assetId);
      } else {
        errors.push({ assetId: result.assetId, error: result.error });
      }
    });

    return NextResponse.json({
      success: true,
      deleted: results.length,
      total: assetIds.length,
      failed: errors.length,
      deletedAssets: results,
      errors,
      message: `Successfully deleted ${results.length}/${assetIds.length} assets`
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete assets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}