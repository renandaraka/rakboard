export default defineEventHandler((event) => {
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NUXT_PUBLIC_SUPABASE_KEY;

  return {
    message: 'Reading environment variables from the server:',
    supabaseUrl: url || 'NOT FOUND',
    supabaseKey: key ? 'FOUND' : 'NOT FOUND' // Do not expose the key itself
  };
});
