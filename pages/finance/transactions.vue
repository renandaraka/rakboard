<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Daftar Transaksi</h1>

    <!-- Tombol Aksi Utama -->
    <div class="flex justify-between items-center mb-6">
      <button @click="isFilterVisible = !isFilterVisible" class="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 019 17v-5.586L4.293 6.707A1 1 0 014 6V3z" clip-rule="evenodd" /></svg>
        <span>{{ isFilterVisible ? 'Tutup Filter' : 'Buka Filter & Urutkan' }}</span>
      </button>
      <button @click="openFormForNew" class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
        + Tambah Transaksi
      </button>
    </div>

    <!-- Panel Filter (Collapsible) -->
    <div v-if="isFilterVisible" class="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <select v-model="filters.type" class="p-3 border rounded-lg w-full bg-white"><option value="">Semua Tipe</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select>
        <select v-model="filters.accountId" class="p-3 border rounded-lg w-full bg-white"><option value="">Semua Akun</option><option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option></select>
        <select v-model="filters.categoryId" class="p-3 border rounded-lg w-full bg-white"><option value="">Semua Kategori</option><option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option></select>
        <input v-model.lazy="filters.search" type="text" placeholder="Cari deskripsi..." class="p-3 border rounded-lg w-full">
        <div><label class="text-sm">Dari Tanggal</label><input v-model="filters.startDate" type="date" class="mt-1 p-3 border rounded-lg w-full bg-white"></div>
        <div><label class="text-sm">Sampai Tanggal</label><input v-model="filters.endDate" type="date" class="mt-1 p-3 border rounded-lg w-full bg-white"></div>
        <select v-model="sortBy" class="p-3 border rounded-lg w-full bg-white">
          <option value="date_desc">Tanggal Terbaru</option>
          <option value="date_asc">Tanggal Terlama</option>
          <option value="amount_desc">Nominal Terbesar</option>
          <option value="amount_asc">Nominal Terkecil</option>
        </select>
        <button @click="resetFilters" class="bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-400">Reset Filter</button>
      </div>
    </div>

    <!-- Form Tambah/Edit (Modal) -->
    <div v-if="isFormVisible" class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50" @click.self="closeForm">
        <div class="bg-white rounded-lg shadow-xl p-8 m-4 max-w-2xl w-full">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ isEditing ? 'Edit Transaksi' : 'Tambah Transaksi Baru' }}</h2>
            <form @submit.prevent="handleSubmit">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-2">Tipe Transaksi</label><div class="flex space-x-4"><button type="button" @click="activeTransaction.type = 'expense'" :class="{'bg-red-500 text-white': activeTransaction.type === 'expense', 'bg-gray-200': activeTransaction.type !== 'expense'}" class="w-full p-3 rounded-lg font-semibold">Pengeluaran</button><button type="button" @click="activeTransaction.type = 'income'" :class="{'bg-green-500 text-white': activeTransaction.type === 'income', 'bg-gray-200': activeTransaction.type !== 'income'}" class="w-full p-3 rounded-lg font-semibold">Pemasukan</button></div></div>
                    <div class="md:col-span-2"><label for="description" class="block text-sm font-medium text-gray-700">Deskripsi</label><input v-model="activeTransaction.description" id="description" type="text" class="mt-1 p-3 w-full border rounded-lg" required></div>
                    <div><label for="amount" class="block text-sm font-medium text-gray-700">Jumlah (Rp)</label><input v-model.number="activeTransaction.amount" id="amount" type="number" min="0" step="100" class="mt-1 p-3 w-full border rounded-lg" required></div>
                    <div><label for="transaction_date" class="block text-sm font-medium text-gray-700">Tanggal</label><input v-model="activeTransaction.transaction_date" id="transaction_date" type="date" class="mt-1 p-3 w-full border rounded-lg bg-white" required></div>
                    <div><label for="account_id" class="block text-sm font-medium text-gray-700">Akun</label><select v-model="activeTransaction.account_id" id="account_id" class="mt-1 p-3 w-full border rounded-lg bg-white" required><option disabled value="">Pilih Akun</option><option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option></select></div>
                    <div><label for="category_id" class="block text-sm font-medium text-gray-700">Kategori</label><select v-model="activeTransaction.category_id" id="category_id" class="mt-1 p-3 w-full border rounded-lg bg-white" required><option disabled value="">Pilih Kategori</option><option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option></select></div>
                </div>
                <div class="mt-8 flex justify-end space-x-4">
                    <button type="button" @click="closeForm" class="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300">Batal</button>
                    <button type="submit" :disabled="isSubmitting" class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">{{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Daftar Transaksi -->
    <div class="bg-white rounded-lg shadow-md">
      <div class="p-6 border-b flex justify-between items-center"><h2 class="text-xl font-semibold text-gray-700">Riwayat Transaksi</h2><div class="text-sm text-gray-500">Menampilkan {{ filteredTransactions.length }} dari {{ transactions.length }} transaksi</div></div>
      <div v-if="isLoading" class="text-center p-8 text-gray-500">Memuat transaksi...</div>
      <div v-else-if="!transactions || transactions.length === 0" class="text-center p-8 text-gray-500">Belum ada transaksi sama sekali.</div>
      <div v-else-if="filteredTransactions.length === 0" class="text-center p-8 text-gray-500">Tidak ada transaksi yang cocok dengan filter Anda.</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th><th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th><th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th></tr></thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="trx in filteredTransactions" :key="trx.id">
              <td class="px-6 py-4 whitespace-nowrap"><div class="font-medium text-gray-900">{{ trx.description }}</div><div class="text-sm text-gray-500">{{ new Date(trx.transaction_date).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) }} | {{ trx.finance_categories?.name || '-' }} | {{ trx.finance_accounts?.name || '-' }}</div></td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" :class="{ 'text-red-600': trx.type === 'expense', 'text-green-600': trx.type === 'income' }">{{ trx.type === 'expense' ? '-' : '+' }} {{ formatCurrency(trx.amount) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button @click="openFormForEdit(trx)" class="text-indigo-600 hover:text-indigo-900">Edit</button><span class="mx-2">|</span><button @click="deleteTransaction(trx.id)" class="text-red-600 hover:text-red-900">Hapus</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';

const supabase = useSupabaseClient();

const transactions = ref([]);
const accounts = ref([]);
const categories = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const currentUserId = ref(null);
const isFormVisible = ref(false);
const isFilterVisible = ref(false);
const isEditing = ref(false);

const getDefaultTransaction = () => ({ id: null, type: 'expense', description: '', amount: null, transaction_date: new Date().toISOString().split('T')[0], account_id: '', category_id: '' });
const activeTransaction = ref(getDefaultTransaction());

const getDefaultFilters = () => ({ type: '', accountId: '', categoryId: '', startDate: '', endDate: '', search: '' });
const filters = ref(getDefaultFilters());
const sortBy = ref('date_desc');

const availableCategories = computed(() => categories.value.filter(c => c.type === activeTransaction.value.type || c.type === null));
const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);

const filteredTransactions = computed(() => {
  let data = [...transactions.value];
  data = data.filter(t => {
    const filterType = !filters.value.type || t.type === filters.value.type;
    const filterAccount = !filters.value.accountId || t.account_id === filters.value.accountId;
    const filterCategory = !filters.value.categoryId || t.category_id === filters.value.categoryId;
    const filterSearch = !filters.value.search || t.description.toLowerCase().includes(filters.value.search.toLowerCase());
    const filterStartDate = !filters.value.startDate || new Date(t.transaction_date) >= new Date(filters.value.startDate);
    const filterEndDate = !filters.value.endDate || new Date(t.transaction_date) <= new Date(filters.value.endDate);
    return filterType && filterAccount && filterCategory && filterSearch && filterStartDate && filterEndDate;
  });

  data.sort((a, b) => {
    switch (sortBy.value) {
      case 'date_asc': return new Date(a.transaction_date) - new Date(b.transaction_date);
      case 'amount_desc': return b.amount - a.amount;
      case 'amount_asc': return a.amount - b.amount;
      default: return new Date(b.transaction_date) - new Date(a.transaction_date);
    }
  });
  return data;
});

watch(() => activeTransaction.value.type, (newType) => {
  const currentCategory = categories.value.find(c => c.id === activeTransaction.value.category_id);
  if (currentCategory && currentCategory.type !== newType) {
    activeTransaction.value.category_id = '';
  }
});

onMounted(async () => {
  isLoading.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await Promise.all([fetchTransactions(), fetchAccounts(), fetchCategories()]);
    }
  } finally {
    isLoading.value = false;
  }
});

async function fetchTransactions() {
  if (!currentUserId.value) return;
  try {
    const { data, error } = await supabase.from('finance_transactions').select(`*, finance_accounts(id, name), finance_categories(id, name)`).eq('user_id', currentUserId.value);
    if (error) throw error;
    transactions.value = data || [];
  } catch (e) { console.error("Error fetching transactions:", e); }
}

async function fetchAccounts() {
  if (!currentUserId.value) return;
  try {
    const { data, error } = await supabase.from('finance_accounts').select('id, name').eq('user_id', currentUserId.value);
    if (error) throw error;
    accounts.value = data || [];
  } catch (e) { console.error("Error fetching accounts:", e); }
}

async function fetchCategories() {
  if (!currentUserId.value) return;
  try {
    const { data, error } = await supabase.from('finance_categories').select('id, name, type').eq('user_id', currentUserId.value);
    if (error) throw error;
    categories.value = data || [];
  } catch (e) { console.error("Error fetching categories:", e); }
}

function resetFilters() { filters.value = getDefaultFilters(); sortBy.value = 'date_desc'; }

function openFormForNew() {
  isEditing.value = false;
  activeTransaction.value = getDefaultTransaction();
  isFormVisible.value = true;
}

function openFormForEdit(trx) {
  isEditing.value = true;
  // Create a deep copy for editing to avoid reactivity issues
  activeTransaction.value = JSON.parse(JSON.stringify(trx));
  isFormVisible.value = true;
}

function closeForm() {
  isFormVisible.value = false;
  isEditing.value = false;
  activeTransaction.value = getDefaultTransaction();
}

async function handleSubmit() {
  isSubmitting.value = true;
  const dataToSubmit = { ...activeTransaction.value, user_id: currentUserId.value };
  delete dataToSubmit.finance_accounts;
  delete dataToSubmit.finance_categories;
  
  try {
    let error;
    if (isEditing.value) {
      ({ error } = await supabase.from('finance_transactions').update(dataToSubmit).eq('id', activeTransaction.value.id));
    } else {
      delete dataToSubmit.id;
      ({ error } = await supabase.from('finance_transactions').insert([dataToSubmit]));
    }
    if (error) throw error;
    closeForm();
    await fetchTransactions();
  } catch (e) {
    alert(`Gagal menyimpan: ${e.message}`);
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteTransaction(id) {
  if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
  try {
    const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
    if (error) throw error;
    await fetchTransactions();
  } catch (e) { console.error("Error deleting transaction:", e); }
}

</script>
