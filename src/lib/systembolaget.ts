import type { SystembolagetProduct } from './types';

const SYSTEMBOLAGET_SEARCH_URL = 'https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search';

interface SystembolagetSearchResponse {
    products?: Array<{
        productId: string;
        productNumber: string;
        productNameBold: string;
        productNameThin?: string;
        price: number;
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
    try {
        // Build search query
        const searchQuery = producer
            ? `${wineName} ${producer}`.trim()
            : wineName;

        const params = new URLSearchParams({
            q: searchQuery,
            size: '10',
            page: '1',
        });

        const response = await fetch(`${SYSTEMBOLAGET_SEARCH_URL}?${params}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7',
                'Origin': 'https://www.systembolaget.se',
                'Referer': 'https://www.systembolaget.se/',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Systembolaget API error:', response.status, response.statusText);
            return null;
        }

        const data: SystembolagetSearchResponse = await response.json();

        if (!data.products || data.products.length === 0) {
            return null;
        }

        // Find best match (simple string matching for now)
        const product = data.products[0];

        const fullName = product.productNameThin
            ? `${product.productNameBold} ${product.productNameThin}`
            : product.productNameBold;

        return {
            articleNumber: product.productNumber || product.productId,
            name: fullName,
            price: product.price,
            foodPairingTags: product.tapiTasteArray || [],
            url: `https://www.systembolaget.se/produkt/vin/${product.productNumber || product.productId}`,
            imageUrl: product.images?.[0]?.imageUrl || null,
        };
    } catch (error) {
        console.error('Systembolaget search error:', error);
        return null;
    }
}
