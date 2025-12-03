<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Tujuan Tabungan</h1>

    <!-- Tombol untuk membuka form -->
    <div class="mb-6 text-right">
      <button @click="isFormVisible = !isFormVisible" class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
        {{ isFormVisible ? 'Tutup Form' : '+ Tambah Tujuan Baru' }}
      </button>
    </div>

    <!-- Form untuk Menambah Tujuan Baru -->
    <div v-if="isFormVisible" class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Tujuan Baru</h2>
      <form @submit.prevent="addGoal" class="space-y-4">
        <div>
          <label for="goal-name" class="block text-sm font-medium text-gray-700">Nama Tujuan</label>
          <input v-model="newGoal.name" type="text" id="goal-name" placeholder="e.g., Mobil Baru" class="mt-1 p-3 w-full border rounded-lg" required>
        </div>
        <div>
          <label for="goal-target" class="block text-sm font-medium text-gray-700">Target Jumlah (Rp)</label>
          <input v-model.number="newGoal.target_amount" type="number" id="goal-target" placeholder="400000000" min="1000" step="1000" class="mt-1 p-3 w-full border rounded-lg" required>
        </div>
        <div class="text-right">
          <button type="submit" :disabled="isSubmitting" class="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Tujuan' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Daftar Tujuan Tabungan -->
    <div v-if="isLoading" class="text-center p-8 text-gray-500">Memuat tujuan tabungan...</div>
    <div v-else-if="!goals || goals.length === 0" class="text-center p-8 text-gray-500 bg-white rounded-lg shadow-md">
      Belum ada tujuan tabungan. Mulai buat satu!
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="goal in goals" :key="goal.id" class="bg-white rounded-lg shadow-md p-6 flex flex-col">
        <h3 class="text-lg font-bold text-gray-800">{{ goal.name }}</h3>
        <p class="text-sm text-gray-500 mb-4">Terkumpul: {{ formatCurrency(goal.current_amount) }}</p>
        
        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: getProgress(goal) + '%' }"></div>
        </div>
        <div class="flex justify-between text-sm font-medium text-gray-600 mb-4">
          <span>{{ getProgress(goal).toFixed(1) }}%</span>
          <span>{{ formatCurrency(goal.target_amount) }}</span>
        </div>

        <div class="mt-auto pt-4 border-t border-gray-200">
             <button @click="openAllocationModal(goal)" class="w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
               Alokasikan Dana
             </button>
        </div>
      </div>
    </div>
    
    <!-- Modal Alokasi Dana -->
    <div v-if="allocationModal.isVisible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4">Alokasi ke: {{ allocationModal.goal.name }}</h2>
        <form @submit.prevent="handleAllocation">
          <div>
            <label for="allocation-amount" class="block text-sm font-medium text-gray-700">Jumlah Alokasi (Rp)</label>
            <input v-model.number="allocationModal.amount" type="number" id="allocation-amount" placeholder="e.g., 500000" min="1" class="mt-1 p-3 w-full border rounded-lg" required>
             <p class="text-sm text-gray-500 mt-2">Ini akan membuat transaksi pengeluaran baru secara otomatis.</p>
          </div>
          <div class="mt-6 flex justify-end space-x-4">
            <button type="button" @click="allocationModal.isVisible = false" class="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Batal</button>
            <button type="submit" :disabled="isSubmitting" class="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
               {{ isSubmitting ? 'Memproses...' : 'Alokasikan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const supabase = useSupabaseClient();

const goals = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const currentUserId = ref(null);
const isFormVisible = ref(false);

const newGoal = ref({
  name: '',
  target_amount: null,
});

const allocationModal = ref({
  isVisible: false,
  goal: null,
  amount: null,
});

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await fetchGoals();
    } else {
      isLoading.value = false;
    }
  } catch (e) {
    console.error("Gagal saat memuat halaman tujuan:", e);
    isLoading.value = false;
  }
});

async function fetchGoals() {
  if (!currentUserId.value) return;
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('finance_savings_goals')
      .select('*')
      .eq('user_id', currentUserId.value)
      .order('created_at', { ascending: false });
    if (error) throw error;
    goals.value = data || [];
  } catch (e) {
    console.error("Error fetching savings goals:", e);
  } finally {
    isLoading.value = false;
  }
}

async function addGoal() {
  if (!newGoal.value.name || !newGoal.value.target_amount) {
    alert('Nama tujuan dan target jumlah tidak boleh kosong.');
    return;
  }
  isSubmitting.value = true;
  try {
    await supabase.from('finance_savings_goals').insert({
        user_id: currentUserId.value,
        name: newGoal.value.name,
        target_amount: newGoal.value.target_amount,
    }).select();
    
    await fetchGoals();
    newGoal.value = { name: '', target_amount: null };
    isFormVisible.value = false;
  } catch (e) {
    console.error("Error adding saving goal:", e);
    alert('Gagal menambahkan tujuan: ' + e.message);
  } finally {
    isSubmitting.value = false;
  }
}

function openAllocationModal(goal) {
  allocationModal.value.goal = goal;
  allocationModal.value.amount = null;
  allocationModal.value.isVisible = true;
}

async function handleAllocation() {
  isSubmitting.value = true;
  const { goal, amount } = allocationModal.value;

  if (!goal || !amount || amount <= 0) {
    alert('Jumlah alokasi tidak valid.');
    isSubmitting.value = false;
    return;
  }

  try {
    // Memanggil fungsi database 'allocate_to_goal' yang akan kita buat di Langkah 2
    const { error } = await supabase.rpc('allocate_to_goal', {
      p_goal_id: goal.id,
      p_amount: amount,
      p_user_id: currentUserId.value
    });

    if (error) throw error;

    alert(`Berhasil mengalokasikan ${formatCurrency(amount)} untuk ${goal.name}!`);
    await fetchGoals(); // Refresh progress
    allocationModal.value.isVisible = false;

  } catch(e) {
    console.error("Error during allocation:", e);
    alert('Gagal mengalokasikan dana: ' + e.message);
  } finally {
    isSubmitting.value = false;
  }
}

// Fungsi helper
const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const getProgress = (goal) => {
  if (!goal || !goal.target_amount || goal.target_amount === 0) return 0;
  return (goal.current_amount / goal.target_amount) * 100;
};
</script>
