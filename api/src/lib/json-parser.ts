// Robust JSON parser for AI responses that might include markdown code blocks

export function parseAIResponse(content: string): any {
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid AI response content');
  }

  // Try direct JSON parsing first
  try {
    return JSON.parse(content);
  } catch (firstError) {
    // If that fails, try to extract JSON from markdown code blocks
    try {
      // Remove markdown code blocks (```json ... ```)
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to find JSON object in the content
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonStr = content.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonStr);
      }

      // If all else fails, throw original error
      throw firstError;
    } catch (secondError) {
      console.error('Failed to parse AI response:', {
        content: content.substring(0, 500) + '...',
        error: secondError
      });
      throw new Error(`Failed to parse AI response: ${firstError.message}`);
    }
  }
}

// Safe JSON parser that returns null on failure
export function safeParseAIResponse(content: string): any | null {
  try {
    return parseAIResponse(content);
  } catch (error) {
    console.error('Safe JSON parse failed:', error);
    return null;
  }
}

// Validate that parsed JSON has expected structure
export function validateAIResponse(parsed: any, requiredFields: string[]): boolean {
  if (!parsed || typeof parsed !== 'object') {
    return false;
  }

  return requiredFields.every(field => {
    const keys = field.split('.');
    let current = parsed;
    
    for (const key of keys) {
      if (!current || typeof current !== 'object' || !(key in current)) {
        return false;
      }
      current = current[key];
    }
    
    return true;
  });
}