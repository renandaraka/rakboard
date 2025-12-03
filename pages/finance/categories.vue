<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Kategori Transaksi</h1>

    <!-- 1. Form untuk Menambah Kategori Baru -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Tambah Kategori Baru</h2>
      <form @submit.prevent="addCategory" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div class="md:col-span-2">
          <label for="name" class="block text-sm font-medium text-gray-700">Nama Kategori</label>
          <input
            v-model="newCategory.name"
            type="text"
            id="name"
            placeholder="e.g., Makanan, Gaji, Transportasi"
            class="mt-1 p-3 w-full border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700">Tipe</label>
          <select
            v-model="newCategory.type"
            id="type"
            class="mt-1 p-3 w-full border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            required
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </div>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="md:col-start-3 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {{ isSubmitting ? 'Menyimpan...' : 'Tambah Kategori' }}
        </button>
      </form>
    </div>

    <!-- 2. Daftar Kategori yang Sudah Ada -->
    <div class="bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-700 p-6 border-b">Daftar Kategori Saya</h2>
      <div class="grid grid-cols-1 md:grid-cols-2">
        <!-- Kolom Pengeluaran -->
        <div>
          <h3 class="text-lg font-semibold text-gray-600 p-4 bg-gray-50 border-b border-r">Pengeluaran</h3>
          <ul class="divide-y border-r">
            <li v-for="cat in expenseCategories" :key="cat.id" class="p-4 flex items-center justify-between">
              <span class="text-gray-800">{{ cat.name }}</span>
              <button @click="deleteCategory(cat.id)" class="text-red-500 hover:text-red-700 font-semibold text-sm">Hapus</button>
            </li>
            <li v-if="expenseCategories.length === 0" class="p-4 text-center text-gray-500">Belum ada kategori pengeluaran.</li>
          </ul>
        </div>
        <!-- Kolom Pemasukan -->
        <div>
          <h3 class="text-lg font-semibold text-gray-600 p-4 bg-gray-50 border-b">Pemasukan</h3>
          <ul class="divide-y">
            <li v-for="cat in incomeCategories" :key="cat.id" class="p-4 flex items-center justify-between">
              <span class="text-gray-800">{{ cat.name }}</span>
              <button @click="deleteCategory(cat.id)" class="text-red-500 hover:text-red-700 font-semibold text-sm">Hapus</button>
            </li>
            <li v-if="incomeCategories.length === 0" class="p-4 text-center text-gray-500">Belum ada kategori pemasukan.</li>
          </ul>
        </div>
      </div>
       <div v-if="isLoading" class="p-8 text-center text-gray-500">Memuat kategori...</div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const supabase = useSupabaseClient();

// State
const categories = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const currentUserId = ref(null);
const newCategory = ref({
  name: '',
  type: 'expense' // Default ke pengeluaran
});

// Computed properties untuk memisahkan kategori
const expenseCategories = computed(() => categories.value.filter(c => c.type === 'expense'));
const incomeCategories = computed(() => categories.value.filter(c => c.type === 'income'));

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await fetchCategories();
    }
  } catch (e) {
    console.error("Gagal mendapatkan user di onMounted", e);
  } finally {
    isLoading.value = false;
  }
});

async function fetchCategories() {
  if (!currentUserId.value) return;
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('finance_categories')
      .select('*')
      .eq('user_id', currentUserId.value)
      .order('name', { ascending: true });
    if (error) throw error;
    categories.value = data || [];
  } catch (e) {
    console.error("Error fetching categories:", e);
  } finally {
    isLoading.value = false;
  }
}

async function addCategory() {
  if (!currentUserId.value || !newCategory.value.name.trim()) return;
  isSubmitting.value = true;
  try {
    await supabase.from('finance_categories').insert({
      user_id: currentUserId.value,
      name: newCategory.value.name,
      type: newCategory.value.type,
    });
    newCategory.value.name = ''; // Reset form
    await fetchCategories();
  } catch (e) {
    console.error("Error adding category:", e);
    alert(`Gagal menambahkan kategori: ${e.message}`);
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteCategory(id) {
  if (!confirm('Yakin ingin menghapus kategori ini? Menghapus kategori akan mengatur ulang transaksi terkait, bukan menghapusnya.')) return;
  try {
    await supabase.from('finance_categories').delete().eq('id', id);
    await fetchCategories();
  } catch (e) {
    console.error("Error deleting category:", e);
  }
}

</script>
