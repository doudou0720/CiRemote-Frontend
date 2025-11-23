<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'
import { Analytics } from '@vercel/analytics/vue'
import { SpeedInsights } from '@vercel/speed-insights/vue';

const route = useRoute()
</script>

<template>
  <div id="app">
    <Header />
    <router-view />
    <Analytics />
    <SpeedInsights />
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}
</style>