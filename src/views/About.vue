<template>
  <div class="about">
    <h1>{{ $t('about') }}</h1>
    <p>{{ $t('aboutContent') }}</p>
  </div>
</template>

<script setup lang="ts">
// About页面组件
// 这是一个简单的关于页面，显示应用的介绍信息
</script>

<style scoped>
.about {
  padding: 20px;
}

h1 {
  color: #333;
  margin-bottom: 16px;
}

p {
  color: #666;
  line-height: 1.6;
}
</style>