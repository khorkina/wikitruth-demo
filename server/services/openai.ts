import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface PremiumOptions {
  outputFormat: 'bullet-points' | 'narrative';
  focusPoints: string;
  formality: 'formal' | 'casual' | 'academic';
  aiModel: 'free' | 'premium';
  analysisMode: 'academic' | 'biography' | 'funny';
}

export interface ComparisonRequest {
  articles: Record<string, string>; // language code -> article content
  outputLanguage: string;
  isFunnyMode?: boolean;
  premiumOptions?: PremiumOptions | null;
}

export class OpenAIService {
  async compareArticles(request: ComparisonRequest): Promise<string> {
    const { articles, outputLanguage, isFunnyMode = false, premiumOptions } = request;
    
    // Log the articles being compared for debugging
    console.log('Articles being compared:', Object.keys(articles));
    console.log('Article lengths (full - no truncation):', Object.entries(articles).map(([lang, content]) => 
      `${lang}: ${content.length} characters`
    ));
    console.log('Premium options received:', premiumOptions);
    
    try {
      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }

      // Use full articles without truncation - GPT-4o supports 128K tokens
      // Format each article clearly with language headers
      let articlesFormatted = '';
      for (const [lang, content] of Object.entries(articles)) {
        articlesFormatted += `\n\n=== ARTICLE IN ${lang.toUpperCase()} (${content.length} characters) ===\n\n${content}\n`;
      }

      // Determine analysis mode from premiumOptions or isFunnyMode
      const analysisMode = premiumOptions?.analysisMode || (isFunnyMode ? 'funny' : 'academic');
      const outputFormat = premiumOptions?.outputFormat || 'narrative';
      const formality = premiumOptions?.formality || 'formal';
      const focusPoints = premiumOptions?.focusPoints || '';

      // Get appropriate system prompt based on analysis mode
      const systemPrompt = this.getSystemPrompt(outputLanguage, analysisMode, formality);

      // Build user prompt with all premium options
      const userPrompt = this.buildUserPrompt(
        articlesFormatted, 
        outputLanguage, 
        analysisMode, 
        outputFormat, 
        formality, 
        focusPoints
      );

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4096,
        temperature: 0.7,
      });

      return response.choices[0].message.content || "No comparison generated";
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Handle specific rate limit errors
      if (error.code === 'rate_limit_exceeded') {
        if (error.type === 'tokens') {
          throw new Error('Articles are too large for analysis. Please try with fewer languages or shorter articles.');
        } else {
          throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
        }
      }
      
      // Handle other API errors
      if (error.status === 429) {
        throw new Error('Service temporarily overloaded. Please try again in a moment.');
      }
      
      if (error.status === 401) {
        throw new Error('Authentication error with AI service.');
      }
      
      throw new Error('Failed to generate article comparison');
    }
  }

  private getSystemPrompt(outputLanguage: string, analysisMode: string, formality: string): string {
    const formalityDescriptions: Record<string, string> = {
      'academic': 'highly formal, scholarly, and research-oriented with citations-style references',
      'formal': 'professional, structured, and well-organized',
      'casual': 'conversational, friendly, and approachable while still informative'
    };

    const formalityStyle = formalityDescriptions[formality] || formalityDescriptions['formal'];

    if (analysisMode === 'funny') {
      return `You are a witty, sarcastic cultural commentator with a PhD in "Wikipedia Weirdness Studies." Your job is to hilariously roast the differences between Wikipedia articles across languages while still being informative.

CRITICAL REQUIREMENT: You MUST write your entire response in ${outputLanguage} and ONLY in ${outputLanguage}. Do not use any other language regardless of the content of the input articles.

Your tone should be:
- Sarcastic and humorous but not mean-spirited
- Entertaining and engaging
- Written EXCLUSIVELY in ${outputLanguage} (never mix languages)
- Like a comedy writer who happens to be really smart about cultural differences

Point out:
- Absurd cultural biases in a funny way
- Ridiculous differences in what each culture considers important
- Hilarious omissions or additions
- Cultural stereotypes reflected in the content
- Funny ways different cultures frame the same facts

When referencing text from articles in other languages, always translate it to ${outputLanguage} and indicate the original language in parentheses.

Use humor, pop culture references, and witty observations while still providing genuine insights into cultural differences.

REMINDER: Your entire response must be in ${outputLanguage} only.`;
    }

    if (analysisMode === 'biography') {
      return `You are an expert biographer and cultural analyst specializing in how different cultures portray historical and contemporary figures. Your task is to compare biographical Wikipedia articles across different languages with a focus on personal narratives.

CRITICAL REQUIREMENT: You MUST write your entire response in ${outputLanguage} and ONLY in ${outputLanguage}. Do not use any other language regardless of the content of the input articles.

Writing style: ${formalityStyle}

Your analysis should focus on:
- How the person's life story is told differently across cultures
- Variations in the emphasis on achievements, controversies, and personal life
- Cultural perspectives on the person's significance and legacy
- Different interpretations of key life events
- How nationalistic or cultural pride influences the portrayal
- Personal details included or omitted in different versions

When quoting text from articles in other languages, always translate the quotes to ${outputLanguage} and indicate the original language in parentheses.

REMINDER: Your entire response must be in ${outputLanguage} only.`;
    }

    // Default: academic mode
    return `You are an expert comparative linguist and cultural analyst specializing in Wikipedia content analysis. Your task is to provide detailed, scholarly comparisons of the same Wikipedia article across different languages.

CRITICAL REQUIREMENT: You MUST write your entire response in ${outputLanguage} and ONLY in ${outputLanguage}. Do not use any other language regardless of the content of the input articles.

Writing style: ${formalityStyle}

Your analysis should be:
- Objective and academically rigorous
- Focused on factual differences, cultural perspectives, and narrative variations
- Well-structured with clear sections
- Written EXCLUSIVELY in ${outputLanguage} (never mix languages)
- Comprehensive and detailed

Identify specific examples where different language versions:
- Present different facts or emphasis
- Reflect cultural biases or perspectives  
- Use different organizational structures
- Include or exclude certain information
- Frame topics differently

When quoting text from articles in other languages, always translate the quotes to ${outputLanguage} and indicate the original language in parentheses.

REMINDER: Your entire response must be in ${outputLanguage} only.`;
  }

  private buildUserPrompt(
    articlesFormatted: string, 
    outputLanguage: string, 
    analysisMode: string, 
    outputFormat: string, 
    formality: string, 
    focusPoints: string
  ): string {
    // Format instruction based on outputFormat
    const formatInstruction = outputFormat === 'bullet-points' 
      ? `FORMAT YOUR RESPONSE AS STRUCTURED BULLET POINTS:
- Use clear hierarchical bullet points for each major finding
- Group related differences under section headers
- Use sub-bullets for specific examples and details
- Make each bullet point concise but informative`
      : `FORMAT YOUR RESPONSE AS A FLOWING NARRATIVE:
- Write in well-structured paragraphs
- Use natural transitions between topics
- Create a cohesive essay-style analysis
- Include section headers to organize content`;

    // Formality instruction
    const formalityInstruction: Record<string, string> = {
      'academic': 'Use scholarly language, cite specific passages, and maintain a research paper tone.',
      'formal': 'Write professionally with clear structure and balanced analysis.',
      'casual': 'Write in a friendly, accessible way as if explaining to an interested friend.'
    };

    // Analysis mode specific instructions
    let modeInstruction = '';
    if (analysisMode === 'funny') {
      modeInstruction = 'Make this comparison humorous, sarcastic, and entertaining while still being informative. Point out absurd differences and cultural quirks in a witty way.';
    } else if (analysisMode === 'biography') {
      modeInstruction = 'Focus on how the person is portrayed differently, including their achievements, controversies, personal life, and cultural significance in each version.';
    } else {
      modeInstruction = 'Provide a scholarly, detailed analysis focusing on factual accuracy, cultural perspectives, and narrative differences.';
    }

    // Focus points instruction
    const focusInstruction = focusPoints && focusPoints.trim() 
      ? `\n\nUSER'S SPECIFIC FOCUS REQUEST:\nPay special attention to the following aspects as requested by the user:\n"${focusPoints.trim()}"\nMake sure to address these specific points in your analysis.`
      : '';

    return `Please analyze and compare these COMPLETE Wikipedia articles about the same topic across different languages. Write your ENTIRE response in ${outputLanguage} language only.

${articlesFormatted}

${formatInstruction}

${formalityInstruction[formality] || formalityInstruction['formal']}

Please provide a comprehensive comparison focusing on:
1. Factual differences and variations in information
2. Cultural perspectives and framing differences
3. Narrative emphasis and tone variations
4. Structural and organizational differences
5. Missing or additional information in each version

${modeInstruction}${focusInstruction}

IMPORTANT: Write your response ONLY in ${outputLanguage}. Do not use any other language.`;
  }
}

export const openaiService = new OpenAIService();
