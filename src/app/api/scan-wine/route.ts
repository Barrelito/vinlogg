import { NextRequest, NextResponse } from 'next/server';
import { analyzeWineImage } from '@/lib/openai';
import { searchSystembolaget } from '@/lib/systembolaget';
import { createClient } from '@/lib/supabase/server';
import type { Wine } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json(
                { error: 'Ingen bild skickades' },
                { status: 400 }
            );
        }

        // Step 1: Analyze wine label with OpenAI Vision
        const visionResult = await analyzeWineImage(image);

        // Step 2: Search Systembolaget for matching product
        const sbProduct = await searchSystembolaget(
            visionResult.name,
            visionResult.producer
        );

        // If found on Systembolaget, check if we have it cached
        let wine: Wine | null = null;

        if (sbProduct) {
            const supabase = await createClient();

            // Check if wine exists in our database
            const { data: existingWine } = await supabase
                .from('wines')
                .select('*')
                .eq('article_number', sbProduct.articleNumber)
                .single();

            if (existingWine) {
                wine = existingWine as Wine;
            } else {
                // Insert new wine into cache
                const { data: newWine, error } = await supabase
                    .from('wines')
                    .insert({
                        name: sbProduct.name,
                        producer: visionResult.producer,
                        vintage: visionResult.vintage,
                        region: visionResult.region,
                        article_number: sbProduct.articleNumber,
                        price: sbProduct.price,
                        food_pairing_tags: sbProduct.foodPairingTags,
                        url_to_systembolaget: sbProduct.url,
                        image_url: sbProduct.imageUrl,
                    })
                    .select()
                    .single();

                if (!error && newWine) {
                    wine = newWine as Wine;
                }
            }
        }

        return NextResponse.json({
            success: true,
            visionResult,
            systembolagetProduct: sbProduct,
            wine,
            foundOnSystembolaget: !!sbProduct,
        });
    } catch (error) {
        console.error('Scan wine error:', error);
        return NextResponse.json(
            { error: 'Ett fel uppstod vid analys av bilden' },
            { status: 500 }
        );
    }
}
