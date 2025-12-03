<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-2">Ringkasan Keuangan</h1>

    <!-- Navigasi Bulan -->
    <div class="flex items-center justify-center space-x-4 mb-6">
      <button @click="changeMonth(-1)" class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors" :disabled="isLoading">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h2 class="text-2xl font-semibold text-gray-700 w-48 text-center">{{ monthYear }}</h2>
      <button @click="changeMonth(1)" class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors" :disabled="isLoading">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>

    <!-- Status Loading -->
    <div v-if="isLoading" class="text-center py-10 text-gray-500">
      Memuat data untuk {{ monthYear }}...
    </div>
    
    <!-- Status Belum Login -->
    <div v-else-if="!currentUserId" class="text-center py-10 text-gray-500">Silakan login untuk melihat ringkasan.</div>
    
    <!-- Tampilan Data -->
    <div v-else>
      <!-- Kartu Saldo Berkelanjutan -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard title="Saldo Awal Bulan" :value="previousMonthBalance" type="balance" />
        <SummaryCard title="Pemasukan Bulan Ini" :value="totalIncome" type="income" />
        <SummaryCard title="Pengeluaran Bulan Ini" :value="totalExpense" type="expense" />
        <SummaryCard title="Saldo Akhir Bulan" :value="endOfMonthBalance" type="balance" is-highlighted />
      </div>

      <!-- Grafik -->
       <div v-if="transactions.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SummaryChart title="Rincian Pengeluaran" :chartData="expenseChartData" />
        <SummaryChart title="Rincian Pemasukan" :chartData="incomeChartData" />
      </div>
      <div v-else class="text-center py-10 text-gray-500 bg-white rounded-lg shadow-md">Belum ada transaksi di bulan ini.</div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import SummaryCard from '@/components/Finance/SummaryCard.vue';
import SummaryChart from '@/components/Finance/SummaryChart.vue';

const supabase = useSupabaseClient();

const transactions = ref([]);
const isLoading = ref(true);
const date = ref(new Date());
const previousMonthBalance = ref(0);
const currentUserId = ref(null); // Menggunakan pola dari file Anda yang lain

const monthYear = computed(() => date.value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));

async function fetchDataForMonth(targetDate) {
  if (!currentUserId.value) return;
  isLoading.value = true;

  const firstDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split('T')[0];

  try {
    const [transactionsResponse, previousBalanceResponse] = await Promise.all([
      supabase
        .from('finance_transactions')
        .select('amount, type, finance_categories (name)') // Pola query yang benar
        .eq('user_id', currentUserId.value)
        .gte('transaction_date', firstDayOfMonth)
        .lte('transaction_date', lastDayOfMonth),
      
      supabase
        .from('finance_transactions')
        .select('amount, type')
        .eq('user_id', currentUserId.value)
        .lt('transaction_date', firstDayOfMonth)
    ]);

    if (transactionsResponse.error) throw transactionsResponse.error;
    if (previousBalanceResponse.error) throw previousBalanceResponse.error;

    transactions.value = transactionsResponse.data || [];
    previousMonthBalance.value = (previousBalanceResponse.data || []).reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

  } catch (e) {
    console.error("Gagal mengambil data keuangan:", e);
    transactions.value = [];
    previousMonthBalance.value = 0;
  } finally {
    isLoading.value = false;
  }
}

function changeMonth(monthOffset) {
  const newDate = new Date(date.value);
  newDate.setMonth(newDate.getMonth() + monthOffset);
  date.value = newDate;
}

// Computed properties untuk agregasi (dengan saldo berkelanjutan)
const totalIncome = computed(() => transactions.value.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0));
const totalExpense = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));
const endOfMonthBalance = computed(() => previousMonthBalance.value + totalIncome.value - totalExpense.value);

// Computed properties untuk grafik (aman dari error)
const expenseChartData = computed(() => processDataForChart('expense'));
const incomeChartData = computed(() => processDataForChart('income'));

function processDataForChart(type) {
  const dataMap = new Map();
  transactions.value.filter(t => t.type === type).forEach(t => {
    const categoryName = t.finance_categories?.name || 'Tanpa Kategori';
    dataMap.set(categoryName, (dataMap.get(categoryName) || 0) + t.amount);
  });
  return { labels: [...dataMap.keys()], datasets: [{ backgroundColor: generateColors(dataMap.size), data: [...dataMap.values()] }] };
}

function generateColors(count) {
  return Array.from({length: count}, (_, i) => `hsl(${(i * 360 / count)}, 70%, 70%)`);
}

// --- LIFECYCLE HOOKS (MENGIKUTI POLA ANDA YANG BENAR) ---

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await fetchDataForMonth(date.value); // Ambil data setelah ID pasti ada
    } else {
      isLoading.value = false; // Berhenti memuat jika tidak ada user
    }
  } catch (e) {
    console.error("Gagal saat memuat halaman ringkasan:", e);
    isLoading.value = false; // Berhenti memuat jika ada error
  }
});

watch(date, (newDate) => {
  if (currentUserId.value) {
    fetchDataForMonth(newDate);
  }
});

</script>
