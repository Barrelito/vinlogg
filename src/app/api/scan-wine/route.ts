import { NextRequest, NextResponse } from 'next/server';
import { analyzeWineImage, WineAnalysisResult } from '@/lib/openai';
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

        // Analyze wine label with OpenAI Vision (AI-only approach)
        console.log('Analyzing wine image with OpenAI...');
        const analysisResult = await analyzeWineImage(image);
        console.log('Wine analysis result:', analysisResult);

        // Try to save wine to database if user is authenticated
        let wine: Wine | null = null;

        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user && analysisResult.name !== 'Okänt vin') {
                // Check if wine already exists by name + producer
                const { data: existingWine } = await supabase
                    .from('wines')
                    .select('*')
                    .eq('name', analysisResult.name)
                    .eq('producer', analysisResult.producer || '')
                    .single();

                if (existingWine) {
                    wine = existingWine as Wine;
                } else {
                    // Insert new wine with AI-generated data
                    const { data: newWine, error } = await supabase
                        .from('wines')
                        .insert({
                            name: analysisResult.name,
                            producer: analysisResult.producer,
                            vintage: analysisResult.vintage,
                            region: analysisResult.region,
                            article_number: null,
                            price: null,
                            food_pairing_tags: analysisResult.food_pairing_tags,
                            description: analysisResult.description,
                            serving_temperature: analysisResult.serving_temperature,
                            storage_potential: analysisResult.storage_potential,
                            flavor_profile: analysisResult.flavor_profile,
                            url_to_systembolaget: null,
                            image_url: null,
                        })
                        .select()
                        .single();

                    if (!error && newWine) {
                        wine = newWine as Wine;
                        console.log('Saved new wine to database:', wine.id);
                    }
                }
            }
        } catch (dbError) {
            console.warn('Could not save wine to database:', dbError);
            // Continue without database - user can still use the AI data
        }

        return NextResponse.json({
            success: true,
            analysisResult,
            wine,
            // If we have a wine saved in DB, it's not "manual entry"
            // If wine is null but we have good AI data, show it pre-filled
            foundInDatabase: !!wine,
        });
    } catch (error) {
        console.error('Scan wine error:', error);
        return NextResponse.json(
            { error: 'Ett fel uppstod vid analys av bilden' },
            { status: 500 }
        );
    }
}
