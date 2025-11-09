<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'

const route = useRoute()

// 当路由为/jobs或/jobs/invite时隐藏Header
const hideHeader = computed(() => {
  return route.path === '/jobs' || route.path === '/jobs/invite'
})
</script>

<template>
  <div id="app">
    <Header v-if="!hideHeader" />
    <router-view />
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