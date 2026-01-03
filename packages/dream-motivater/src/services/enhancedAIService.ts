/**
 * Enhanced AI Service with Real API Integration
 * 
 * Supports multiple FREE AI providers:
 * 1. Hugging Face Inference API (free tier) - https://huggingface.co/inference-api
 * 2. Cohere API (free tier) - https://cohere.com
 * 3. Together AI (free tier) - https://together.ai
 * 4. Groq (free tier) - https://groq.com
 * 
 * HOW TO GET FREE API KEYS:
 * - Hugging Face: Sign up at https://huggingface.co → Settings → Access Tokens
 * - Cohere: Sign up at https://dashboard.cohere.com → API Keys (1000 free calls/month)
 * - Together AI: Sign up at https://api.together.xyz → API Keys ($25 free credit)
 * - Groq: Sign up at https://console.groq.com → API Keys (free tier available)
 */

import { ParsedDocument } from '@/utils/fileUtils';

export interface EnhancedUserProfile {
  primaryGoals: string[]; // Multiple primary goals
  secondaryGoals: string[]; // Multiple secondary goals
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  weeklyHours: number;
  skills: string[]; // User's current skills
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed';
  uploadedResume?: ParsedDocument;
  uploadedRoadmap?: ParsedDocument;
}

export interface AIAnalysis {
  summary: string;
  suggestions: string[];
  improvements: string[];
  confidence: number;
}

export interface LearningResource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'course' | 'book' | 'practice' | 'documentation';
  provider: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  rating?: number;
  isFree: boolean;
}

export interface ProgressiveProject {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  newConcepts: string[]; // What new things user will learn
  estimatedHours: number;
  confidenceBoost: number; // 1-10 scale
  jobRelevance: number; // 1-10 scale
  prerequisites: string[];
  learningOutcomes: string[];
}

type AIProvider = 'huggingface' | 'cohere' | 'together' | 'groq';

class EnhancedAIService {
  private apiKeys: Record<AIProvider, string | null> = {
    huggingface: null,
    cohere: null,
    together: null,
    groq: null,
  };
  private useRealAPI = false;
  private preferredProvider: AIProvider = 'huggingface';

  /**
   * Initialize with API keys (optional)
   * Get free API keys from:
   * - Hugging Face: https://huggingface.co/settings/tokens
   * - Cohere: https://dashboard.cohere.com/api-keys
   * - Together AI: https://api.together.xyz/settings/api-keys
   * - Groq: https://console.groq.com/keys
   */
  initialize(config?: { 
    huggingFaceApiKey?: string;
    cohereApiKey?: string;
    togetherApiKey?: string;
    groqApiKey?: string;
    preferredProvider?: AIProvider;
  }) {
    if (config?.huggingFaceApiKey) {
      this.apiKeys.huggingface = config.huggingFaceApiKey;
      this.useRealAPI = true;
    }
    if (config?.cohereApiKey) {
      this.apiKeys.cohere = config.cohereApiKey;
      this.useRealAPI = true;
    }
    if (config?.togetherApiKey) {
      this.apiKeys.together = config.togetherApiKey;
      this.useRealAPI = true;
    }
    if (config?.groqApiKey) {
      this.apiKeys.groq = config.groqApiKey;
      this.useRealAPI = true;
    }
    if (config?.preferredProvider) {
      this.preferredProvider = config.preferredProvider;
    }
  }

  /**
   * Analyze uploaded resume
   */
  async analyzeResume(document: ParsedDocument): Promise<AIAnalysis> {
    if (this.useRealAPI) {
      // Try preferred provider first, then fallback to others
      const providers: AIProvider[] = [
        this.preferredProvider,
        ...(['huggingface', 'cohere', 'together', 'groq'] as AIProvider[]).filter(
          p => p !== this.preferredProvider && this.apiKeys[p]
        ),
      ];

      for (const provider of providers) {
        if (this.apiKeys[provider]) {
          try {
            return await this.analyzeWithAI(document.text, 'resume', provider);
          } catch (error) {
            console.error(`${provider} API failed, trying next provider...`, error);
          }
        }
      }
    }

    // Fallback: Rule-based analysis
    return this.analyzeResumeRuleBased(document.text);
  }

  /**
   * Analyze uploaded roadmap
   */
  async analyzeRoadmap(document: ParsedDocument): Promise<AIAnalysis> {
    if (this.useRealAPI) {
      // Try preferred provider first, then fallback to others
      const providers: AIProvider[] = [
        this.preferredProvider,
        ...(['huggingface', 'cohere', 'together', 'groq'] as AIProvider[]).filter(
          p => p !== this.preferredProvider && this.apiKeys[p]
        ),
      ];

      for (const provider of providers) {
        if (this.apiKeys[provider]) {
          try {
            return await this.analyzeWithAI(document.text, 'roadmap', provider);
          } catch (error) {
            console.error(`${provider} API failed, trying next provider...`, error);
          }
        }
      }
    }

    // Fallback: Rule-based analysis
    return this.analyzeRoadmapRuleBased(document.text);
  }

  /**
   * Get learning resources from free sources
   */
  async getLearningResources(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    learningStyle: string
  ): Promise<LearningResource[]> {
    // Curated free resources
    const resources: LearningResource[] = [];

    // Add resources based on topic and difficulty
    const topicResources = this.getFreeResourcesForTopic(topic, difficulty);
    
    // Filter and sort by learning style
    const filtered = topicResources.filter(r => {
      if (learningStyle === 'visual') return r.type === 'video' || r.type === 'course';
      if (learningStyle === 'hands-on') return r.type === 'practice' || r.type === 'course';
      if (learningStyle === 'reading') return r.type === 'article' || r.type === 'documentation';
      return true; // mixed
    });

    resources.push(...filtered);

    // Always include some variety
    if (resources.length < 5) {
      resources.push(...topicResources.slice(0, 5 - resources.length));
    }

    return resources.slice(0, 10);
  }

  /**
   * Generate progressive projects (beginner → intermediate → advanced)
   */
  generateProgressiveProjects(
    goals: string[],
    currentSkills: string[],
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  ): ProgressiveProject[] {
    const allProjects = this.getProjectDatabase();

    // Filter projects relevant to goals
    const relevantProjects = allProjects.filter(project =>
      goals.some(goal => 
        project.skills.some(skill => 
          goal.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(goal.toLowerCase())
        )
      )
    );

    // Create progression: beginner → intermediate → advanced
    const progression: ProgressiveProject[] = [];

    // Start with beginner projects
    const beginnerProjects = relevantProjects
      .filter(p => p.difficulty === 'beginner')
      .filter(p => this.hasPrerequisites(p, currentSkills))
      .sort((a, b) => b.confidenceBoost - a.confidenceBoost)
      .slice(0, 2);

    progression.push(...beginnerProjects);

    // Add intermediate projects that build on beginner skills
    const learnedSkills = [...currentSkills, ...beginnerProjects.flatMap(p => p.skills)];
    const intermediateProjects = relevantProjects
      .filter(p => p.difficulty === 'intermediate')
      .filter(p => this.hasPrerequisites(p, learnedSkills))
      .sort((a, b) => b.jobRelevance - a.jobRelevance)
      .slice(0, 2);

    progression.push(...intermediateProjects);

    // Add advanced projects if user is ready
    if (experienceLevel !== 'beginner') {
      const allLearnedSkills = [...learnedSkills, ...intermediateProjects.flatMap(p => p.skills)];
      const advancedProjects = relevantProjects
        .filter(p => p.difficulty === 'advanced')
        .filter(p => this.hasPrerequisites(p, allLearnedSkills))
        .sort((a, b) => b.jobRelevance - a.jobRelevance)
        .slice(0, 2);

      progression.push(...advancedProjects);
    }

    return progression;
  }

  /**
   * Search for goals (not fixed list - users can add ANY custom goal)
   */
  searchGoals(query: string): string[] {
    const allGoals = [
      // Software Development
      'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
      'Mobile Developer', 'iOS Developer', 'Android Developer',
      'React Developer', 'Vue Developer', 'Angular Developer',
      'Node.js Developer', 'Python Developer', 'Java Developer',
      'C# Developer', 'PHP Developer', 'Ruby Developer',
      'Game Developer', 'Unity Developer', 'Unreal Engine Developer',
      'Embedded Systems Developer', 'Firmware Engineer',
      
      // Data & AI
      'Data Analyst', 'Data Scientist', 'Machine Learning Engineer',
      'AI Engineer', 'Deep Learning Engineer', 'NLP Engineer',
      'Data Engineer', 'Business Intelligence Analyst',
      'Quantitative Analyst', 'Research Scientist',
      
      // DevOps & Cloud
      'DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer',
      'Platform Engineer', 'Infrastructure Engineer',
      'AWS Solutions Architect', 'Azure Administrator', 'GCP Engineer',
      'Kubernetes Administrator', 'Docker Specialist',
      
      // Security
      'Security Engineer', 'Cybersecurity Analyst', 'Penetration Tester',
      'Security Architect', 'Ethical Hacker', 'SOC Analyst',
      'Information Security Analyst', 'Cryptographer',
      
      // Design & Product
      'UI/UX Designer', 'Product Designer', 'Graphic Designer',
      'Web Designer', 'Motion Graphics Designer', '3D Designer',
      'Product Manager', 'Technical Product Manager',
      'UX Researcher', 'Design Systems Designer',
      
      // QA & Testing
      'QA Engineer', 'Test Automation Engineer', 'QA Analyst',
      'Performance Tester', 'Manual Tester',
      
      // Business & Marketing
      'Digital Marketing Specialist', 'SEO Specialist', 'Content Marketer',
      'Social Media Manager', 'Email Marketing Specialist',
      'Growth Hacker', 'Marketing Analyst', 'Brand Manager',
      'Business Analyst', 'Systems Analyst', 'Project Manager',
      'Scrum Master', 'Agile Coach', 'Product Owner',
      
      // Content & Creative
      'Content Writer', 'Technical Writer', 'Copywriter',
      'Video Editor', 'Photographer', 'Illustrator',
      'Animator', 'Voice Actor', 'Podcast Producer',
      
      // Healthcare & Care
      'Age Care Worker', 'Disability Support Worker', 'Nurse',
      'Healthcare Assistant', 'Mental Health Worker',
      'Occupational Therapist', 'Physiotherapist',
      
      // Customer Service & Support
      'Customer Service Representative', 'Technical Support Specialist',
      'Help Desk Technician', 'Customer Success Manager',
      'Account Manager', 'Sales Representative',
      
      // Administrative & Office
      'Administrative Assistant', 'Executive Assistant',
      'Office Manager', 'Receptionist', 'Data Entry Clerk',
      'Virtual Assistant', 'Personal Assistant',
      
      // Retail & Hospitality
      'Retail Assistant', 'Store Manager', 'Cashier',
      'Barista', 'Waiter/Waitress', 'Chef', 'Cook',
      'Hotel Receptionist', 'Event Coordinator',
      
      // Education & Training
      'Teacher', 'Tutor', 'Online Instructor', 'Corporate Trainer',
      'Educational Content Creator', 'Curriculum Developer',
      
      // Freelance & Entrepreneurship
      'Freelance Developer', 'Freelance Designer', 'Freelance Writer',
      'Consultant', 'Entrepreneur', 'Startup Founder',
      'E-commerce Store Owner', 'Affiliate Marketer',
      
      // Other Tech Roles
      'Blockchain Developer', 'Smart Contract Developer',
      'AR/VR Developer', 'IoT Developer', 'Robotics Engineer',
      'Database Administrator', 'Network Engineer',
      'Systems Administrator', 'IT Support Specialist',
    ];

    if (!query) return allGoals.slice(0, 15);

    const filtered = allGoals.filter(goal =>
      goal.toLowerCase().includes(query.toLowerCase())
    );

    // ALWAYS allow custom goals - add user's input as first option if they've typed something
    if (query.length > 2) {
      // Check if exact match exists
      const exactMatch = filtered.find(g => g.toLowerCase() === query.toLowerCase());
      if (!exactMatch) {
        // Add custom option at the top
        return [`✨ Add "${query}" (custom)`, ...filtered.slice(0, 9)];
      }
    }

    return filtered.slice(0, 10);
  }

  /**
   * Search for skills (not fixed list - users can add ANY custom skill)
   */
  searchSkills(query: string): string[] {
    const allSkills = [
      // Programming Languages
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C',
      'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'Scala',
      'R', 'MATLAB', 'Perl', 'Lua', 'Haskell', 'Elixir', 'Clojure',
      
      // Frontend Technologies
      'HTML', 'CSS', 'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js',
      'Nuxt.js', 'Gatsby', 'Tailwind CSS', 'Bootstrap', 'Material-UI',
      'SASS', 'LESS', 'Styled Components', 'Webpack', 'Vite', 'Babel',
      'jQuery', 'Redux', 'MobX', 'Zustand', 'Recoil',
      
      // Backend Technologies
      'Node.js', 'Express.js', 'Nest.js', 'Django', 'Flask', 'FastAPI',
      'Spring Boot', 'Spring Framework', 'ASP.NET', 'Laravel', 'Ruby on Rails',
      'GraphQL', 'REST API', 'gRPC', 'WebSockets', 'Microservices',
      
      // Databases
      'SQL', 'PostgreSQL', 'MySQL', 'SQLite', 'Oracle', 'SQL Server',
      'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'Firebase',
      'Elasticsearch', 'Neo4j', 'CouchDB', 'InfluxDB',
      
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud Platform', 'Heroku', 'Vercel', 'Netlify',
      'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions',
      'CircleCI', 'Travis CI', 'Terraform', 'Ansible', 'Chef', 'Puppet',
      'CI/CD', 'Infrastructure as Code', 'Serverless', 'Lambda Functions',
      
      // Version Control
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN',
      
      // Testing
      'Jest', 'Mocha', 'Chai', 'Cypress', 'Selenium', 'Playwright',
      'JUnit', 'PyTest', 'Unit Testing', 'Integration Testing',
      'E2E Testing', 'Test-Driven Development', 'Behavior-Driven Development',
      
      // Mobile Development
      'React Native', 'Flutter', 'SwiftUI', 'UIKit', 'Jetpack Compose',
      'Xamarin', 'Ionic', 'Cordova', 'iOS Development', 'Android Development',
      
      // Data Science & ML
      'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Plotly',
      'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'XGBoost',
      'Machine Learning', 'Deep Learning', 'Neural Networks',
      'Natural Language Processing', 'Computer Vision', 'Data Analysis',
      'Data Visualization', 'Statistical Analysis', 'A/B Testing',
      'Jupyter Notebook', 'Apache Spark', 'Hadoop', 'Tableau', 'Power BI',
      
      // Security
      'Cybersecurity', 'Penetration Testing', 'Ethical Hacking',
      'Network Security', 'Application Security', 'Cryptography',
      'OWASP', 'Security Auditing', 'Vulnerability Assessment',
      
      // Design
      'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',
      'InDesign', 'After Effects', 'Premiere Pro', 'Blender',
      'UI Design', 'UX Design', 'User Research', 'Wireframing',
      'Prototyping', 'Design Systems', 'Responsive Design',
      'Accessibility', 'Color Theory', 'Typography',
      
      // Game Development
      'Unity', 'Unreal Engine', 'Godot', 'Game Design', '3D Modeling',
      'Animation', 'Shader Programming', 'Physics Simulation',
      
      // Blockchain
      'Blockchain', 'Solidity', 'Smart Contracts', 'Web3.js', 'Ethers.js',
      'Cryptocurrency', 'DeFi', 'NFTs',
      
      // Business & Soft Skills
      'Communication', 'Problem Solving', 'Critical Thinking',
      'Team Collaboration', 'Leadership', 'Time Management',
      'Project Management', 'Agile', 'Scrum', 'Kanban',
      'Customer Service', 'Sales', 'Negotiation', 'Public Speaking',
      'Presentation Skills', 'Writing', 'Technical Writing',
      'Documentation', 'Mentoring', 'Conflict Resolution',
      
      // Marketing & SEO
      'SEO', 'SEM', 'Google Analytics', 'Google Ads', 'Facebook Ads',
      'Content Marketing', 'Email Marketing', 'Social Media Marketing',
      'Copywriting', 'Brand Strategy', 'Market Research',
      
      // Other Technical Skills
      'Linux', 'Unix', 'Bash Scripting', 'PowerShell', 'Vim', 'Emacs',
      'Regular Expressions', 'Algorithms', 'Data Structures',
      'System Design', 'Architecture Patterns', 'Design Patterns',
      'Object-Oriented Programming', 'Functional Programming',
      'Concurrent Programming', 'Asynchronous Programming',
      'Performance Optimization', 'Code Review', 'Debugging',
      
      // Healthcare & Care Skills
      'Patient Care', 'First Aid', 'CPR', 'Medical Terminology',
      'Elderly Care', 'Disability Support', 'Mental Health Support',
      'Medication Administration', 'Care Planning',
      
      // Languages
      'English', 'Spanish', 'Mandarin', 'French', 'German', 'Japanese',
      'Korean', 'Arabic', 'Portuguese', 'Hindi', 'Italian',
    ];

    if (!query) return allSkills.slice(0, 20);

    const filtered = allSkills.filter(skill =>
      skill.toLowerCase().includes(query.toLowerCase())
    );

    // ALWAYS allow custom skills - add user's input as first option if they've typed something
    if (query.length > 2) {
      // Check if exact match exists
      const exactMatch = filtered.find(s => s.toLowerCase() === query.toLowerCase());
      if (!exactMatch) {
        // Add custom option at the top
        return [`✨ Add "${query}" (custom)`, ...filtered.slice(0, 14)];
      }
    }

    return filtered.slice(0, 15);
  }

  // ============================================
  // PRIVATE METHODS - AI PROVIDERS
  // ============================================

  private async analyzeWithAI(
    text: string,
    type: 'resume' | 'roadmap',
    provider: AIProvider
  ): Promise<AIAnalysis> {
    switch (provider) {
      case 'huggingface':
        return await this.analyzeWithHuggingFace(text, type);
      case 'cohere':
        return await this.analyzeWithCohere(text, type);
      case 'together':
        return await this.analyzeWithTogether(text, type);
      case 'groq':
        return await this.analyzeWithGroq(text, type);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async analyzeWithHuggingFace(
    text: string,
    type: 'resume' | 'roadmap'
  ): Promise<AIAnalysis> {
    const prompt = type === 'resume'
      ? `Analyze this resume and provide suggestions for improvement:\n\n${text.slice(0, 1000)}`
      : `Analyze this learning roadmap and suggest improvements:\n\n${text.slice(0, 1000)}`;

    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.huggingface}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) {
      throw new Error('Hugging Face API request failed');
    }

    const data = await response.json() as any;
    
    return {
      summary: data[0]?.summary_text || 'Analysis completed',
      suggestions: ['Add more quantifiable achievements', 'Include relevant keywords', 'Highlight key projects'],
      improvements: ['Expand technical skills section', 'Add portfolio links'],
      confidence: 0.85,
    };
  }

  private async analyzeWithCohere(
    text: string,
    type: 'resume' | 'roadmap'
  ): Promise<AIAnalysis> {
    const prompt = type === 'resume'
      ? `Analyze this resume and provide 3 suggestions and 2 improvements:\n\n${text.slice(0, 2000)}`
      : `Analyze this learning roadmap and provide 3 suggestions and 2 improvements:\n\n${text.slice(0, 2000)}`;

    const response = await fetch(
      'https://api.cohere.ai/v1/generate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.cohere}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          prompt: prompt,
          max_tokens: 300,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Cohere API request failed');
    }

    const data = await response.json() as any;
    const generatedText = data.generations[0]?.text || '';
    
    // Parse the response
    const lines = generatedText.split('\n').filter((l: string) => l.trim());
    
    return {
      summary: lines[0] || 'Analysis completed',
      suggestions: lines.slice(1, 4).map((l: string) => l.replace(/^[-•*]\s*/, '')),
      improvements: lines.slice(4, 6).map((l: string) => l.replace(/^[-•*]\s*/, '')),
      confidence: 0.88,
    };
  }

  private async analyzeWithTogether(
    text: string,
    type: 'resume' | 'roadmap'
  ): Promise<AIAnalysis> {
    const prompt = type === 'resume'
      ? `Analyze this resume and provide suggestions:\n\n${text.slice(0, 2000)}\n\nProvide 3 suggestions and 2 improvements.`
      : `Analyze this learning roadmap:\n\n${text.slice(0, 2000)}\n\nProvide 3 suggestions and 2 improvements.`;

    const response = await fetch(
      'https://api.together.xyz/v1/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.together}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          prompt: prompt,
          max_tokens: 300,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Together AI API request failed');
    }

    const data = await response.json() as any;
    const generatedText = data.choices[0]?.text || '';
    
    const lines = generatedText.split('\n').filter((l: string) => l.trim());
    
    return {
      summary: 'AI analysis completed successfully',
      suggestions: lines.slice(0, 3).map((l: string) => l.replace(/^[-•*]\s*/, '')),
      improvements: lines.slice(3, 5).map((l: string) => l.replace(/^[-•*]\s*/, '')),
      confidence: 0.90,
    };
  }

  private async analyzeWithGroq(
    text: string,
    type: 'resume' | 'roadmap'
  ): Promise<AIAnalysis> {
    const prompt = type === 'resume'
      ? `Analyze this resume and provide actionable suggestions:\n\n${text.slice(0, 2000)}`
      : `Analyze this learning roadmap and suggest improvements:\n\n${text.slice(0, 2000)}`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.groq}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'system', content: 'You are a career advisor analyzing documents.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Groq API request failed');
    }

    const data = await response.json() as any;
    const generatedText = data.choices[0]?.message?.content || '';
    
    const lines = generatedText.split('\n').filter((l: string) => l.trim());
    
    return {
      summary: lines[0] || 'Analysis completed',
      suggestions: lines.slice(1, 4).map((l: string) => l.replace(/^[-•*]\s*/, '')),
      improvements: lines.slice(4, 6).map((l: string) => l.replace(/^[-•*]\s*/, '')),
      confidence: 0.92,
    };
  }

  private analyzeResumeRuleBased(text: string): AIAnalysis {
    const suggestions: string[] = [];
    const improvements: string[] = [];

    // Simple rule-based analysis
    if (!text.toLowerCase().includes('project')) {
      suggestions.push('Add project experience to showcase your skills');
    }
    if (!text.toLowerCase().includes('skill')) {
      suggestions.push('Include a skills section with relevant technologies');
    }
    if (text.length < 500) {
      improvements.push('Expand your resume with more details about your experience');
    }
    if (!text.toLowerCase().includes('github') && !text.toLowerCase().includes('portfolio')) {
      suggestions.push('Add links to your GitHub or portfolio');
    }

    return {
      summary: 'Resume analyzed. Consider adding more project details and quantifiable achievements.',
      suggestions,
      improvements,
      confidence: 0.7,
    };
  }

  private analyzeRoadmapRuleBased(text: string): AIAnalysis {
    const suggestions: string[] = [];
    const improvements: string[] = [];

    if (!text.toLowerCase().includes('project')) {
      suggestions.push('Include hands-on projects to reinforce learning');
    }
    if (!text.toLowerCase().includes('practice')) {
      suggestions.push('Add practice exercises between topics');
    }
    if (text.split('\n').length < 5) {
      improvements.push('Break down the roadmap into more detailed steps');
    }

    return {
      summary: 'Roadmap analyzed. Consider adding more practical exercises and milestones.',
      suggestions,
      improvements,
      confidence: 0.75,
    };
  }

  private getFreeResourcesForTopic(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): LearningResource[] {
    // Curated free resources
    const resourceDatabase: Record<string, LearningResource[]> = {
      'javascript': [
        {
          title: 'JavaScript.info - Modern JavaScript Tutorial',
          url: 'https://javascript.info',
          type: 'documentation',
          provider: 'javascript.info',
          difficulty: 'beginner',
          duration: '40 hours',
          rating: 9.5,
          isFree: true,
        },
        {
          title: 'freeCodeCamp JavaScript Course',
          url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
          type: 'course',
          provider: 'freeCodeCamp',
          difficulty: 'beginner',
          duration: '300 hours',
          rating: 9.0,
          isFree: true,
        },
        {
          title: 'You Don\'t Know JS (book series)',
          url: 'https://github.com/getify/You-Dont-Know-JS',
          type: 'book',
          provider: 'GitHub',
          difficulty: 'intermediate',
          duration: '60 hours',
          rating: 9.8,
          isFree: true,
        },
      ],
      'react': [
        {
          title: 'React Official Documentation',
          url: 'https://react.dev',
          type: 'documentation',
          provider: 'React Team',
          difficulty: 'beginner',
          duration: '20 hours',
          rating: 9.5,
          isFree: true,
        },
        {
          title: 'freeCodeCamp React Course',
          url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/',
          type: 'course',
          provider: 'freeCodeCamp',
          difficulty: 'intermediate',
          duration: '150 hours',
          rating: 9.0,
          isFree: true,
        },
      ],
      'python': [
        {
          title: 'Python.org Official Tutorial',
          url: 'https://docs.python.org/3/tutorial/',
          type: 'documentation',
          provider: 'Python.org',
          difficulty: 'beginner',
          duration: '15 hours',
          rating: 9.0,
          isFree: true,
        },
        {
          title: 'freeCodeCamp Python Course',
          url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/',
          type: 'course',
          provider: 'freeCodeCamp',
          difficulty: 'beginner',
          duration: '300 hours',
          rating: 9.2,
          isFree: true,
        },
      ],
    };

    const topicKey = topic.toLowerCase().replace(/\s+/g, '');
    const resources = resourceDatabase[topicKey] || [];

    return resources.filter(r => r.difficulty === difficulty || difficulty === 'intermediate');
  }

  private getProjectDatabase(): ProgressiveProject[] {
    return [
      // Beginner projects
      {
        id: 'proj-beginner-1',
        title: 'Personal Portfolio Website',
        description: 'Build a responsive portfolio to showcase your work and skills',
        difficulty: 'beginner',
        skills: ['HTML', 'CSS', 'JavaScript'],
        newConcepts: ['Responsive Design', 'Flexbox/Grid', 'Basic DOM manipulation'],
        estimatedHours: 15,
        confidenceBoost: 9,
        jobRelevance: 8,
        prerequisites: [],
        learningOutcomes: [
          'Understand HTML structure and semantics',
          'Master CSS layouts and responsive design',
          'Learn basic JavaScript for interactivity',
        ],
      },
      {
        id: 'proj-beginner-2',
        title: 'Todo List Application',
        description: 'Create a functional todo app with local storage',
        difficulty: 'beginner',
        skills: ['JavaScript', 'DOM', 'LocalStorage'],
        newConcepts: ['Event handling', 'State management', 'Data persistence'],
        estimatedHours: 12,
        confidenceBoost: 8,
        jobRelevance: 7,
        prerequisites: ['HTML', 'CSS', 'JavaScript'],
        learningOutcomes: [
          'Handle user events and form inputs',
          'Manage application state',
          'Persist data with localStorage',
        ],
      },
      {
        id: 'proj-beginner-3',
        title: 'Weather Dashboard',
        description: 'Build a weather app using a public API',
        difficulty: 'beginner',
        skills: ['JavaScript', 'API', 'Fetch'],
        newConcepts: ['API integration', 'Async/await', 'Error handling'],
        estimatedHours: 18,
        confidenceBoost: 9,
        jobRelevance: 9,
        prerequisites: ['JavaScript'],
        learningOutcomes: [
          'Work with external APIs',
          'Handle asynchronous operations',
          'Display dynamic data',
        ],
      },

      // Intermediate projects
      {
        id: 'proj-intermediate-1',
        title: 'E-commerce Product Page',
        description: 'Build a dynamic product page with cart functionality using React',
        difficulty: 'intermediate',
        skills: ['React', 'State Management', 'Component Design'],
        newConcepts: ['React hooks', 'Context API', 'Component composition'],
        estimatedHours: 25,
        confidenceBoost: 8,
        jobRelevance: 9,
        prerequisites: ['JavaScript', 'React'],
        learningOutcomes: [
          'Build reusable React components',
          'Manage complex state with hooks',
          'Implement shopping cart logic',
        ],
      },
      {
        id: 'proj-intermediate-2',
        title: 'Social Media Dashboard',
        description: 'Create a dashboard with authentication and real-time updates',
        difficulty: 'intermediate',
        skills: ['React', 'Authentication', 'API Integration'],
        newConcepts: ['JWT authentication', 'Protected routes', 'Real-time data'],
        estimatedHours: 35,
        confidenceBoost: 9,
        jobRelevance: 10,
        prerequisites: ['React', 'API'],
        learningOutcomes: [
          'Implement user authentication',
          'Handle protected routes',
          'Work with real-time data',
        ],
      },
      {
        id: 'proj-intermediate-3',
        title: 'Data Visualization Dashboard',
        description: 'Build an interactive dashboard with charts and analytics',
        difficulty: 'intermediate',
        skills: ['React', 'Data Visualization', 'Charts'],
        newConcepts: ['Chart libraries', 'Data transformation', 'Interactive visualizations'],
        estimatedHours: 30,
        confidenceBoost: 8,
        jobRelevance: 9,
        prerequisites: ['React', 'JavaScript'],
        learningOutcomes: [
          'Create interactive charts',
          'Transform and analyze data',
          'Build analytics dashboards',
        ],
      },

      // Advanced projects
      {
        id: 'proj-advanced-1',
        title: 'Full Stack Blog Platform',
        description: 'Create a complete blog with CMS, authentication, and comments',
        difficulty: 'advanced',
        skills: ['React', 'Node.js', 'Database', 'Authentication', 'API Design'],
        newConcepts: ['Backend architecture', 'Database design', 'RESTful APIs', 'Security'],
        estimatedHours: 60,
        confidenceBoost: 10,
        jobRelevance: 10,
        prerequisites: ['React', 'Node.js', 'Database'],
        learningOutcomes: [
          'Design and build RESTful APIs',
          'Implement full authentication system',
          'Design database schemas',
          'Deploy full stack applications',
        ],
      },
      {
        id: 'proj-advanced-2',
        title: 'Real-time Collaboration Tool',
        description: 'Build a collaborative workspace with WebSockets',
        difficulty: 'advanced',
        skills: ['React', 'WebSockets', 'Real-time', 'State Management'],
        newConcepts: ['WebSocket protocol', 'Operational transformation', 'Conflict resolution'],
        estimatedHours: 70,
        confidenceBoost: 10,
        jobRelevance: 10,
        prerequisites: ['React', 'Node.js', 'WebSockets'],
        learningOutcomes: [
          'Implement real-time communication',
          'Handle concurrent updates',
          'Build scalable real-time apps',
        ],
      },
      {
        id: 'proj-advanced-3',
        title: 'Machine Learning Web App',
        description: 'Create a web app that uses ML models for predictions',
        difficulty: 'advanced',
        skills: ['Python', 'Machine Learning', 'API', 'React'],
        newConcepts: ['ML model deployment', 'Model serving', 'ML APIs'],
        estimatedHours: 80,
        confidenceBoost: 10,
        jobRelevance: 10,
        prerequisites: ['Python', 'Machine Learning', 'API'],
        learningOutcomes: [
          'Deploy ML models to production',
          'Build ML-powered APIs',
          'Integrate ML with web apps',
        ],
      },
    ];
  }

  private hasPrerequisites(project: ProgressiveProject, userSkills: string[]): boolean {
    if (project.prerequisites.length === 0) return true;

    return project.prerequisites.every(prereq =>
      userSkills.some(skill => 
        skill.toLowerCase().includes(prereq.toLowerCase()) ||
        prereq.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }
}

// Export singleton
export const enhancedAIService = new EnhancedAIService();







