<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-800">Rakboard</h1>
        <p class="text-gray-600">Daftar Akun Baru atau Login</p>
      </div>
      <form class="space-y-6" @submit.prevent="handleSmartLogin">
        <div>
          <label for="email" class="text-sm font-medium text-gray-700">Alamat Email</label>
          <input 
            id="email" 
            v-model="email" 
            type="email" 
            required 
            class="w-full p-3 mt-1 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Masukkan email Anda"
          />
        </div>
        <div>
          <label for="password" class="text-sm font-medium text-gray-700">Password</label>
          <input 
            id="password" 
            v-model="password" 
            type="password" 
            required 
            class="w-full p-3 mt-1 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Minimal 6 karakter"
          />
        </div>
        <div v-if="errorMessage" class="text-red-500 text-sm text-center">
          {{ errorMessage }}
        </div>
        <div>
          <button 
            type="submit" 
            :disabled="loading" 
            class="w-full py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
          >
            {{ loading ? 'Memproses...' : 'Lanjutkan' }}
          </button>
        </div>
      </form>
       <p class="text-xs text-center text-gray-500">Jika email belum ada, akun baru akan dibuat. Jika sudah ada, sistem akan login.</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'empty' });

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const supabase = useSupabaseClient();
const user = useSupabaseUser();

// Pengamat ini akan secara otomatis mengarahkan pengguna ke dashboard
// setelah mereka berhasil login dan data pengguna tersedia.
// Menggunakan navigateTo() yang aman untuk SSR (Server-Side Rendering).
watch(user, (currentUser) => {
  if (currentUser) {
    return navigateTo('/dashboard');
  }
}, { immediate: true });

// Fungsi login/signup cerdas
const handleSmartLogin = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    // 1. Coba daftarkan pengguna baru (sign up)
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    });

    // Jika error karena user sudah terdaftar, coba login
    if (signUpError && signUpError.message.includes('already registered')) {
      console.log('User exists, attempting to sign in...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });

      // Jika login juga gagal (misal: password salah), tampilkan error
      if (signInError) throw signInError;
      
    } else if (signUpError) {
      // Jika ada error lain saat sign up, tampilkan
      throw signUpError;
    }
    
    // Jika berhasil, kita tidak perlu redirect di sini.
    // Pengamat (watch) di atas akan menanganinya secara otomatis.
    console.log('Login/Signup process initiated...');

  } catch (error) {
    console.error('Authentication error:', error);
    errorMessage.value = `Gagal: ${error.message}`;
  } finally {
    loading.value = false;
  }
};
</script>
