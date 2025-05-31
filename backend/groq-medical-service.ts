// Groq API integration for enhanced medical advice
interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class GroqMedicalService {
  private async makeGroqRequest(messages: GroqMessage[]): Promise<string> {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: messages,
          temperature: 0.3,
          max_tokens: 1500,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API error:', error);
      throw error;
    }
  }

  async generateMedicalAdvice(
    symptoms: string[],
    diagnosis: string,
    confidence: number,
    patientDetails: any
  ): Promise<{
    detailedAdvice: string;
    doList: string[];
    dontList: string[];
    dietRecommendations: string[];
    followUpInstructions: string[];
  }> {
    const systemPrompt = `You are an experienced medical AI assistant. Provide comprehensive, accurate medical advice based on symptoms and diagnosis. Always include:
1. Detailed medical guidance
2. What the patient should do (do's)
3. What the patient should avoid (don'ts)
4. Diet recommendations
5. Follow-up instructions

Format your response as structured text with clear sections. Be professional and empathetic.`;

    const userPrompt = `Patient Information:
- Age: ${patientDetails.age || 'Not specified'}
- Gender: ${patientDetails.gender || 'Not specified'}
- Symptoms: ${symptoms.join(', ')}
- Preliminary Diagnosis: ${diagnosis} (${confidence}% confidence)

Please provide comprehensive medical advice including detailed guidance, do's and don'ts, diet recommendations, and follow-up instructions.`;

    try {
      const response = await this.makeGroqRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      // Parse the response to extract structured information
      const advice = this.parseGroqResponse(response);
      return advice;
    } catch (error) {
      // Fallback to local advice if Groq fails
      return this.generateFallbackAdvice(symptoms, diagnosis, confidence);
    }
  }

  private parseGroqResponse(response: string): {
    detailedAdvice: string;
    doList: string[];
    dontList: string[];
    dietRecommendations: string[];
    followUpInstructions: string[];
  } {
    const lines = response.split('\n').filter(line => line.trim());
    
    let detailedAdvice = '';
    const doList: string[] = [];
    const dontList: string[] = [];
    const dietRecommendations: string[] = [];
    const followUpInstructions: string[] = [];
    
    let currentSection = 'advice';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toLowerCase().includes("what to do") || trimmedLine.toLowerCase().includes("do's")) {
        currentSection = 'do';
        continue;
      } else if (trimmedLine.toLowerCase().includes("what not to do") || trimmedLine.toLowerCase().includes("don'ts")) {
        currentSection = 'dont';
        continue;
      } else if (trimmedLine.toLowerCase().includes("diet") || trimmedLine.toLowerCase().includes("nutrition")) {
        currentSection = 'diet';
        continue;
      } else if (trimmedLine.toLowerCase().includes("follow") || trimmedLine.toLowerCase().includes("follow-up")) {
        currentSection = 'followup';
        continue;
      }
      
      if (trimmedLine.startsWith('-') || trimmedLine.match(/^\d+\./)) {
        const cleanLine = trimmedLine.replace(/^[-\d+.\s]+/, '').trim();
        if (cleanLine) {
          switch (currentSection) {
            case 'do':
              doList.push(cleanLine);
              break;
            case 'dont':
              dontList.push(cleanLine);
              break;
            case 'diet':
              dietRecommendations.push(cleanLine);
              break;
            case 'followup':
              followUpInstructions.push(cleanLine);
              break;
          }
        }
      } else if (trimmedLine && currentSection === 'advice') {
        detailedAdvice += trimmedLine + ' ';
      }
    }
    
    return {
      detailedAdvice: detailedAdvice.trim() || response,
      doList: doList.length > 0 ? doList : ['Follow prescribed medications', 'Get adequate rest', 'Stay hydrated'],
      dontList: dontList.length > 0 ? dontList : ['Don\'t ignore worsening symptoms', 'Avoid self-medication', 'Don\'t delay medical consultation'],
      dietRecommendations: dietRecommendations.length > 0 ? dietRecommendations : ['Maintain balanced diet', 'Stay hydrated', 'Avoid processed foods'],
      followUpInstructions: followUpInstructions.length > 0 ? followUpInstructions : ['Monitor symptoms', 'Consult doctor if symptoms worsen']
    };
  }

  private generateFallbackAdvice(symptoms: string[], diagnosis: string, confidence: number): {
    detailedAdvice: string;
    doList: string[];
    dontList: string[];
    dietRecommendations: string[];
    followUpInstructions: string[];
  } {
    return {
      detailedAdvice: `Based on your symptoms (${symptoms.join(', ')}), the preliminary assessment suggests ${diagnosis} with ${confidence}% confidence. This condition requires proper medical attention and following the prescribed treatment plan.`,
      doList: [
        'Take all medications as prescribed',
        'Get adequate rest and sleep',
        'Maintain proper hygiene',
        'Stay well hydrated',
        'Monitor your symptoms regularly'
      ],
      dontList: [
        'Don\'t skip medications',
        'Avoid self-medication',
        'Don\'t ignore worsening symptoms',
        'Avoid stress and overexertion',
        'Don\'t delay medical consultation if needed'
      ],
      dietRecommendations: [
        'Maintain a balanced, nutritious diet',
        'Drink plenty of water',
        'Include fresh fruits and vegetables',
        'Avoid processed and junk foods',
        'Follow any specific dietary restrictions'
      ],
      followUpInstructions: [
        'Monitor symptoms closely',
        'Follow up with healthcare provider as recommended',
        'Seek immediate medical attention if symptoms worsen',
        'Complete the full course of treatment'
      ]
    };
  }
}

export const groqMedicalService = new GroqMedicalService();