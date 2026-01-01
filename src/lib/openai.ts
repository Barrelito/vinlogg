import OpenAI from 'openai';

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

// Complete wine analysis result from AI
export interface WineAnalysisResult {
    name: string;
    producer: string | null;
    vintage: number | null;
    region: string | null;
    grapes: string[];
    food_pairing_tags: string[];
    description: string | null;
}

// Standard food pairing tags (Systembolaget-style)
const VALID_FOOD_TAGS = [
    'Nöt', 'Fläsk', 'Fågel', 'Fisk', 'Skaldjur',
    'Vegetariskt', 'Sällskapsdryck', 'Lamm', 'Vilt', 'Ljust kött'
];

export async function analyzeWineImage(base64Image: string): Promise<WineAnalysisResult> {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `You are a sommelier API. Analyze wine labels and return structured JSON data. Always respond with ONLY valid JSON, no markdown or explanations.`
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `Analyze the wine label in this image. Return a JSON object with:

{
  "name": "Full name of the wine",
  "producer": "Producer/winery name",
  "vintage": 2020,
  "region": "Region/Country",
  "grapes": ["Shiraz", "Cabernet"],
  "food_pairing_tags": ["Nöt", "Lamm"],
  "description": "A short 1-sentence description of the wine's likely taste profile"
}

IMPORTANT for food_pairing_tags: Choose 1-3 tags STRICTLY from this list:
${VALID_FOOD_TAGS.join(', ')}

If you cannot determine a field, set it to null (or empty array for arrays).`,
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
        max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    console.log('OpenAI Wine Analysis response:', content);

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1];
    }

    try {
        const parsed = JSON.parse(jsonStr.trim());

        // Validate and filter food_pairing_tags to only valid options
        let foodTags: string[] = [];
        if (Array.isArray(parsed.food_pairing_tags)) {
            foodTags = parsed.food_pairing_tags.filter((tag: string) =>
                VALID_FOOD_TAGS.includes(tag)
            );
        }

        return {
            name: parsed.name || 'Okänt vin',
            producer: parsed.producer || null,
            vintage: parsed.vintage ? Number(parsed.vintage) : null,
            region: parsed.region || null,
            grapes: Array.isArray(parsed.grapes) ? parsed.grapes : [],
            food_pairing_tags: foodTags,
            description: parsed.description || null,
        };
    } catch (e) {
        console.error('Failed to parse OpenAI response:', e, content);
        return {
            name: 'Okänt vin',
            producer: null,
            vintage: null,
            region: null,
            grapes: [],
            food_pairing_tags: [],
            description: null,
        };
    }
}

// Food to tag mapping for search feature
const FOOD_TAG_MAPPINGS: Record<string, string[]> = {
    'nötkött': ['Nöt'],
    'nötfärs': ['Nöt'],
    'biff': ['Nöt'],
    'entrecôte': ['Nöt'],
    'oxfilé': ['Nöt'],
    'kalv': ['Ljust kött'],
    'kalvkött': ['Ljust kött'],
    'gris': ['Fläsk'],
    'fläsk': ['Fläsk'],
    'fläskkött': ['Fläsk'],
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
    'vegetariskt': ['Vegetariskt'],
    'vegan': ['Vegetariskt'],
    'grönsaker': ['Vegetariskt'],
    'aperitif': ['Sällskapsdryck'],
    'mingel': ['Sällskapsdryck'],
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
                content: `Du matchar mat med vinkategorier. Svara ENDAST med en JSON-array.

Tillgängliga taggar: ${VALID_FOOD_TAGS.join(', ')}`,
            },
            {
                role: 'user',
                content: `Vilka taggar matchar bäst med: "${foodDescription}"? Svara med JSON-array, t.ex: ["Fisk", "Skaldjur"]`,
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
        // Filter to only valid tags
        return Array.isArray(tags)
            ? tags.filter((tag: string) => VALID_FOOD_TAGS.includes(tag))
            : [];
    } catch {
        return [];
    }
}
