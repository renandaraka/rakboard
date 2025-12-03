<template>
  <div id="app" class="flex h-screen bg-gray-100 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow-md flex flex-col">
      <div class="h-20 flex items-center justify-center border-b">
        <h1 class="text-2xl font-bold text-gray-800">Rakboard</h1>
      </div>
      <nav class="flex-1 px-4 py-6 space-y-2">
        <NuxtLink to="/dashboard" class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
          <span class="mr-3">D</span> 
          Dashboard
        </NuxtLink>
        <NuxtLink to="/habits" class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
          <span class="mr-3">H</span>
          Habits
        </NuxtLink>
        <NuxtLink to="/learning" class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
          <span class="mr-3">L</span>
          Learning
        </NuxtLink>
        <NuxtLink to="/journal" class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
          <span class="mr-3">J</span>
          Journal
        </NuxtLink>
        <NuxtLink to="/goals" class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
          <span class="mr-3">G</span>
          Goals
        </NuxtLink>

        <!-- Finance Dropdown -->
        <div>
          <button @click="isFinanceOpen = !isFinanceOpen" class="w-full flex justify-between items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
            <span class="flex items-center">
              <span class="mr-3">F</span>
              Finance
            </span>
            <svg :class="{'rotate-180': isFinanceOpen}" class="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div v-if="isFinanceOpen" class="mt-2 space-y-2 pl-8">
            <NuxtLink to="/finance/summary" class="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200">Ringkasan</NuxtLink>
            <NuxtLink to="/finance/transactions" class="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200">Transaksi</NuxtLink>
            <NuxtLink to="/finance/goals" class="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200">Tujuan</NuxtLink>
            <NuxtLink to="/finance/accounts" class="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200">Akun</NuxtLink>
            <NuxtLink to="/finance/categories" class="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200">Kategori</NuxtLink>
          </div>
        </div>

        <!-- Productive Dropdown -->
        <div>
          <button @click="isProductiveOpen = !isProductiveOpen" class="w-full flex justify-between items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
            <span class="flex items-center">
              <span class="mr-3">P</span>
              Productive
            </span>
            <svg :class="{'rotate-180': isProductiveOpen}" class="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div v-if="isProductiveOpen" class="mt-2 space-y-2 pl-8">
            <NuxtLink to="/productive/summary" class="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200">Summary</NuxtLink>
            <NuxtLink to="/productive/projects" class="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200">Projects</NuxtLink>
            <NuxtLink to="/productive/jobs" class="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200">Job Tracker</NuxtLink>
          </div>
        </div>

      </nav>

      <!-- Logout and Copyright Section -->
      <div class="px-4 py-4 border-t">
        <button @click="handleLogout" class="w-full flex items-center justify-center px-4 py-2 mb-4 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
          <span class="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
            </svg>
          </span>
          Logout
        </button>
        <p class="text-sm text-gray-500 text-center">© 2024 Rakboard</p>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div class="container mx-auto px-6 py-8">
          <NuxtPage />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const supabase = useSupabaseClient();
const router = useRouter();
const isFinanceOpen = ref(true);
const isProductiveOpen = ref(true);

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error logging out:', error.message);
    return;
  }
  // Redirect to the login page after successful logout
  await router.push('/login');
};
</script>

<style>
/* Styling untuk link yang aktif */
.router-link-exact-active {
  background-color: #e5e7eb; /* bg-gray-200 */
  color: #1f2937; /* text-gray-800 */
  font-weight: 600;
}

/* Menghapus underline dari link */
a {
  text-decoration: none;
}
</style>
