<script setup lang="ts">
</script>

<template>
  <div class="main-container">
    <!-- 主体内容 -->
    <main class="main-content">
      <div>
        <h1>{{ $t('about') }} Page</h1>
        <p>This is the about page for CiRemote application</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-top: 60px; /* 为固定头部留出空间 */
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>