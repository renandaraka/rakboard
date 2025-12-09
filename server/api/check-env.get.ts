export default defineEventHandler((event) => {
    const config = useRuntimeConfig()

    return {
        status: 'ok',
        environment: process.env.NODE_ENV,
        hasSupabaseUrl: !!config.public.supabase.url,
        hasSupabaseKey: !!config.public.supabase.key,
        supabaseUrlPreview: config.public.supabase.url ? config.public.supabase.url.substring(0, 15) + '...' : 'MISSING',
        // Do NOT return the full key for security, just check presence
        supabaseKeyLength: config.public.supabase.key ? config.public.supabase.key.length : 0
    }
})
