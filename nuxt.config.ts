// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap' }
      ]
    }
  },
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  modules: [
    '@nuxtjs/supabase',
    '@pinia/nuxt',
  ],
  build: {
    transpile: ['vue-chartjs', 'chart.js'],
  },

  // Menggunakan runtimeConfig untuk eksposur environment variable yang aman
  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.NUXT_PUBLIC_SUPABASE_URL,
        key: process.env.NUXT_PUBLIC_SUPABASE_KEY
      }
    }
  },

  supabase: {
    // Modul akan mengambil konfigurasi dari runtimeConfig secara otomatis
    redirect: false
  },

  // Tambahkan konfigurasi ini untuk memperbaiki masalah Mixed Content (HTTPS/WSS)
  vite: {
    server: {
      hmr: {
        protocol: 'wss'
      }
    }
  }
})
