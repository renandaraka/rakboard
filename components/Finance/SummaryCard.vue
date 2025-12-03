<template>
  <div class="p-6 rounded-lg shadow-md" :class="cardClasses">
    <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
    <p class="text-3xl font-bold">{{ formattedValue }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    default: 'default' // 'income', 'expense', 'balance'
  }
});

const formattedValue = computed(() => {
  return `Rp ${props.value.toLocaleString('id-ID')}`;
});

const cardClasses = computed(() => {
  switch (props.type) {
    case 'income':
      return 'bg-green-100 text-green-800';
    case 'expense':
      return 'bg-red-100 text-red-800';
    case 'balance':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-white';
  }
});

</script>
