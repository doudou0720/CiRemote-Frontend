// eslint.config.js
import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'

export default [
  // 忽略的文件
  {
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.min.js'
    ]
  },

  // 全局设置
  {
    name: 'app/global-setup',
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        process: 'readonly'
      }
    }
  },

  // Vue 基础配置
  ...pluginVue.configs['flat/essential'],
  
  // TypeScript 配置
  ...vueTsEslintConfig(),
  
  // Prettier 配置
  skipFormatting,

  // 自定义规则 - 放在最后以确保优先级
  {
    name: 'app/custom-rules',
    files: ['**/*.{js,mjs,jsx,ts,mts,tsx,vue}'],
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  },
  
  // TypeScript 特定规则
  {
    name: 'app/typescript-rules',
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      'vue/multi-word-component-names': ['error', {
        ignores: ['Home', 'About', 'Jobs', 'Header', 'Settings', 'Invite', 'JobDetail']
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ],
      'no-unused-vars': 'off' // 禁用基础规则
    }
  }
]