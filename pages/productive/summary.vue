<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-2">Ringkasan Produktivitas</h1>

    <!-- Navigasi Bulan -->
    <div class="flex items-center justify-center space-x-4 mb-8">
      <button @click="changeMonth(-1)" class="p-2 rounded-full bg-gray-200 hover:bg-gray-300" :disabled="isLoading"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg></button>
      <h2 class="text-2xl font-semibold text-gray-700 w-48 text-center">{{ monthYear }}</h2>
      <button @click="changeMonth(1)" class="p-2 rounded-full bg-gray-200 hover:bg-gray-300" :disabled="isLoading"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></button>
    </div>

    <div v-if="isLoading" class="text-center py-10">Memuat ringkasan untuk {{ monthYear }}...</div>
    <div v-else-if="!currentUserId" class="text-center py-10">Silakan login untuk melihat ringkasan.</div>
    
    <div v-else class="space-y-8">
        <!-- Ringkasan Proyek -->
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold text-gray-700 mb-4">Aktivitas Proyek Bulan Ini</h3>
            <div v-if="projects.length > 0" class="space-y-4">
                <div v-for="project in projects" :key="project.id" class="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                        <p class="font-bold">{{ project.name }}</p>
                        <p class="text-sm text-gray-600">Status: <span class="font-semibold" :class="statusClass(project.status)">{{ project.status }}</span></p>
                    </div>
                    <div class="text-right text-sm">
                        <p>Mulai: {{ formatDate(project.created_at) }}</p>
                        <p v-if="project.completed_at">Selesai: {{ formatDate(project.completed_at) }}</p>
                    </div>
                </div>
            </div>
            <div v-else class="text-center py-6 text-gray-500">Tidak ada aktivitas proyek di bulan ini.</div>
        </div>

        <!-- Ringkasan Lamaran Kerja -->
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold text-gray-700 mb-4">Aktivitas Lamaran Kerja Bulan Ini</h3>
            <div v-if="jobs.length > 0" class="space-y-4">
                 <div v-for="job in jobs" :key="job.id" class="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                        <p class="font-bold">{{ job.job_title }}</p>
                        <p class="text-sm text-gray-600">di <span class="font-semibold">{{ job.company_name }}</span></p>
                    </div>
                    <div class="text-right text-sm">
                         <p>Tanggal Lamar: {{ formatDate(job.application_date) }}</p>
                         <p>Status: <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="statusBadge(job.application_status)">{{ job.application_status }}</span></p>
                    </div>
                </div>
            </div>
            <div v-else class="text-center py-6 text-gray-500">Tidak ada lamaran kerja di bulan ini.</div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';

const supabase = useSupabaseClient();

// --- State ---
const projects = ref([]);
const jobs = ref([]);
const isLoading = ref(true);
const date = ref(new Date());
const currentUserId = ref(null);

const monthYear = computed(() => date.value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));

// --- Data Fetching ---
onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await fetchDataForMonth(date.value);
    } else { isLoading.value = false; }
  } catch (e) { console.error("Auth Error:", e); isLoading.value = false; }
});

watch(date, (newDate) => { if (currentUserId.value) fetchDataForMonth(newDate); });

async function fetchDataForMonth(targetDate) {
    if (!currentUserId.value) return;
    isLoading.value = true;

    const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split('T')[0];

    try {
        const [projectResponse, jobResponse] = await Promise.all([
            supabase.from('projects').select('*').eq('user_id', currentUserId.value)
              .gte('created_at', firstDay).lte('created_at', lastDay),
            
            supabase.from('job_applications').select('*').eq('user_id', currentUserId.value)
              .gte('application_date', firstDay).lte('application_date', lastDay)
        ]);

        if (projectResponse.error) throw projectResponse.error;
        if (jobResponse.error) throw jobResponse.error;

        projects.value = projectResponse.data || [];
        jobs.value = jobResponse.data || [];

    } catch (e) {
        console.error("Gagal mengambil data ringkasan:", e);
        projects.value = [];
        jobs.value = [];
    } finally {
        isLoading.value = false;
    }
}

// --- Helpers ---
function changeMonth(offset) {
  const newDate = new Date(date.value);
  newDate.setMonth(newDate.getMonth() + offset);
  date.value = newDate;
}

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : '-';

const statusClass = (status) => {
    return { 'text-blue-600': status === 'To Do', 'text-purple-600': status === 'In Progress', 'text-green-600': status === 'Done' };
};

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
