export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser();

  // Jika pengguna belum login dan mencoba mengakses halaman selain /login,
  // arahkan mereka ke halaman /login.
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login');
  }

  // Jika pengguna sudah login dan mencoba mengakses halaman /login,
  // arahkan mereka ke dashboard.
  if (user.value && to.path === '/login') {
    return navigateTo('/dashboard');
  }
});
