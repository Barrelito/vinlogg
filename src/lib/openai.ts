import OpenAI from 'openai';
import type { VisionAnalysisResult } from './types';

// Initialize OpenAI client lazily to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
    if (!openai) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
}

export async function analyzeWineImage(base64Image: string): Promise<VisionAnalysisResult> {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `Du är en vinexpert. Analysera denna bild av en vinflaska och extrahera information från etiketten.

Svara ENDAST med JSON i detta format, inget annat:

{
  "name": "Vinets fullständiga namn från etiketten",
  "producer": "Producent eller vingårdens namn",
  "vintage": 2020,
  "region": "Region och/eller land",
  "grapeVariety": "Druvsorter om synligt",
  "suggestedFoodPairings": ["Nötkött", "Lamm"]
}

För suggestedFoodPairings, välj från dessa Systembolaget-standardtaggar baserat på vintypen:
Nötkött, Ljust kött, Lamm, Vilt, Fågel, Fisk, Skaldjur, Pasta, Ost, Chark, Sushi, Asiatiskt, Vegetariskt, Aperitif, Dessert

Om du inte kan läsa ett fält, sätt det till null. Gör ditt bästa för att identifiera vinet!`,
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: base64Image.startsWith('data:')
                                ? base64Image
                                : `data:image/jpeg;base64,${base64Image}`,
                        },
                    },
                ],
            },
        ],
        max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content || '{}';
    console.log('OpenAI Vision response:', content);

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1];
    }

    try {
        const parsed = JSON.parse(jsonStr.trim());
        return {
            name: parsed.name || 'Okänt vin',
            producer: parsed.producer || null,
            vintage: parsed.vintage ? Number(parsed.vintage) : null,
            region: parsed.region || null,
            grapeVariety: parsed.grapeVariety || null,
            suggestedFoodPairings: Array.isArray(parsed.suggestedFoodPairings) ? parsed.suggestedFoodPairings : [],
        };
    } catch (e) {
        console.error('Failed to parse OpenAI response:', e, content);
        return {
            name: 'Okänt vin',
            producer: null,
            vintage: null,
            region: null,
            grapeVariety: null,
            suggestedFoodPairings: [],
        };
    }
}

// Food to Systembolaget tag mapping
const FOOD_TAG_MAPPINGS: Record<string, string[]> = {
    'nötkött': ['Nötkött'],
    'nötfärs': ['Nötkött'],
    'biff': ['Nötkött'],
    'entrecôte': ['Nötkött'],
    'oxfilé': ['Nötkött'],
    'kalv': ['Ljust kött'],
    'kalvkött': ['Ljust kött'],
    'gris': ['Ljust kött'],
    'fläsk': ['Ljust kött'],
    'fläskkött': ['Ljust kött'],
    'kyckling': ['Fågel'],
    'anka': ['Fågel'],
    'kalkon': ['Fågel'],
    'vilt': ['Vilt'],
    'älg': ['Vilt'],
    'rådjur': ['Vilt'],
    'hjort': ['Vilt'],
    'lamm': ['Lamm'],
    'lammkött': ['Lamm'],
    'fisk': ['Fisk'],
    'lax': ['Fisk'],
    'torsk': ['Fisk'],
    'skaldjur': ['Skaldjur'],
    'räkor': ['Skaldjur'],
    'hummer': ['Skaldjur'],
    'musslor': ['Skaldjur'],
    'pasta': ['Pasta'],
    'ost': ['Ost'],
    'chark': ['Chark'],
    'sushi': ['Sushi'],
    'asiatiskt': ['Asiatiskt'],
    'thai': ['Asiatiskt'],
    'kinesiskt': ['Asiatiskt'],
    'aperitif': ['Aperitif'],
    'dessert': ['Dessert'],
    'vegetariskt': ['Vegetariskt'],
};

export async function mapFoodToTags(foodDescription: string): Promise<string[]> {
    const lowerFood = foodDescription.toLowerCase().trim();

    // Check direct mappings first
    for (const [key, tags] of Object.entries(FOOD_TAG_MAPPINGS)) {
        if (lowerFood.includes(key)) {
            return tags;
        }
    }

    // If no direct mapping, use LLM
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `Du är en expert på att matcha mat med Systembolagets matpairings-taggar.

Tillgängliga taggar: Nötkött, Ljust kött, Lamm, Vilt, Fågel, Fisk, Skaldjur, Pasta, Ost, Chark, Sushi, Asiatiskt, Vegetariskt, Aperitif, Dessert

Svara ENDAST med en JSON-array av matchande taggar, t.ex: ["Fisk", "Skaldjur"]`,
            },
            {
                role: 'user',
                content: `Vilka Systembolaget-taggar matchar bäst med: "${foodDescription}"?`,
            },
        ],
        max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content || '[]';

    try {
        let jsonStr = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }
        const tags = JSON.parse(jsonStr.trim());
        return Array.isArray(tags) ? tags : [];
    } catch {
        return [];
    }
}
