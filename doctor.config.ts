import { defineConfig } from 'react-doctor/api'

export default defineConfig({
  ignore: {
    files: ['src/generated/**', '.output/**', 'dist/**'],
  },
})
