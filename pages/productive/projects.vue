<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Project Tracker</h1>
      <button @click="openFormForNew" class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
        + Tambah Proyek Baru
      </button>
    </div>

    <!-- Form Tambah/Edit Proyek (Modal) -->
    <div v-if="isFormVisible" class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50" @click.self="closeForm">
      <div class="bg-white rounded-lg shadow-xl p-8 m-4 max-w-lg w-full">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ isEditing ? 'Edit Proyek' : 'Proyek Baru' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <div>
              <label for="projectName" class="block text-sm font-medium text-gray-700">Nama Proyek</label>
              <input v-model="activeProject.name" id="projectName" type="text" class="mt-1 p-3 w-full border rounded-lg" required>
            </div>
            <div>
              <label for="projectCategory" class="block text-sm font-medium text-gray-700">Kategori</label>
              <input v-model="activeProject.category" id="projectCategory" type="text" placeholder="e.g., Web Development, Content Creation" class="mt-1 p-3 w-full border rounded-lg">
            </div>
            <div>
              <label for="projectPriority" class="block text-sm font-medium text-gray-700">Prioritas</label>
              <select v-model="activeProject.priority" id="projectPriority" class="mt-1 p-3 w-full border rounded-lg bg-white" required>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>
          <div class="mt-8 flex justify-end space-x-4">
            <button type="button" @click="closeForm" class="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300">Batal</button>
            <button type="submit" :disabled="isSubmitting" class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Daftar Proyek -->
    <div v-if="isLoading" class="text-center p-8 text-gray-500">Memuat proyek...</div>
    <div v-else-if="!projects || projects.length === 0" class="text-center p-8 text-gray-500 bg-white rounded-lg shadow-md">
      Belum ada proyek. Mulai tambahkan proyek pertama Anda!
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="project in projects" :key="project.id" class="bg-white rounded-lg shadow-md flex flex-col hover:shadow-xl transition-shadow">
        <div class="p-6">
            <div class="flex justify-between items-start">
                <h3 class="text-xl font-bold text-gray-800 mb-2">{{ project.name }}</h3>
                <button @click="deleteProject(project.id)" class="text-gray-400 hover:text-red-600">&times;</button>
            </div>
          <p class="text-sm text-gray-500 mb-4">{{ project.category || 'Tanpa Kategori' }}</p>
          <div class="flex justify-between items-center mb-4">
            <span class="px-3 py-1 text-xs font-semibold rounded-full" :class="priorityClass(project.priority)">{{ project.priority }}</span>
            <span class="text-sm text-gray-500">Mulai: {{ formatDate(project.created_at) }}</span>
          </div>
        </div>
        <div class="border-t p-4 mt-auto bg-gray-50">
          <label class="text-sm font-medium text-gray-600">Status:</label>
          <select v-model="project.status" @change="updateStatus(project, $event.target.value)" class="mt-1 p-2 w-full border rounded-lg bg-white text-sm font-semibold" :class="statusClass(project.status)">
            <option>To Do</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
          <p v-if="project.completed_at" class="text-xs text-center text-green-600 mt-2">Selesai: {{ formatDate(project.completed_at) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const supabase = useSupabaseClient();

// --- State Management ---
const projects = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const currentUserId = ref(null);
const isFormVisible = ref(false);
const isEditing = ref(false);

const getDefaultProject = () => ({ id: null, name: '', category: '', priority: 'Medium', status: 'To Do' });
const activeProject = ref(getDefaultProject());

// --- Lifecycle & Data Fetching ---
onMounted(async () => {
  isLoading.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await fetchProjects();
    } else {
        isLoading.value = false;
    }
  } catch (e) { console.error("Gagal mendapatkan user:", e); isLoading.value = false; }
});

async function fetchProjects() {
  if (!currentUserId.value) return;
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', currentUserId.value)
      .order('created_at', { ascending: false });
    if (error) throw error;
    projects.value = data || [];
  } catch (e) {
    console.error("Error fetching projects:", e);
  } finally {
    isLoading.value = false;
  }
}

// --- CRUD & Form Handlers ---
function openFormForNew() {
  isEditing.value = false;
  activeProject.value = getDefaultProject();
  isFormVisible.value = true;
}

// Note: Editing functionality can be added later if needed by creating an openFormForEdit(project) function.

function closeForm() {
  isFormVisible.value = false;
}

async function handleSubmit() {
  isSubmitting.value = true;
  const dataToSubmit = { ...activeProject.value, user_id: currentUserId.value };

  try {
    let error;
    if (isEditing.value) {
      // Update logic would go here
    } else {
      delete dataToSubmit.id;
      ({ error } = await supabase.from('projects').insert([dataToSubmit]));
    }
    if (error) throw error;
    closeForm();
    await fetchProjects();
  } catch (e) {
    alert(`Gagal menyimpan proyek: ${e.message}`);
  } finally {
    isSubmitting.value = false;
  }
}

async function updateStatus(project, newStatus) {
    const updateData = { status: newStatus };
    // OTOMATISASI: Jika status diubah menjadi 'Done', catat waktu selesai.
    if (newStatus === 'Done' && !project.completed_at) {
        updateData.completed_at = new Date().toISOString();
    } else if (newStatus !== 'Done') {
        updateData.completed_at = null; // Reset jika status diubah kembali dari Done
    }

    try {
        const { error } = await supabase.from('projects').update(updateData).eq('id', project.id);
        if (error) throw error;
        await fetchProjects(); // Refresh data untuk menampilkan tanggal selesai
    } catch (e) {
        alert(`Gagal update status: ${e.message}`);
    }
}

async function deleteProject(id) {
  if (!confirm('Yakin ingin menghapus proyek ini?')) return;
  try {
    await supabase.from('projects').delete().eq('id', id);
    await fetchProjects();
  } catch (e) {
    alert(`Gagal menghapus proyek: ${e.message}`);
  }
}

// --- UI Helpers ---
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });

const priorityClass = (priority) => {
  return { 'bg-red-100 text-red-800': priority === 'High', 'bg-yellow-100 text-yellow-800': priority === 'Medium', 'bg-green-100 text-green-800': priority === 'Low' };
};

const statusClass = (status) => {
    return { 'text-white bg-blue-500': status === 'To Do', 'text-white bg-purple-500': status === 'In Progress', 'text-white bg-green-500': status === 'Done' };
}

</script>
