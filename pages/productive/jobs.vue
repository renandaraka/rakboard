<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Job Application Tracker</h1>
      <button @click="openFormForNew" class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
        + Tambah Lamaran
      </button>
    </div>

    <!-- Filter Panel -->
    <div class="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input v-model.lazy="filters.search" type="text" placeholder="Cari Perusahaan/Posisi..." class="p-3 border rounded-lg w-full">
        <select v-model="filters.jobType" class="p-3 border rounded-lg w-full bg-white">
          <option value="">Semua Tipe Pekerjaan</option>
          <option v-for="type in jobTypes" :key="type">{{ type }}</option>
        </select>
        <select v-model="filters.status" class="p-3 border rounded-lg w-full bg-white">
          <option value="">Semua Status</option>
          <option v-for="status in applicationStatuses" :key="status">{{ status }}</option>
        </select>
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="isFormVisible" class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50" @click.self="closeForm">
        <div class="bg-white rounded-lg shadow-xl p-8 m-4 max-w-3xl w-full h-screen overflow-y-auto">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ isEditing ? 'Edit Lamaran' : 'Lamaran Baru' }}</h2>
            <form @submit.prevent="handleSubmit">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- All fields -->
                    <div><label class="block text-sm font-medium">Nama Perusahaan</label><input v-model="activeApplication.company_name" type="text" class="mt-1 p-3 w-full border rounded-lg" required></div>
                    <div><label class="block text-sm font-medium">Posisi</label><input v-model="activeApplication.job_title" type="text" class="mt-1 p-3 w-full border rounded-lg" required></div>
                    <div><label class="block text-sm font-medium">Lokasi</label><input v-model="activeApplication.location" type="text" class="mt-1 p-3 w-full border rounded-lg"></div>
                    <div><label class="block text-sm font-medium">Tipe Pekerjaan</label><select v-model="activeApplication.job_type" class="mt-1 p-3 w-full border rounded-lg bg-white"><option v-for="t in jobTypes" :key="t">{{ t }}</option></select></div>
                    <div><label class="block text-sm font-medium">Tanggal Melamar</label><input v-model="activeApplication.application_date" type="date" class="mt-1 p-3 w-full border rounded-lg bg-white"></div>
                    <div><label class="block text-sm font-medium">Status</label><select v-model="activeApplication.application_status" class="mt-1 p-3 w-full border rounded-lg bg-white"><option v-for="s in applicationStatuses" :key="s">{{ s }}</option></select></div>
                    <div class="md:col-span-2"><label class="block text-sm font-medium">Sumber / Link</label><input v-model="activeApplication.source_link" type="url" class="mt-1 p-3 w-full border rounded-lg"></div>
                    <div><label class="block text-sm font-medium">Kontak Person</label><input v-model="activeApplication.contact_person" type="text" class="mt-1 p-3 w-full border rounded-lg"></div>
                    <div><label class="block text-sm font-medium">Gaji (Rp)</label><input v-model.number="activeApplication.salary" type="number" class="mt-1 p-3 w-full border rounded-lg"></div>
                    <div class="md:col-span-2"><label class="block text-sm font-medium">Catatan</label><textarea v-model="activeApplication.notes" rows="4" class="mt-1 p-3 w-full border rounded-lg"></textarea></div>
                </div>
                <div class="mt-8 flex justify-end space-x-4">
                    <button type="button" @click="closeForm" class="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg">Batal</button>
                    <button type="submit" :disabled="isSubmitting" class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg">{{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Application List -->
    <div v-if="isLoading" class="text-center p-8">Memuat data...</div>
    <div v-else class="bg-white rounded-lg shadow-md overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50"><tr><th v-for="header in tableHeaders" :key="header" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ header }}</th><th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th></tr></thead>
            <tbody v-if="filteredApplications.length > 0" class="bg-white divide-y divide-gray-200">
                <tr v-for="app in filteredApplications" :key="app.id">
                    <td class="px-6 py-4"><div class="font-bold">{{ app.company_name }}</div><div class="text-sm text-gray-600">{{ app.job_title }}</div></td>
                    <td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="statusBadge(app.application_status)">{{ app.application_status }}</span></td>
                    <td class="px-6 py-4">{{ app.job_type }}</td>
                    <td class="px-6 py-4">{{ formatDate(app.application_date) }}</td>
                    <td class="px-6 py-4"><a :href="app.source_link" target="_blank" class="text-indigo-600 hover:underline" v-if="app.source_link">Link</a><span v-else>-</span></td>
                    <td class="px-6 py-4 text-right"><button @click="openFormForEdit(app)" class="text-indigo-600 hover:text-indigo-900">Edit</button><button @click="deleteApplication(app.id)" class="text-red-600 hover:text-red-900 ml-4">Hapus</button></td>
                </tr>
            </tbody>
            <tbody v-else><tr class="text-center"><td :colspan="tableHeaders.length + 1" class="py-10 text-gray-500">Tidak ada data yang cocok dengan filter.</td></tr></tbody>
        </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const supabase = useSupabaseClient();

// --- State & Constants ---
const applications = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const currentUserId = ref(null);
const isFormVisible = ref(false);
const isEditing = ref(false);

const jobTypes = ['Full Time', 'Part Time', 'Contract', 'Remote', 'Freelance', 'Internship'];
const applicationStatuses = ['Not Started', 'Applied', 'For Interview', 'Offer', 'Rejected'];
const tableHeaders = ['Perusahaan & Posisi', 'Status', 'Tipe', 'Tanggal', 'Sumber'];

const getDefaultApplication = () => ({ id: null, company_name: '', job_title: '', location: '', job_type: 'Full Time', application_date: new Date().toISOString().split('T')[0], application_status: 'Not Started', source_link: '', contact_person: '', salary: null, notes: '' });
const activeApplication = ref(getDefaultApplication());

const filters = ref({ search: '', jobType: '', status: '' });

// --- Computed Properties ---
const filteredApplications = computed(() => {
    return applications.value.filter(app => {
        const searchLower = filters.value.search.toLowerCase();
        return (!filters.value.jobType || app.job_type === filters.value.jobType) &&
               (!filters.value.status || app.application_status === filters.value.status) &&
               (!filters.value.search || app.company_name.toLowerCase().includes(searchLower) || app.job_title.toLowerCase().includes(searchLower));
    });
});

// --- Lifecycle & Data Fetching ---
onMounted(async () => {
  isLoading.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await fetchApplications();
    } else { isLoading.value = false; }
  } catch (e) { console.error("Auth Error:", e); isLoading.value = false; }
});

async function fetchApplications() {
  if (!currentUserId.value) return;
  try {
    const { data, error } = await supabase.from('job_applications').select('*').eq('user_id', currentUserId.value).order('application_date', { ascending: false });
    if (error) throw error;
    applications.value = data || [];
  } catch (e) {
    console.error("Fetch Error:", e);
  } finally {
    isLoading.value = false;
  }
}

// --- CRUD & Form Handlers ---
function openFormForNew() {
  isEditing.value = false;
  activeApplication.value = getDefaultApplication();
  isFormVisible.value = true;
}

function openFormForEdit(app) {
  isEditing.value = true;
  activeApplication.value = JSON.parse(JSON.stringify(app));
  isFormVisible.value = true;
}

function closeForm() { isFormVisible.value = false; }

async function handleSubmit() {
  isSubmitting.value = true;
  const dataToSubmit = { ...activeApplication.value, user_id: currentUserId.value };
  
  try {
    let error;
    if (isEditing.value) {
      ({ error } = await supabase.from('job_applications').update(dataToSubmit).eq('id', activeApplication.value.id));
    } else {
      delete dataToSubmit.id;
      ({ error } = await supabase.from('job_applications').insert([dataToSubmit]));
    }
    if (error) throw error;
    closeForm();
    await fetchApplications();
  } catch (e) {
    alert(`Gagal menyimpan: ${e.message}`);
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteApplication(id) {
  if (!confirm('Yakin ingin menghapus lamaran ini?')) return;
  try {
    await supabase.from('job_applications').delete().eq('id', id);
    await fetchApplications();
  } catch (e) {
    alert(`Gagal menghapus: ${e.message}`);
  }
}

// --- UI Helpers ---
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : '-';

const statusBadge = (status) => {
    const classes = {
        'Applied': 'bg-blue-100 text-blue-800',
        'Not Started': 'bg-gray-100 text-gray-800',
        'Offer': 'bg-green-100 text-green-800',
        'Rejected': 'bg-red-100 text-red-800',
        'For Interview': 'bg-yellow-100 text-yellow-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
};
</script>
