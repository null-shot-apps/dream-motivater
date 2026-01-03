/**
 * AI Configuration
 * 
 * Add your FREE API keys here to enable real AI features!
 * 
 * ============================================
 * HOW TO GET FREE API KEYS:
 * ============================================
 * 
 * 1. HUGGING FACE (Recommended - Easy to get)
 *    - Sign up: https://huggingface.co/join
 *    - Get API key: https://huggingface.co/settings/tokens
 *    - Free tier: Unlimited inference API calls
 * 
 * 2. COHERE (Good for text generation)
 *    - Sign up: https://dashboard.cohere.com/welcome/register
 *    - Get API key: https://dashboard.cohere.com/api-keys
 *    - Free tier: 1000 calls/month
 * 
 * 3. TOGETHER AI (Fast and reliable)
 *    - Sign up: https://api.together.xyz/signup
 *    - Get API key: https://api.together.xyz/settings/api-keys
 *    - Free tier: $25 free credit
 * 
 * 4. GROQ (Very fast inference)
 *    - Sign up: https://console.groq.com/signup
 *    - Get API key: https://console.groq.com/keys
 *    - Free tier: Available
 * 
 * ============================================
 * SETUP INSTRUCTIONS:
 * ============================================
 * 
 * 1. Choose one or more providers above
 * 2. Sign up and get your API key
 * 3. Paste your API key(s) below (replace the empty strings)
 * 4. Save this file
 * 5. The app will automatically use AI features!
 * 
 * NOTE: Your API keys are stored locally and never sent anywhere
 * except to the respective AI provider APIs.
 */

export const AI_CONFIG = {
  // Paste your API keys here:
  huggingFaceApiKey: '', // Get from: https://huggingface.co/settings/tokens
  cohereApiKey: '',      // Get from: https://dashboard.cohere.com/api-keys
  togetherApiKey: '',    // Get from: https://api.together.xyz/settings/api-keys
  groqApiKey: '',        // Get from: https://console.groq.com/keys
  
  // Which provider to use first (will fallback to others if this fails)
  preferredProvider: 'huggingface' as 'huggingface' | 'cohere' | 'together' | 'groq',
  
  // Enable/disable AI features (set to false to use rule-based logic only)
  enableAI: true,
};

/**
 * Initialize AI service with your configuration
 * This is called automatically when the app starts
 */
export function getAIConfig() {
  // Check if any API key is provided
  const hasApiKey = 
    AI_CONFIG.huggingFaceApiKey ||
    AI_CONFIG.cohereApiKey ||
    AI_CONFIG.togetherApiKey ||
    AI_CONFIG.groqApiKey;

  if (!hasApiKey && AI_CONFIG.enableAI) {
    console.warn(
      '⚠️ No AI API keys configured. Using rule-based logic.\n' +
      'To enable AI features, add your API keys in src/config/ai-config.ts\n' +
      'See instructions in the file for how to get FREE API keys!'
    );
  }

  return {
    huggingFaceApiKey: AI_CONFIG.huggingFaceApiKey || undefined,
    cohereApiKey: AI_CONFIG.cohereApiKey || undefined,
    togetherApiKey: AI_CONFIG.togetherApiKey || undefined,
    groqApiKey: AI_CONFIG.groqApiKey || undefined,
    preferredProvider: AI_CONFIG.preferredProvider,
  };
}

