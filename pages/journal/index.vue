<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Journal</h1>

    <!-- Editor dan Preview -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Kolom Editor -->
        <div>
          <h2 class="text-xl font-semibold text-gray-700 mb-4">Editor (Hari ini)</h2>
          <form @submit.prevent="saveJournal" class="flex flex-col space-y-4">
            <input
              v-model="journalTitle"
              type="text"
              placeholder="Judul Entri"
              class="p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
              required
            />
            <textarea
              v-model="journalContent"
              placeholder="Tuliskan pemikiranmu di sini... Mendukung Markdown."
              rows="15"
              class="p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            ></textarea>
            <button
              type="submit"
              :disabled="isSaving || isLoading"
              class="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              <span v-if="isSaving">Menyimpan...</span>
              <span v-else-if="isLoading">Memuat...</span>
              <span v-else>Simpan Jurnal Hari Ini</span>
            </button>
          </form>
        </div>

        <!-- Kolom Preview -->
        <div class="prose lg:prose-lg max-w-none p-4 bg-gray-50 rounded-lg border">
           <h2 class="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Pratinjau</h2>
           <h3 v-if="journalTitle" class="font-bold text-2xl">{{ journalTitle }}</h3>
           <div v-html="renderedMarkdown"></div>
        </div>

      </div>
    </div>

    <!-- Daftar Riwayat Jurnal -->
    <div class="bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-700 p-6 border-b">Riwayat Jurnal</h2>
      <div v-if="isLoading" class="text-center p-8 text-gray-500">Memuat riwayat...</div>
      <div v-else-if="!pastJournals || pastJournals.length === 0" class="text-center p-8 text-gray-500">Belum ada riwayat jurnal.</div>
      <ul v-else class="divide-y">
        <li v-for="entry in pastJournals" :key="entry.id" class="p-6 flex items-center justify-between hover:bg-gray-50 cursor-pointer" @click="loadJournal(entry.id)">
          <div>
            <p class="font-semibold text-lg text-gray-800">{{ entry.title }}</p>
            <p class="text-gray-600 text-sm">{{ new Date(entry.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
          </div>
           <button @click.stop="deleteJournal(entry.id)" class="text-red-500 hover:text-red-700 font-semibold ml-4">Hapus</button>
        </li>
      </ul>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { marked } from 'marked';

const supabase = useSupabaseClient();

// State
const currentUserId = ref(null);
const isLoading = ref(true);
const isSaving = ref(false);

// State untuk entri saat ini
const todaysJournalId = ref(null); // ID untuk entri HARI INI
const journalTitle = ref('');
const journalContent = ref('');

// State untuk riwayat
const pastJournals = ref([]);

// Computed property untuk merender markdown secara real-time
const renderedMarkdown = computed(() => marked(journalContent.value || '...'));

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId.value = user.id;
      await loadTodaysJournal();
      await loadPastJournals();
    } 
  } catch (e) {
    console.error("Gagal mendapatkan user di onMounted", e);
  } finally {
    isLoading.value = false;
  }
});

// Fungsi untuk memuat entri hari ini
async function loadTodaysJournal() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('user_id', currentUserId.value)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`)
    .single(); // Ambil satu entri untuk hari ini
  
  if (data) {
    todaysJournalId.value = data.id;
    journalTitle.value = data.title;
    journalContent.value = data.content;
  }
}

// Fungsi untuk memuat entri-entri lama
async function loadPastJournals() {
  const { data, error } = await supabase
    .from('journals')
    .select('id, title, created_at')
    .eq('user_id', currentUserId.value)
    .order('created_at', { ascending: false });
  if(error) console.error("Error fetching past journals", error);
  else pastJournals.value = data;
}

// Fungsi untuk memuat konten jurnal lama ke editor
async function loadJournal(id) {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('id', id)
      .single();
    if(error) throw error;

    // Cek apakah jurnal yang dimuat adalah untuk hari ini
    const today = new Date().toISOString().split('T')[0];
    const entryDate = new Date(data.created_at).toISOString().split('T')[0];

    if (today === entryDate) {
        todaysJournalId.value = data.id;
    } else {
        // Jika ini entri lama, kita set ID hari ini ke null agar bisa membuat entri baru jika perlu
        todaysJournalId.value = null;
    }
    
    journalTitle.value = data.title;
    journalContent.value = data.content;
    window.scrollTo(0,0); // Scroll ke atas

  } catch (e) {
    console.error("Error loading journal entry:", e);
  } finally {
    isLoading.value = false;
  }
}

// Fungsi untuk menyimpan (membuat baru atau update)
async function saveJournal() {
  if (!currentUserId.value || !journalTitle.value.trim()) return;
  isSaving.value = true;
  
  const journalData = {
    user_id: currentUserId.value,
    title: journalTitle.value,
    content: journalContent.value,
  };

  try {
    if (todaysJournalId.value) {
      // Update entri yang sudah ada untuk hari ini
      const { error } = await supabase.from('journals').update(journalData).eq('id', todaysJournalId.value);
      if (error) throw error;
    } else {
      // Buat entri baru untuk hari ini
      const { data, error } = await supabase.from('journals').insert(journalData).select().single();
      if (error) throw error;
      todaysJournalId.value = data.id; // Simpan ID baru
    }
    await loadPastJournals(); // Refresh riwayat
  } catch (e) {
    console.error("Error saving journal:", e);
  } finally {
    isSaving.value = false;
  }
}

// Fungsi untuk menghapus jurnal
async function deleteJournal(id) {
  if (!confirm('Anda yakin ingin menghapus entri jurnal ini secara permanen?')) return;
  try {
    await supabase.from('journals').delete().eq('id', id);

    // Jika yang dihapus adalah entri hari ini, bersihkan editor
    if (id === todaysJournalId.value) {
      todaysJournalId.value = null;
      journalTitle.value = '';
      journalContent.value = '';
    }
    await loadPastJournals(); // Refresh riwayat
  } catch(e) {
    console.error("Error deleting journal:", e);
  }
}

</script>

<style>
/* Tambahan style untuk Pratinjau Markdown */
.prose :where(h2,h3,p,ul,ol,blockquote):where([class~="lead"]):not(:where([class~="not-prose"] *)) {
  margin-bottom: 1em;
}
.prose :where(img):not(:where([class~="not-prose"] *)) {
    margin-top: 0;
    margin-bottom: 0;
}
</style>