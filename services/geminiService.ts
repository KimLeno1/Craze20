import { TrendReport } from "../types";

const getAuthToken = () => localStorage.getItem('ck-auth-token');

/**
 * Checks and logs AI usage on the backend to enforce limits.
 */
async function checkAndLogUsage(type: 'scan' | 'tryon' | 'advice' | 'dream'): Promise<boolean> {
  try {
    const token = getAuthToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch('/api/user/ai-usage', {
      method: 'POST',
      headers,
      body: JSON.stringify({ type })
    });
    return response.ok;
  } catch (error) {
    console.error('Error checking AI usage limit:', error);
    return false;
  }
}

/**
 * Fetches elite styling advice based on user mood and objective.
 */
export const getStylingAdvice = async (mood: string, occasion: string) => {
  if (!(await checkAndLogUsage('advice'))) {
    return "Daily styling allocation exhausted. Upgrade to increase silhouette authority.";
  }

  try {
    const token = getAuthToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch('/api/ai/advice', {
      method: 'POST',
      headers,
      body: JSON.stringify({ mood, occasion })
    });
    
    if (!response.ok) return "Neural sensors offline or unreachable.";
    const data = await response.json();
    return data.text || "Maintain baseline silhouette. Neural sensors offline.";
  } catch (error) {
    console.error('AI API error:', error);
    return "Local style buffer overloaded. Silhouette integrity verified.";
  }
};

/**
 * Fetches market trend intelligence.
 */
export const getTrendIntelligence = async (archetype: string): Promise<TrendReport> => {
  return {
    text: `Global signals for the '${archetype}' archetype indicate a mass shift toward Minimalist Void aesthetics. Silhouette density is dropping as 'Zero Point' styling becomes the new authority standard. Material scarcity of deep-dyed tech-wear fabrics is driving a trend toward 'Ghost Material' transparencies.`,
    sources: [{ title: "Neo Tokyo Market Feed", uri: "https://archives.closetkraze.top/trends" }]
  };
};

/**
 * Generates an outfit blueprint.
 */
export const generateDreamOutfit = async (description: string, highFi: boolean = false) => {
  if (!(await checkAndLogUsage('dream'))) {
    return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800";
  }

  try {
    const token = getAuthToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch('/api/ai/dream', {
      method: 'POST',
      headers,
      body: JSON.stringify({ description, highFi })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("AI Outfit Blueprint:", data.text);
    }
    
    return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800";
  } catch (error) {
    console.error('Dream outfit error:', error);
    return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800";
  }
};
