<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h3 class="text-xl font-semibold text-gray-700 mb-4">{{ title }}</h3>
    <div v-show="hasData" style="height: 300px;"> 
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
    <div v-if="!hasData" class="text-center py-10 text-gray-500">
      Data tidak cukup untuk menampilkan grafik.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps({
  title: {
    type: String,
    default: 'Ringkasan Grafik'
  },
  chartData: {
    type: Object,
    required: true,
    default: () => ({ labels: [], datasets: [{ data: [] }] })
  }
});

// Gunakan computed property untuk mengecek data, ini lebih aman
const hasData = computed(() => {
  return props.chartData && props.chartData.datasets[0] && props.chartData.datasets[0].data.length > 0;
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

</script>
