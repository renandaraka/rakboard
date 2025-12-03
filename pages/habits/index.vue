<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Habits</h1>

    <!-- Form untuk Membuat Habit Baru -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Tambah Habit Baru</h2>
      <form @submit.prevent="addHabit">
        <div class="flex flex-col space-y-4">
          <input
            v-model="newHabit.name"
            type="text"
            placeholder="Nama habit (e.g., Olahraga pagi)"
            class="p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <textarea
            v-model="newHabit.description"
            placeholder="Deskripsi singkat (opsional)"
            rows="2"
            class="p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
          <button
            type="submit"
            :disabled="!currentUserId || isSubmitting"
            class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="!currentUserId">Menunggu User...</span>
            <span v-else-if="isSubmitting">Menyimpan...</span>
            <span v-else>Simpan Habit</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Daftar Habit -->
    <div class="bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-700 p-6 border-b">Daftar Habit Saya</h2>
      
      <div v-if="isLoading" class="text-center p-8">
        <p class="text-gray-500">Memuat data...</p>
      </div>

      <div v-else-if="!habits || habits.length === 0" class="text-center p-8">
        <p class="text-gray-500">Anda belum memiliki habit. Mulai tambahkan satu!</p>
      </div>
      
      <ul v-else class="divide-y">
        <li v-for="habit in habits" :key="habit.id" class="p-6 flex items-center justify-between">
          <div class="flex items-center">
            <button @click="toggleHabitStatus(habit)" class="mr-4">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center border-2', isCompletedToday(habit) ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500']">
                <svg v-if="isCompletedToday(habit)" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
            </button>
            <div>
              <p class="font-semibold text-lg text-gray-800">{{ habit.name }}</p>
              <p v-if="habit.description" class="text-gray-600 text-sm">{{ habit.description }}</p>
            </div>
          </div>
          <button @click="deleteHabit(habit.id)" class="text-red-500 hover:text-red-700 font-semibold">
            Hapus
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const supabase = useSupabaseClient();

// State utama disederhanakan
const habits = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const newHabit = ref({ name: '', description: '' });
const currentUserId = ref(null); // <- Satu-satunya sumber kebenaran untuk ID pengguna

// Fungsi untuk mengambil data, sekarang sangat sederhana
async function fetchHabits() {
  if (!currentUserId.value) return;
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*, habit_entries(*)')
      .eq('user_id', currentUserId.value)
      .order('created_at', { ascending: false });
    if (error) throw error;
    habits.value = data || [];
  } catch (e) {
    console.error("Error fetching habits:", e);
  } finally {
    isLoading.value = false;
  }
}

// onMounted HANYA berjalan di sisi KLIEN/BROWSER setelah halaman siap
onMounted(async () => {
  console.log('Halaman Siap. Memeriksa sesi pengguna secara manual...');
  try {
    // Perintah langsung untuk mendapatkan sesi dari browser
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Gagal memeriksa sesi:', error.message);
      isLoading.value = false;
      return;
    }

    if (user) {
      console.log('Sesi ditemukan. ID Pengguna:', user.id);
      currentUserId.value = user.id; // <- Set ID pengguna di sini
      await fetchHabits(); // <- BARU ambil data setelah ID dijamin ada
    } else {
      console.log('Tidak ada sesi pengguna aktif.');
      isLoading.value = false;
    }
  } catch(e) {
    console.error('Terjadi error kritis saat onMounted:', e);
    isLoading.value = false;
  }
});

// --- Fungsi Aksi --- (Sekarang mengandalkan `currentUserId`)

async function addHabit() {
  if (!currentUserId.value || !newHabit.value.name.trim()) return;
  isSubmitting.value = true;
  try {
    await supabase.from('habits').insert({ name: newHabit.value.name, description: newHabit.value.description, user_id: currentUserId.value });
    newHabit.value = { name: '', description: '' };
    await fetchHabits();
  } catch (e) {
    console.error("Error adding habit:", e);
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteHabit(id) {
  if (!currentUserId.value || !confirm('Yakin ingin menghapus habit ini?')) return;
  try {
    await supabase.from('habits').delete().eq('id', id);
    await fetchHabits();
  } catch (e) {
    console.error("Error deleting habit:", e);
  }
}

const getToday = () => new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0];
const isCompletedToday = (habit) => habit.habit_entries?.some(entry => entry.date === getToday() && entry.status);

async function toggleHabitStatus(habit) {
  if (!currentUserId.value) return;
  const today = getToday();
  const existingEntry = habit.habit_entries?.find(entry => entry.date === today);
  try {
    if (existingEntry) {
      await supabase.from('habit_entries').delete().match({ id: existingEntry.id });
    } else {
      await supabase.from('habit_entries').insert({ habit_id: habit.id, user_id: currentUserId.value, date: today, status: true });
    }
    await fetchHabits();
  } catch (e) {
    console.error("Error toggling status:", e);
  }
}
</script>