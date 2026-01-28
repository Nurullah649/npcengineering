import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

export type CacheOptions = {
    tags: string[];
    revalidate?: number; // seconds
};

/**
 * Wraps a database query with Next.js unstable_cache for caching data.
 * 
 * @param queryFn The async function that fetches data from the database
 * @param keyParts An array of strings to uniquely identify this query key
 * @param options Caching options (tags and revalidation time)
 * @returns Cached data
 * 
 * @example
 * // OLD:
 * const { data } = await supabase.from('packages').select('*');
 * 
 * // NEW:
 * const packages = await cachedQuery(
 *   async () => {
 *     const { data } = await supabase.from('packages').select('*');
 *     return data;
 *   },
 *   ['packages-list'],
 *   { tags: ['packages'], revalidate: 3600 }
 * );
 */
export async function cachedQuery<T>(
    queryFn: () => Promise<T>,
    keyParts: string[],
    options: CacheOptions
): Promise<T> {
    const { tags, revalidate } = options;

    const cachedFn = unstable_cache(
        async () => {
            console.log(`[CACHE MISS] Fetching data for tags: [${tags.join(', ')}]`);
            return await queryFn();
        },
        keyParts,
        {
            tags,
            revalidate
        }
    );

    // Note: unstable_cache doesn't easily allow logging "HIT" inside effectively 
    // without wrapping it further or assuming if the inside function isn't called it was a hit.
    // However, the inner function only runs on MISS.
    // So we can assume if we are here and the inner function runs, it's a MISS.
    // We can log "HIT" loosely by checking performance manually, but standard logging is best done inside the callback for MISS.

    // To strictly log HIT, we would need to check if the data was retrieved without triggering the callback, 
    // which Next.js doesn't expose directly. 
    // For now, seeing "CACHE MISS" in logs implies a miss, lack of it implies a HIT.

    return cachedFn();
}

/**
 * Invalidates the cache for a specific tag.
 * This should be called from Server Actions or Route Handlers after a mutation.
 * 
 * @param tag The tag to invalidate (e.g., 'packages')
 */
export async function invalidateCache(tag: string) {
    console.log(`[CACHE INVALIDATION] Invalidate tag: ${tag}`);
    revalidateTag(tag);
}
