import type { CapacitorConfig } from '@capacitor/cli';

/** Android applicationId / iOS bundle id — reverse-DNS for 다시플레이볼. */
export const APP_ID = 'kr.againplayball.app';

const config: CapacitorConfig = {
  appId: APP_ID,
  appName: '다시플레이볼',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
