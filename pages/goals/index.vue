<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Goals</h1>

    <!-- Form untuk Menambah Goal Baru -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Tambah Goal Baru</h2>
      <form @submit.prevent="addGoal" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div class="md:col-span-2">
          <label for="title" class="block text-sm font-medium text-gray-700">Judul Goal</label>
          <input v-model="newGoal.title" type="text" id="title" placeholder="e.g., Membaca 10 buku non-fiksi" class="mt-1 p-3 w-full border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" required>
        </div>
        <div>
          <label for="category" class="block text-sm font-medium text-gray-700">Kategori</label>
          <input v-model="newGoal.category" type="text" id="category" placeholder="e.g., Tahunan, Q3" class="mt-1 p-3 w-full border rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
        </div>
        <div>
          <label for="target" class="block text-sm font-medium text-gray-700">Target</label>
          <input v-model.number="newGoal.target" type="number" id="target" placeholder="100" min="1" class="mt-1 p-3 w-full border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" required>
        </div>
        <button type="submit" :disabled="isSubmitting" class="md:col-start-4 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">{{ isSubmitting ? 'Menyimpan...' : 'Simpan Goal' }}</button>
      </form>
    </div>

    <!-- Daftar Goals -->
    <div class="bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-700 p-6 border-b">Daftar Goal Saya</h2>
      <div v-if="isLoading" class="text-center p-8 text-gray-500">Memuat goals...</div>
      <div v-else-if="!goals || goals.length === 0" class="text-center p-8 text-gray-500">Anda belum memiliki goal. Mulai tambahkan satu!</div>
      <ul v-else class="divide-y">
        <li v-for="goal in goals" :key="goal.id" class="p-6">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="font-semibold text-lg text-gray-800">{{ goal.title }}</p>
              <p v-if="goal.category" class="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-full inline-block">{{ goal.category }}</p>
            </div>
            <button @click="deleteGoal(goal.id)" class="text-red-500 hover:text-red-700 font-semibold">Hapus</button>
          </div>
          <!-- Progress Bar & Controls -->
          <div class="flex items-center gap-4 mt-3">
            <button @click="updateProgress(goal, -1)" class="bg-gray-200 w-8 h-8 rounded-full font-bold text-lg text-gray-700 hover:bg-gray-300">-</button>
            <div class="w-full bg-gray-200 rounded-full h-6">
              <div class="bg-blue-600 h-6 rounded-full text-center text-white text-sm flex items-center justify-center" :style="{ width: `${(goal.progress / goal.target) * 100}%` }">
                <span class="px-2">{{ goal.progress }} / {{ goal.target }}</span>
              </div>
            </div>
            <button @click="updateProgress(goal, 1)" class="bg-gray-200 w-8 h-8 rounded-full font-bold text-lg text-gray-700 hover:bg-gray-300">+</button>
          </div>
        </li>
      </ul>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const supabase = useSupabaseClient();

// State
const goals = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const currentUserId = ref(null);
const newGoal = ref({
  title: '',
  category: '',
  target: 100,
});

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await fetchGoals();
    }
  } catch (e) {
    console.error("Gagal mendapatkan user di onMounted", e);
  } finally {
    isLoading.value = false;
  }
});

async function fetchGoals() {
  if (!currentUserId.value) return;
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', currentUserId.value)
      .order('created_at', { ascending: false });
    if (error) throw error;
    goals.value = data || [];
  } catch (e) {
    console.error("Error fetching goals:", e);
  } finally {
    isLoading.value = false;
  }
}

async function addGoal() {
  if (!currentUserId.value || !newGoal.value.title.trim()) return;
  isSubmitting.value = true;
  try {
    await supabase.from('goals').insert({
      user_id: currentUserId.value,
      title: newGoal.value.title,
      category: newGoal.value.category,
      target: newGoal.value.target,
      progress: 0, // Selalu mulai dari 0
    });
    newGoal.value = { title: '', category: '', target: 100 }; // Reset form
    await fetchGoals();
  } catch (e) {
    console.error("Error adding goal:", e);
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteGoal(id) {
  if (!confirm('Yakin ingin menghapus goal ini?')) return;
  try {
    await supabase.from('goals').delete().eq('id', id);
    await fetchGoals();
  } catch (e) {
    console.error("Error deleting goal:", e);
  }
}

async function updateProgress(goal, amount) {
  let newProgress = goal.progress + amount;
  // Pastikan progress tidak kurang dari 0 atau lebih dari target
  if (newProgress < 0) newProgress = 0;
  if (newProgress > goal.target) newProgress = goal.target;

  // Update lokal dulu untuk respons cepat
  goal.progress = newProgress;

  // Update ke database
  try {
    await supabase.from('goals').update({ progress: newProgress }).eq('id', goal.id);
  } catch (e) {
    console.error("Error updating progress:", e);
    // Jika gagal, kembalikan ke nilai semula (opsional)
    // await fetchGoals(); 
  }
}

</script>
