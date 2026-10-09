import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';
const config: CapacitorConfig = {
  appId: 'com.kevinhuang.love',
  appName: 'Love',
  webDir: 'dist',
  // Keep the app origin stable; self-hosted HTTP backends need both native and WebView opt-ins.
  server: { androidScheme: 'https', cleartext: true },
  android: { allowMixedContent: true },
  plugins: {
    Keyboard: { resize: KeyboardResize.Native },
  },
};
export default config;
