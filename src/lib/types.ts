export interface Wine {
  id: string;
  name: string;
  producer: string | null;
  vintage: number | null;
  region: string | null;
  article_number: string | null;
  price: number | null;
  food_pairing_tags: string[];
  url_to_systembolaget: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WineLog {
  id: string;
  user_id: string;
  wine_id: string | null;
  user_image_url: string | null;
  rating: number | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  wine?: Wine; // Joined data
}

export interface VisionAnalysisResult {
  name: string;
  producer: string | null;
  vintage: number | null;
  region: string | null;
  grapeVariety: string | null;
  suggestedFoodPairings: string[];
}

export interface SystembolagetProduct {
  articleNumber: string;
  name: string;
  price: number;
  foodPairingTags: string[];
  url: string;
  imageUrl: string | null;
}

// Database insert types (without auto-generated fields)
export type WineInsert = Omit<Wine, 'id' | 'created_at' | 'updated_at'>;
export type WineLogInsert = Omit<WineLog, 'id' | 'created_at' | 'updated_at' | 'wine'>;
