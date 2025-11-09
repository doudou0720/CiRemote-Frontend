<template>
  <div class="jobs-container">
    <h1>{{ $t('jobs') }}</h1>
    <p>这是作业模块页面，不显示在顶部导航栏中。</p>
    <div class="job-content">
      <p>作业模块内容区域</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 作业模块逻辑可以在这里添加
</script>

<style scoped>
.jobs-container {
  padding: 20px;
  margin-top: 60px; /* 为顶部固定header留出空间 */
}

.job-content {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>