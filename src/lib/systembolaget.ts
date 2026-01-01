import type { SystembolagetProduct } from './types';

const SYSTEMBOLAGET_SEARCH_URL = 'https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search';

interface SystembolagetSearchResponse {
    products?: Array<{
        productId: string;
        productNumber: string;
        productNameBold: string;
        productNameThin?: string;
        price: number;
        tasteSymbols?: string[];
        tapiTasteArray?: string[];
        images?: Array<{
            imageUrl: string;
        }>;
    }>;
}

export async function searchSystembolaget(
    wineName: string,
    producer?: string | null
): Promise<SystembolagetProduct | null> {
    // Build search query
    const searchQuery = producer
        ? `${wineName} ${producer}`.trim()
        : wineName;

    const url = `${SYSTEMBOLAGET_SEARCH_URL}?q=${encodeURIComponent(searchQuery)}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://www.systembolaget.se/'
            }
        });

        if (!response.ok) {
            console.warn(`Systembolaget API returned ${response.status}. Fallback to manual entry.`);
            return null;
        }

        const data: SystembolagetSearchResponse = await response.json();

        // The API structure returns { products: [...] }
        const products = data.products || [];

        if (products.length === 0) {
            console.log('No products found on Systembolaget for:', searchQuery);
            return null;
        }

        // Return the best match (first item)
        const match = products[0];

        const fullName = match.productNameThin
            ? `${match.productNameBold} ${match.productNameThin}`
            : match.productNameBold;

        return {
            articleNumber: match.productNumber || match.productId,
            name: fullName,
            price: match.price,
            foodPairingTags: match.tasteSymbols || match.tapiTasteArray || [],
            url: `https://www.systembolaget.se/produkt/${match.productNumber || match.productId}`,
            imageUrl: match.images?.[0]?.imageUrl || null,
        };

    } catch (error) {
        console.error('Systembolaget fetch failed:', error);
        return null; // Fail gracefully so app doesn't crash
    }
}
