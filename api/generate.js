import { GoogleGenAI } from '@google/genai';

function generateMockBlueprint(prompt, productType) {
  const type = productType || (prompt.toLowerCase().includes('checklist') ? 'Checklist' : 
    prompt.toLowerCase().includes('course') ? 'Course' : 
    prompt.toLowerCase().includes('planner') ? 'Planner' : 
    prompt.toLowerCase().includes('calculator') ? 'Calculator' : 'Guide');

  return {
    overview: { name: prompt.trim() || "Premium Digital Product Blueprint", type, industry: "Professional Business Services", targetAudience: "Solopreneurs and Entrepreneurs", difficultyLevel: "Intermediate", language: "English (US)", estimatedCompletionTime: "1-2 Hours" },
    customerGoal: { problemSolved: `Lack of standardized templates for ${prompt}`, whoFor: "Professionals who want to automate their business", whyMatters: "Provides high-perceived-value frameworks", expectedOutcome: "A fully branded, retail-ready digital product" },
    structure: { guideChapters: [{ title: "Chapter 1: Foundation", topics: ["Core concepts", "Getting started"] }, { title: "Chapter 2: Implementation", topics: ["Step-by-step process", "Best practices"] }] },
    contentPlan: { pages: 10, sections: 4, tasks: 12, lessons: 8, readingTime: "45 Minutes" },
    generatedAssets: { cover: "Professional gradient cover", thumbnail: "Clean thumbnail design", productIcon: "CheckSquare", mockups: ["Laptop mockup", "PDF mockup"], websiteBanner: "Banner layout", socialMediaImages: ["LinkedIn image", "Twitter image"] },
    marketingPackage: { productDescription: `${prompt} - A comprehensive digital product`, salesCopy: "Transform your business today", cta: "Get Instant Access", seoMetaDescription: `Professional ${type} for business growth`, etsyListing: `${prompt} Template`, gumroadListing: `${prompt} - Digital Download`, bgrowthListing: `Premium ${type}: ${prompt}` },
    aiResources: { creditsRequired: 150, estGenerationTime: "10-15 seconds", apisUsed: "Gemini AI" },
    monetizationStrategy: { sellingPrice: 29.99, bundleOpportunities: "Bundle with related templates", upsells: "Premium version with more content", crossSells: "Complementary products", subscriptionOpportunities: "Monthly membership" },
    qualityReview: { missingInformation: "None", possibleImprovements: "Add more specific examples", betterTitles: `Premium ${prompt} System`, betterPositioning: "Position as time-saving solution", betterProductFormat: "Consider interactive PDF format" }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  const { prompt, productType } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ blueprint: generateMockBlueprint(prompt, productType) });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are the Lead Product Architect at BGrowth Studio™. Create a detailed Product Blueprint JSON for: "${prompt}". Product type: ${productType || 'Auto-detect'}. Return only valid JSON with these fields: overview, customerGoal, structure, contentPlan, generatedAssets, marketingPackage, aiResources, monetizationStrategy, qualityReview.`,
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(response.text);
    return res.json({ blueprint: parsed });
  } catch (error) {
    return res.json({ blueprint: generateMockBlueprint(prompt, productType) });
  }
}
