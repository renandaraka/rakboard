<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Learning Timer</h1>

    <!-- 1. Timer dan Kontrol -->
    <div class="bg-white rounded-lg shadow-md p-8 mb-8 text-center">
      <h2 class="text-6xl font-mono text-gray-800 mb-4">{{ formattedTime }}</h2>
      <div class="flex justify-center space-x-4">
        <button 
          @click="startTimer" 
          :disabled="timerIsRunning"
          class="bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Start
        </button>
        <button 
          @click="stopTimer" 
          :disabled="!timerIsRunning"
          class="bg-red-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Stop
        </button>
        <button 
          @click="resetTimer" 
          class="bg-gray-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- 2. Form untuk Menyimpan Sesi -->
    <div v-if="elapsedSeconds > 0 && !timerIsRunning" class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Simpan Sesi Belajar</h2>
      <form @submit.prevent="saveSession">
        <p class="mb-3">Durasi: <span class="font-bold">{{ studyMinutes }} menit</span></p>
        <div class="flex flex-col space-y-4">
          <input
            v-model="newSessionTopic"
            type="text"
            placeholder="Topik apa yang Anda pelajari?"
            class="p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <button
            type="submit"
            :disabled="isSubmitting"
            class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
          >
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Sesi' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 3. Daftar Riwayat Sesi Belajar -->
    <div class="bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-700 p-6 border-b">Riwayat Sesi Belajar</h2>
      <div v-if="isLoading" class="text-center p-8 text-gray-500">Memuat data...</div>
      <div v-else-if="!sessions || sessions.length === 0" class="text-center p-8 text-gray-500">Belum ada sesi belajar yang tercatat.</div>
      <ul v-else class="divide-y">
        <li v-for="session in sessions" :key="session.id" class="p-6 flex items-center justify-between">
          <div>
            <p class="font-semibold text-lg text-gray-800">{{ session.subject }}</p>
            <p class="text-gray-600 text-sm">{{ session.minutes }} menit pada {{ new Date(session.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
          </div>
          <button @click="deleteSession(session.id)" class="text-red-500 hover:text-red-700 font-semibold">Hapus</button>
        </li>
      </ul>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const supabase = useSupabaseClient();

// State
const sessions = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const currentUserId = ref(null);
const newSessionTopic = ref('');

// Timer State
const timerIsRunning = ref(false);
const elapsedSeconds = ref(0);
const timerInterval = ref(null);

// Mengambil user & data saat komponen siap di browser
onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await fetchSessions();
    } else {
      isLoading.value = false;
    }
  } catch(e) {
    console.error("Gagal mendapatkan user di onMounted", e);
    isLoading.value = false;
  }
});

async function fetchSessions() {
  if (!currentUserId.value) return;
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', currentUserId.value)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    sessions.value = data || [];
  } catch (e) {
    console.error("Error fetching sessions:", e);
  } finally {
    isLoading.value = false;
  }
}

// --- Logika Timer ---
const formattedTime = computed(() => {
  const hours = Math.floor(elapsedSeconds.value / 3600);
  const minutes = Math.floor((elapsedSeconds.value % 3600) / 60);
  const seconds = elapsedSeconds.value % 60;
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
});

const studyMinutes = computed(() => Math.max(1, Math.round(elapsedSeconds.value / 60)));

function startTimer() {
  if (timerIsRunning.value) return;
  timerIsRunning.value = true;
  timerInterval.value = setInterval(() => {
    elapsedSeconds.value++;
  }, 1000);
}

function stopTimer() {
  timerIsRunning.value = false;
  clearInterval(timerInterval.value);
}

function resetTimer() {
  stopTimer();
  elapsedSeconds.value = 0;
  newSessionTopic.value = '';
}

// --- CRUD Functions ---
async function saveSession() {
  if (!currentUserId.value || !newSessionTopic.value.trim()) return;
  isSubmitting.value = true;
  try {
    const sessionToSave = {
      user_id: currentUserId.value,
      subject: newSessionTopic.value,
      minutes: studyMinutes.value,
      date: new Date().toISOString().split('T')[0]
    };
    const { error } = await supabase.from('learning_sessions').insert(sessionToSave);
    if (error) throw error;
    
    await fetchSessions(); // Refresh list
    resetTimer(); // Reset timer dan form

  } catch(e) {
    console.error("Error saving session:", e);
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteSession(id) {
  if (!currentUserId.value || !confirm('Yakin ingin menghapus sesi ini?')) return;
  try {
    await supabase.from('learning_sessions').delete().eq('id', id);
    await fetchSessions(); // Refresh list
  } catch(e) {
    console.error("Error deleting session:", e);
  }
}

</script>
