<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Rekonsiliasi Akun</h1>

    <!-- 1. Form untuk Menambah Akun Baru dengan Saldo Awal -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Tambah Akun Baru</h2>
      <form @submit.prevent="addAccount" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div class="col-span-1 md:col-span-2">
          <label for="accountName" class="block text-sm font-medium text-gray-700">Nama Akun</label>
          <input
            v-model="newAccountName"
            id="accountName"
            type="text"
            placeholder="e.g., Bank BCA, Dompet Digital"
            class="mt-1 p-3 border rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label for="initialBalance" class="block text-sm font-medium text-gray-700">Saldo Awal (Rp)</label>
          <input
            v-model.number="newInitialBalance"
            id="initialBalance"
            type="number"
            step="1000"
            placeholder="500000"
            class="mt-1 p-3 border rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div class="col-span-1 md:col-span-3 text-right">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
          >
            {{ isSubmitting ? 'Menyimpan...' : 'Tambah Akun' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 2. Dasbor Daftar Akun -->
    <div v-if="isLoading" class="text-center p-8 text-gray-500">Menghitung saldo akun...</div>
    <div v-else-if="!accountsWithDetails || accountsWithDetails.length === 0" class="text-center p-8 text-gray-500 bg-white rounded-lg shadow-md">
      Belum ada akun. Silakan tambahkan akun pertama Anda di atas untuk memulai.
    </div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- Kartu Akun -->
      <div v-for="account in accountsWithDetails" :key="account.id" class="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between hover:shadow-xl transition-shadow">
        <div>
          <!-- Header Kartu -->
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-2xl font-bold text-gray-800">{{ account.name }}</h3>
            <button @click="deleteAccount(account.id)" class="text-gray-400 hover:text-red-600 transition-colors font-bold text-xl">&times;</button>
          </div>
          <!-- Body Kartu: Rincian Saldo -->
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Saldo Awal</span>
              <span class="font-mono">{{ formatCurrency(account.initial_balance) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-green-500 font-medium">Total Pemasukan</span>
              <span class="font-mono text-green-600">+ {{ formatCurrency(account.income) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-red-500 font-medium">Total Pengeluaran</span>
              <span class="font-mono text-red-600">- {{ formatCurrency(account.expense) }}</span>
            </div>
          </div>
        </div>
        <!-- Footer Kartu: Saldo Akhir -->
        <div class="border-t pt-4 mt-auto">
          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold text-gray-600">Saldo Akhir</span>
            <span class="text-xl font-bold text-indigo-600 font-mono">{{ formatCurrency(account.final_balance) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const supabase = useSupabaseClient();

// State
const accountsWithDetails = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const currentUserId = ref(null);
const newAccountName = ref('');
const newInitialBalance = ref(0);

// Helper
const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await fetchData();
    }
  } catch (e) {
    console.error("Gagal mendapatkan user:", e);
  } finally {
    isLoading.value = false;
  }
});

async function fetchData() {
  if (!currentUserId.value) return;
  isLoading.value = true;
  try {
    const [accountsResponse, transactionsResponse] = await Promise.all([
      supabase.from('finance_accounts').select('*').eq('user_id', currentUserId.value),
      supabase.from('finance_transactions').select('amount, type, account_id').eq('user_id', currentUserId.value).not('account_id', 'is', null)
    ]);

    if (accountsResponse.error) throw accountsResponse.error;
    if (transactionsResponse.error) throw transactionsResponse.error;

    const transactionAggregates = new Map();
    (transactionsResponse.data || []).forEach(t => {
      if (!transactionAggregates.has(t.account_id)) {
        transactionAggregates.set(t.account_id, { income: 0, expense: 0 });
      }
      const current = transactionAggregates.get(t.account_id);
      if (t.type === 'income') current.income += t.amount;
      else current.expense += t.amount;
    });

    accountsWithDetails.value = (accountsResponse.data || []).map(account => {
      const aggregates = transactionAggregates.get(account.id) || { income: 0, expense: 0 };
      const final_balance = (account.initial_balance || 0) + aggregates.income - aggregates.expense;
      return { ...account, ...aggregates, final_balance };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  } catch (e) {
    console.error("Error fetching account data:", e);
    accountsWithDetails.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function addAccount() {
  if (!currentUserId.value || !newAccountName.value.trim()) return;
  isSubmitting.value = true;
  try {
    const { error } = await supabase.from('finance_accounts').insert({
      user_id: currentUserId.value,
      name: newAccountName.value,
      initial_balance: newInitialBalance.value,
    });
    if (error) throw error;
    newAccountName.value = '';
    newInitialBalance.value = 0;
    await fetchData();
  } catch (e) {
    alert(`Gagal menambahkan akun: ${e.message}`);
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteAccount(id) {
  if (!confirm('Yakin ingin menghapus akun ini? Transaksi terkait tidak akan dihapus.')) return;
  try {
    // Set account_id to NULL on related transactions first
    await supabase.from('finance_transactions').update({ account_id: null }).eq('account_id', id);
    // Then delete the account
    await supabase.from('finance_accounts').delete().eq('id', id);
    await fetchData();
  } catch (e) {
    alert(`Gagal menghapus akun: ${e.message}`);
  }
}
</script>
