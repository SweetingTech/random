module.exports = {
  packagerConfig: {
    name: 'Mega IDE',
    executableName: 'mega-ide',
    asar: true,
    extraResource: [
      'assets'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'mega-ide',
        authors: 'Mega IDE Team',
        description: 'An advanced IDE with AI capabilities'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Mega IDE Team',
          homepage: 'https://mega-ide.com'
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Mega IDE Team',
          homepage: 'https://mega-ide.com'
        }
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'electron/main.ts',
            config: 'vite.config.ts'
          },
          {
            entry: 'electron/preload.ts',
            config: 'vite.config.ts'
          }
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.config.ts',
            js: ['src/main.tsx'],
            html: ['index.html']
          }
        ]
      }
    }
  ]
};
