/**
 * Safe JSON parsing utilities to prevent crashes from malformed JSON
 */

export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.warn('⚠️ Failed to parse JSON, using fallback:', {
      input: jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''),
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback
    });
    return fallback;
  }
}

export function safeJsonStringify(value: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('⚠️ Failed to stringify JSON, using fallback:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback
    });
    return fallback;
  }
}

export function isValidJsonString(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely handles potentially corrupted agent memory data
 */
export function safeParseAgentMemory(memoryData: any) {
  const defaultMemory = {
    weeklyGoals: 'No weekly goals set',
    recentLearnings: [],
    preferences: [],
    skillsUnlocked: [],
    memoryLogs: []
  };

  if (!memoryData) {
    return defaultMemory;
  }

  // If it's already an object, validate its structure
  if (typeof memoryData === 'object' && !Array.isArray(memoryData)) {
    return {
      weeklyGoals: memoryData.weeklyGoals || defaultMemory.weeklyGoals,
      recentLearnings: Array.isArray(memoryData.recentLearnings) ? memoryData.recentLearnings : defaultMemory.recentLearnings,
      preferences: Array.isArray(memoryData.preferences) ? memoryData.preferences : defaultMemory.preferences,
      skillsUnlocked: Array.isArray(memoryData.skillsUnlocked) ? memoryData.skillsUnlocked : defaultMemory.skillsUnlocked,
      memoryLogs: Array.isArray(memoryData.memoryLogs) ? memoryData.memoryLogs : defaultMemory.memoryLogs
    };
  }

  // If it's a string, try to parse it safely
  if (typeof memoryData === 'string') {
    const parsed = safeJsonParse(memoryData, defaultMemory);
    return safeParseAgentMemory(parsed); // Recursive call to validate structure
  }

  return defaultMemory;
} 