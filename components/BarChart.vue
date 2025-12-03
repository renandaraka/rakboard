<template>
  <Bar
    v-if="chartData && chartData.datasets[0].data.length > 0"
    id="my-chart-id"
    :options="chartOptions"
    :data="chartData"
  />
  <div v-else class="flex items-center justify-center h-full text-gray-500">
    Belum ada data belajar untuk ditampilkan.
  </div>
</template>

<script setup>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

defineProps({
  chartData: {
    type: Object,
    required: true,
    default: () => ({
      labels: [],
      datasets: [{ data: [] }]
    })
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return value + ' jam'
        }
      }
    }
  }
}
</script>
