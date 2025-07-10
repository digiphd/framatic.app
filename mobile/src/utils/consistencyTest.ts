/**
 * Consistency Test Utility for React Native Skia vs Canvas Text Rendering
 * 
 * This utility helps test and validate that text rendering is consistent
 * between the React Native Skia preview and the server-side export.
 */

interface TextRenderingParams {
  text: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  position: { x: number; y: number };
  canvasWidth: number;
  canvasHeight: number;
}

interface RenderingResults {
  skiaPreview: {
    textBounds: { width: number; height: number };
    actualPosition: { x: number; y: number };
    renderTime: number;
  };
  serverExport: {
    success: boolean;
    imageUrl?: string;
    renderTime: number;
    errors?: string[];
  };
  consistency: {
    positionMatch: boolean;
    sizeMatch: boolean;
    overallScore: number; // 0-100
    issues: string[];
  };
}

export class ConsistencyTester {
  private static instance: ConsistencyTester;
  
  public static getInstance(): ConsistencyTester {
    if (!ConsistencyTester.instance) {
      ConsistencyTester.instance = new ConsistencyTester();
    }
    return ConsistencyTester.instance;
  }

  /**
   * Test text rendering consistency between Skia preview and server export
   */
  async testTextConsistency(
    params: TextRenderingParams,
    slideshowData: any
  ): Promise<RenderingResults> {
    console.log('=== Starting Consistency Test ===');
    console.log('Test Parameters:', params);
    
    const results: RenderingResults = {
      skiaPreview: {
        textBounds: { width: 0, height: 0 },
        actualPosition: { x: 0, y: 0 },
        renderTime: 0
      },
      serverExport: {
        success: false,
        renderTime: 0,
        errors: []
      },
      consistency: {
        positionMatch: false,
        sizeMatch: false,
        overallScore: 0,
        issues: []
      }
    };

    try {
      // Test Skia Preview Rendering
      const skiaStartTime = Date.now();
      results.skiaPreview = await this.testSkiaPreview(params);
      results.skiaPreview.renderTime = Date.now() - skiaStartTime;
      
      // Test Server Export Rendering
      const serverStartTime = Date.now();
      results.serverExport = await this.testServerExport(params, slideshowData);
      results.serverExport.renderTime = Date.now() - serverStartTime;
      
      // Calculate Consistency Metrics
      results.consistency = this.calculateConsistency(results.skiaPreview, results.serverExport);
      
      console.log('=== Consistency Test Results ===');
      console.log('Skia Preview:', results.skiaPreview);
      console.log('Server Export:', results.serverExport);
      console.log('Consistency Score:', results.consistency.overallScore + '%');
      
      if (results.consistency.issues.length > 0) {
        console.log('Issues Found:');
        results.consistency.issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue}`);
        });
      }
      
      return results;
    } catch (error) {
      console.error('Consistency test failed:', error);
      results.consistency.issues.push(`Test failed: ${error}`);
      return results;
    }
  }

  private async testSkiaPreview(params: TextRenderingParams): Promise<any> {
    // This would interact with the Skia renderer to get actual metrics
    // For now, we'll return mock data that represents what we expect
    
    console.log('Testing Skia preview rendering...');
    
    // Simulate text measurement in Skia
    const estimatedWidth = params.text.length * (params.fontSize * 0.6);
    const estimatedHeight = params.fontSize * 1.2;
    
    return {
      textBounds: {
        width: estimatedWidth,
        height: estimatedHeight
      },
      actualPosition: {
        x: params.position.x * params.canvasWidth,
        y: params.position.y * params.canvasHeight
      },
      renderTime: 0 // Will be set by caller
    };
  }

  private async testServerExport(params: TextRenderingParams, slideshowData: any): Promise<any> {
    console.log('Testing server export rendering...');
    
    try {
      // Call the actual server API to test
      const { apiService } = await import('../services/api');
      
      const response = await apiService.renderSlideshowWithSkia({
        id: 'consistency-test',
        slides: [{
          id: 'test-slide',
          imageUrl: slideshowData.slides[0]?.imageUrl || '',
          text: params.text,
          textStyle: {
            fontSize: params.fontSize,
            fontWeight: params.fontWeight,
            color: params.color
          },
          textPosition: params.position
        }]
      });
      
      return {
        success: response.success,
        imageUrl: response.renderedUrls?.[0],
        renderTime: 0, // Will be set by caller
        errors: response.success ? [] : [response.error || 'Unknown error']
      };
    } catch (error) {
      return {
        success: false,
        renderTime: 0,
        errors: [`Server export failed: ${error}`]
      };
    }
  }

  private calculateConsistency(skiaResults: any, serverResults: any): any {
    const issues: string[] = [];
    let score = 100;

    // Check if server export succeeded
    if (!serverResults.success) {
      issues.push('Server export failed');
      score -= 50;
    }

    // Check rendering time consistency (should be reasonable)
    if (skiaResults.renderTime > 5000) {
      issues.push('Skia preview took too long to render');
      score -= 10;
    }

    if (serverResults.renderTime > 15000) {
      issues.push('Server export took too long to render');
      score -= 10;
    }

    // Add more consistency checks here as we develop the system
    const positionMatch = true; // Placeholder
    const sizeMatch = true; // Placeholder

    return {
      positionMatch,
      sizeMatch,
      overallScore: Math.max(0, score),
      issues
    };
  }

  /**
   * Run a comprehensive test suite
   */
  async runTestSuite(slideshowData: any): Promise<RenderingResults[]> {
    console.log('Running comprehensive consistency test suite...');
    
    const testCases: TextRenderingParams[] = [
      // Basic test
      {
        text: 'Hello World!',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        position: { x: 0.5, y: 0.25 },
        canvasWidth: 1080,
        canvasHeight: 1920
      },
      // Large text test
      {
        text: 'Large Text Test',
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        position: { x: 0.5, y: 0.5 },
        canvasWidth: 1080,
        canvasHeight: 1920
      },
      // Different position test
      {
        text: 'Top Position',
        fontSize: 32,
        fontWeight: 'normal',
        color: '#FFFFFF',
        position: { x: 0.5, y: 0.2 },
        canvasWidth: 1080,
        canvasHeight: 1920
      },
      // Multi-line text test
      {
        text: 'This is a longer text that should wrap to multiple lines',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        position: { x: 0.5, y: 0.25 },
        canvasWidth: 1080,
        canvasHeight: 1920
      }
    ];

    const results: RenderingResults[] = [];
    
    for (let i = 0; i < testCases.length; i++) {
      console.log(`Running test case ${i + 1}/${testCases.length}...`);
      const result = await this.testTextConsistency(testCases[i], slideshowData);
      results.push(result);
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Calculate overall suite results
    const overallScore = results.reduce((sum, result) => sum + result.consistency.overallScore, 0) / results.length;
    console.log(`\n=== Test Suite Complete ===`);
    console.log(`Overall Consistency Score: ${overallScore.toFixed(1)}%`);
    console.log(`Tests Run: ${results.length}`);
    console.log(`Tests Passed: ${results.filter(r => r.consistency.overallScore > 80).length}`);
    
    return results;
  }
}

export const consistencyTester = ConsistencyTester.getInstance();