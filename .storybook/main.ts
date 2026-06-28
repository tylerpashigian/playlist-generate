import type { StorybookConfig } from '@storybook/react-vite'
import type { PluginOption } from 'vite'

function withoutTanStackStartPlugins(plugins: Array<PluginOption>) {
  return plugins.flatMap((plugin): Array<PluginOption> => {
    if (!plugin) {
      return []
    }

    if (Array.isArray(plugin)) {
      return withoutTanStackStartPlugins(plugin)
    }

    if (
      'name' in plugin &&
      typeof plugin.name === 'string' &&
      plugin.name.startsWith('tanstack-start:')
    ) {
      return []
    }

    return [plugin]
  })
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    const { default: tailwindcss } = await import('@tailwindcss/vite')
    viteConfig.plugins = withoutTanStackStartPlugins(viteConfig.plugins || [])
    viteConfig.plugins.push(tailwindcss())
    return viteConfig
  },
}
export default config
