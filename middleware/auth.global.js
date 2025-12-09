export default defineNuxtRouteMiddleware(async (to, from) => {
  // Gunakan useSupabaseClient untuk mendapatkan session secara async
  // Ini lebih reliable untuk SSR dibanding useSupabaseUser
  const supabase = useSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Jika pengguna belum login dan mencoba mengakses halaman selain /login,
  // arahkan mereka ke halaman /login.
  if (!session && to.path !== '/login') {
    return navigateTo('/login');
  }

  // Jika pengguna sudah login dan mencoba mengakses halaman /login,
  // arahkan mereka ke dashboard.
  if (session && to.path === '/login') {
    return navigateTo('/dashboard');
  }
});
