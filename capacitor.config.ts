import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pycthoant.downloader',
  appName: 'Pycthoant',
  webDir: 'dist',
  android: {
    backgroundColor: '#0d1117',
    allowMixedContent: true,
  },
  plugins: {
    CapacitorDownloader: {
      // 权限在 AndroidManifest.xml 里配置
    },
  },
};

export default config;
