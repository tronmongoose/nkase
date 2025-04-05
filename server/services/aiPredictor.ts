import Anthropic from '@anthropic-ai/sdk';
import { type Message } from '@anthropic-ai/sdk/resources';
import { Incident, IncidentSeverity } from '@shared/schema';

// Interface for risk score response
export interface RiskScoreResult {
  predictedSeverity: IncidentSeverity;
  confidenceScore: number;
  riskFactors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  analysisRationale: string;
}

// Fallback logic when no API key is available
const fallbackPredictor = (incident: Partial<Incident>): RiskScoreResult => {
  // Simple rule-based logic as fallback
  const title = incident.title?.toLowerCase() || '';
  const description = incident.description?.toLowerCase() || '';
  const content = title + ' ' + description;
  
  let predictedSeverity: IncidentSeverity = 'medium';
  let confidenceScore = 0.7;

  // Simple keyword matching logic
  if (content.includes('breach') || 
      content.includes('data leak') || 
      content.includes('ransomware') ||
      content.includes('critical')) {
    predictedSeverity = 'critical';
    confidenceScore = 0.85;
  } else if (content.includes('attempt') || 
             content.includes('suspicious') || 
             content.includes('unusual') ||
             content.includes('high')) {
    predictedSeverity = 'high';
    confidenceScore = 0.75;
  } else if (content.includes('notice') || 
             content.includes('warning') ||
             content.includes('minor')) {
    predictedSeverity = 'low';
    confidenceScore = 0.8;
  }

  // Generate risk factors based on keywords
  const riskFactors = [];
  
  if (content.includes('admin') || content.includes('privilege')) {
    riskFactors.push({
      factor: 'Privileged Access',
      impact: 0.8,
      description: 'Incident involves privileged account access'
    });
  }
  
  if (content.includes('database') || content.includes('data')) {
    riskFactors.push({
      factor: 'Data Sensitivity',
      impact: 0.7,
      description: 'Sensitive data may be affected'
    });
  }
  
  if (content.includes('multiple') || content.includes('systems')) {
    riskFactors.push({
      factor: 'Scope',
      impact: 0.65,
      description: 'Multiple systems are affected'
    });
  }
  
  // Always include at least one factor
  if (riskFactors.length === 0) {
    riskFactors.push({
      factor: 'General Risk',
      impact: 0.5,
      description: 'Standard security incident risk'
    });
  }

  return {
    predictedSeverity,
    confidenceScore,
    riskFactors,
    analysisRationale: 'Risk analysis based on keyword detection and standard security protocols. For more accurate analysis, configure an AI provider API key.'
  };
};

// The main predictor function that will use either AI or fallback
export const predictIncidentSeverity = async (incident: Partial<Incident>): Promise<RiskScoreResult> => {
  // Check if we have an API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // If no API key, use the fallback
  if (!apiKey) {
    console.log('No Anthropic API key found, using fallback predictor');
    return fallbackPredictor(incident);
  }
  
  try {
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Prepare the prompt with incident details
    const incidentDetails = `
Title: ${incident.title || 'N/A'}
Description: ${incident.description || 'N/A'}
Affected Resources: ${incident.affectedResources?.join(', ') || 'N/A'}
Status: ${incident.status || 'N/A'}
`;

    // Send request to Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      max_tokens: 1024,
      system: `You are a cybersecurity expert tasked with analyzing security incidents and predicting their severity. 
      Analyze the incident details and return a JSON response with the following structure:
      {
        "predictedSeverity": "critical" | "high" | "medium" | "low",
        "confidenceScore": number between 0 and 1,
        "riskFactors": [
          {
            "factor": string describing the risk factor,
            "impact": number between 0 and 1 representing importance,
            "description": string with explanation
          }
        ],
        "analysisRationale": string explaining your analysis
      }
      
      Focus on keywords, attack patterns, affected resources, and potential impact.`,
      messages: [
        { role: 'user', content: `Please analyze this security incident and provide a severity prediction:\n${incidentDetails}` }
      ],
    });
    
    // Parse the response from Claude
    try {
      // Access the text content safely
      const contentBlock = response.content[0];
      if ('text' in contentBlock) {
        const content = contentBlock.text;
        // Extract JSON from response (might be wrapped in markdown code blocks)
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*?}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
        
        const result = JSON.parse(jsonStr) as RiskScoreResult;
        return result;
      } else {
        throw new Error("Unexpected response format from Anthropic API");
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback if parsing fails
      return fallbackPredictor(incident);
    }
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    // Fallback in case of API error
    return fallbackPredictor(incident);
  }
};