# 🤖 AI Setup Guide - Dream Career App

## Overview

Your Dream Career App now has **intelligent AI features** that can analyze documents, generate personalized roadmaps, and provide smart recommendations. The app works great without AI (using rule-based logic), but adding free AI APIs makes it even more powerful!

---

## ✨ Features Available

### Without AI APIs (Rule-Based Logic)
- ✅ Searchable goals and skills
- ✅ Multiple primary/secondary goals
- ✅ Dynamic roadmap generation
- ✅ Progressive project recommendations
- ✅ Job matching
- ✅ Resume building
- ✅ Basic document analysis

### With AI APIs (Enhanced Intelligence)
- 🚀 **Smart document analysis** - AI reads your resume/roadmap and provides detailed suggestions
- 🚀 **Natural language understanding** - Better interpretation of your goals and skills
- 🚀 **Personalized recommendations** - More accurate project and resource suggestions
- 🚀 **Intelligent insights** - Deeper analysis of your career path

---

## 🆓 Free AI Providers

All these providers offer **FREE tiers** - no credit card required for basic usage!

### 1. Hugging Face (Recommended - Easiest)
- **Free Tier**: Unlimited inference API calls
- **Best For**: Document analysis, text summarization
- **Sign Up**: https://huggingface.co/join
- **Get API Key**: https://huggingface.co/settings/tokens
- **Steps**:
  1. Create account
  2. Go to Settings → Access Tokens
  3. Click "New token"
  4. Copy your token

### 2. Cohere
- **Free Tier**: 1,000 calls/month
- **Best For**: Text generation, analysis
- **Sign Up**: https://dashboard.cohere.com/welcome/register
- **Get API Key**: https://dashboard.cohere.com/api-keys
- **Steps**:
  1. Create account
  2. Go to API Keys section
  3. Copy your production key

### 3. Together AI
- **Free Tier**: $25 free credit (lasts a long time!)
- **Best For**: Fast inference, multiple models
- **Sign Up**: https://api.together.xyz/signup
- **Get API Key**: https://api.together.xyz/settings/api-keys
- **Steps**:
  1. Create account
  2. Go to Settings → API Keys
  3. Create new key
  4. Copy your key

### 4. Groq
- **Free Tier**: Available (very fast!)
- **Best For**: Ultra-fast inference
- **Sign Up**: https://console.groq.com/signup
- **Get API Key**: https://console.groq.com/keys
- **Steps**:
  1. Create account
  2. Go to API Keys
  3. Create new key
  4. Copy your key

---

## 🔧 Setup Instructions

### Step 1: Choose a Provider
Pick one or more providers from the list above. **Hugging Face** is recommended for beginners.

### Step 2: Get Your API Key
Follow the steps for your chosen provider to get a free API key.

### Step 3: Add API Key to Config
Open the file: `src/config/ai-config.ts`

```typescript
export const AI_CONFIG = {
  // Paste your API key here:
  huggingFaceApiKey: 'hf_xxxxxxxxxxxxxxxxxxxxx', // ← Your key here
  cohereApiKey: '',      // Optional
  togetherApiKey: '',    // Optional
  groqApiKey: '',        // Optional
  
  preferredProvider: 'huggingface', // Which one to use first
  enableAI: true,
};
```

### Step 4: Save and Restart
Save the file and restart your dev server. The app will automatically use AI features!

---

## 📊 How It Works

### Document Analysis Flow
1. User uploads resume or roadmap (PDF/TXT)
2. App extracts text from document
3. AI analyzes the content
4. Returns:
   - Summary of the document
   - 3+ actionable suggestions
   - 2+ improvement recommendations
   - Confidence score

### Fallback System
The app is smart! If an AI API fails or isn't configured:
1. Tries the preferred provider first
2. Falls back to other configured providers
3. Finally uses rule-based logic (always works!)

This means your app **never breaks** - it just gets smarter with AI!

---

## 🎯 Using the Features

### Profile Page
1. Click **Profile** tab in navigation
2. Edit your goals, skills, experience
3. Upload documents:
   - **Resume**: Get suggestions to improve it
   - **Roadmap**: Get AI feedback on your learning plan

### Searchable Goals & Skills
- Type to search for any career goal
- Add multiple primary goals (e.g., "Data Analyst")
- Add secondary goals (e.g., "Age Care Worker")
- Search and add any skill
- No fixed lists - fully flexible!

### Document Upload
- Supports PDF and TXT files
- Max 10MB file size
- AI analyzes and provides:
  - Summary
  - Suggestions
  - Improvements
  - Confidence score
- View past analyses anytime

---

## 🔒 Privacy & Security

### Your Data is Safe
- ✅ API keys stored locally in your code (not in database)
- ✅ Documents processed in-browser
- ✅ Only text sent to AI APIs (not files)
- ✅ No data stored on external servers
- ✅ All user data in localStorage (your device only)

### What Gets Sent to AI APIs
- Document text (first 1000-2000 characters)
- Analysis prompts
- Nothing else!

---

## 🐛 Troubleshooting

### "No AI API keys configured" Warning
This is normal! The app works fine without AI. To enable AI:
1. Get a free API key (see above)
2. Add it to `src/config/ai-config.ts`
3. Restart the app

### API Request Failed
If an API call fails:
1. Check your API key is correct
2. Check you haven't exceeded free tier limits
3. The app will automatically fall back to rule-based logic

### Document Upload Not Working
1. Check file is PDF or TXT
2. Check file is under 10MB
3. Try a different file format

---

## 💡 Tips for Best Results

### For Document Analysis
- Upload clear, well-formatted documents
- PDFs work better than scanned images
- Include relevant keywords in your resume
- Structure your roadmap with clear sections

### For Goal Selection
- Be specific (e.g., "Frontend Developer" not just "Developer")
- Add multiple goals if you have diverse interests
- Include both technical and soft skills

### For API Usage
- Start with Hugging Face (easiest to set up)
- Add multiple providers for redundancy
- Free tiers are generous - don't worry about limits

---

## 📈 What's Next?

### Current Features
- ✅ Searchable goals/skills
- ✅ Multiple goal selection
- ✅ PDF/TXT upload
- ✅ AI document analysis
- ✅ Profile management
- ✅ 4 free AI providers

### Future Enhancements
- Real-time AI chat for career advice
- More AI providers (OpenAI, Anthropic)
- Voice input for goals
- Image upload for handwritten notes
- AI-powered interview prep

---

## 🎉 You're All Set!

Your Dream Career App is now ready to use with or without AI. Start by:

1. **Complete onboarding** - Add your goals and skills
2. **Upload documents** - Get AI feedback
3. **Explore features** - Roadmap, projects, jobs, resume
4. **Track progress** - Watch your career grow!

Need help? Check the code comments or create an issue on GitHub.

**Happy learning! 🚀**

