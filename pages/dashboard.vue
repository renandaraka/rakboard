<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
    
    <!-- Welcome Card -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Selamat Datang Kembali, {{ userEmail }}!</h2>
      <p class="text-gray-600">Ini adalah ringkasan aktivitas dan progres terbaru Anda. Teruslah berusaha mencapai tujuan Anda!</p>
    </div>

    <div v-if="isLoading" class="text-center text-gray-500 py-10">
      Memuat data dashboard...
    </div>
    <div v-else-if="!currentUserId" class="text-center text-gray-500 py-10">Gagal memuat data pengguna. Silakan coba lagi.</div>

    <div v-else>
      <!-- Quick Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        <!-- Uang Anda Saat Ini Card -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="font-semibold text-gray-700">Uang Anda Saat Ini</h3>
          <p class="text-3xl font-bold text-blue-600 mt-2">{{ formatCurrency(currentBalance) }}</p>
        </div>

        <!-- Total Habits Card -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="font-semibold text-gray-700">Total Habits</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ totalHabits }}</p>
        </div>

        <!-- Active Goals Card -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="font-semibold text-gray-700">Goals Aktif</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ activeGoals }}</p>
        </div>

        <!-- Journal Today Card -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="font-semibold text-gray-700">Jurnal Hari Ini</h3>
          <p class="text-3xl font-bold mt-2" :class="journalToday ? 'text-green-500' : 'text-red-500'">
            <span v-if="journalToday">✓</span>
            <span v-else>✗</span>
          </p>
        </div>
      </div>

      <!-- Chart Card -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">Laporan Belajar Mingguan</h2>
        <div class="h-64">
          <BarChart :chart-data="learningChartData" />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import BarChart from '~/components/BarChart.vue';

const supabase = useSupabaseClient();

// Menggunakan pola yang sudah terbukti aman dari summary.vue
const isLoading = ref(true);
const currentUserId = ref(null);
const userEmail = ref('');

// State untuk setiap kartu
const totalHabits = ref(0);
const activeGoals = ref(0);
const journalToday = ref(false);
const currentBalance = ref(0);
const learningChartData = ref({ labels: [], datasets: [{ data: [] }] });

// Channel untuk real-time updates
const supabaseChannel = ref(null);

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

// --- DATA FETCHING FUNCTIONS ---

async function fetchAllDashboardData() {
  if (!currentUserId.value) return;
  isLoading.value = true;
  try {
    // Menjalankan semua fetch secara paralel untuk efisiensi
    await Promise.all([
      fetchCurrentBalance(),
      fetchTotalHabits(),
      fetchActiveGoals(),
      fetchJournalStatus(),
      fetchLearningData(),
    ]);
  } catch(e) {
    console.error("Error fetching dashboard data:", e)
  } finally {
    isLoading.value = false;
  }
}

async function fetchCurrentBalance() {
  // Kueri ini sekarang menghitung total saldo, bukan hanya saldo bulan ini
  const { data, error } = await supabase
    .from('finance_transactions')
    .select('type, amount')
    .eq('user_id', currentUserId.value);
  if (error) throw error;
  currentBalance.value = (data || []).reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
}

async function fetchTotalHabits() {
  const { count, error } = await supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', currentUserId.value);
  if (error) throw error;
  totalHabits.value = count || 0;
}

async function fetchActiveGoals() {
  const { count, error } = await supabase.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', currentUserId.value).eq('is_completed', false);
  if (error) throw error;
  activeGoals.value = count || 0;
}

async function fetchJournalStatus() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('journal_entries').select('id').eq('user_id', currentUserId.value).eq('entry_date', today).limit(1);
  if (error) throw error;
  journalToday.value = data && data.length > 0;
}

async function fetchLearningData() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data, error } = await supabase.from('learning_logs').select('log_date, duration').eq('user_id', currentUserId.value).gte('log_date', weekAgo);
  if (error) throw error;
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().split('T')[0]; }).reverse();
  const labels = days.map(d => new Date(d).toLocaleDateString('id-ID', { weekday: 'short' }));
  const dailyData = Array(7).fill(0);
  for (const log of data) {
    const dayIndex = days.indexOf(new Date(log.log_date).toISOString().split('T')[0]);
    if (dayIndex !== -1) dailyData[dayIndex] += log.duration / 60;
  }
  learningChartData.value = { labels, datasets: [{ label: 'Jam Belajar', backgroundColor: '#4f46e5', borderRadius: 4, data: dailyData.map(h => h.toFixed(1)) }] };
}

// --- LIFECYCLE HOOKS & REAL-TIME --- 

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      userEmail.value = user.email;
      await fetchAllDashboardData();

      // Setup real-time listener hanya setelah data awal berhasil dimuat
      supabaseChannel.value = supabase.channel('public:finance_transactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions', filter: `user_id=eq.${user.id}` }, 
          () => {
            console.log('Perubahan finansial terdeteksi, mengambil ulang saldo...');
            fetchCurrentBalance();
          }
        )
        .subscribe();

    } else {
       isLoading.value = false;
    }
  } catch (e) {
    console.error("Gagal saat memuat dashboard:", e);
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (supabaseChannel.value) {
    supabase.removeChannel(supabaseChannel.value);
  }
});

</script>
