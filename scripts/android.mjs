import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const client = resolve('apps/client');
function cap(...args) {
  const r = spawnSync(
    process.execPath,
    [resolve('node_modules/@capacitor/cli/bin/capacitor'), ...args],
    { cwd: client, stdio: 'inherit' },
  );
  if (r.status !== 0) process.exit(r.status || 1);
}
if (!existsSync(resolve(client, 'android'))) cap('add', 'android');
const app = resolve(client, 'android/app');
// Firebase client configuration is optional for the debug artifact, required for real push.
if (process.env.GOOGLE_SERVICES_JSON)
  writeFileSync(resolve(app, 'google-services.json'), process.env.GOOGLE_SERVICES_JSON);
else if (existsSync(resolve('config/google-services.json')))
  copyFileSync(resolve('config/google-services.json'), resolve(app, 'google-services.json'));
const firebaseConfigured = existsSync(resolve(app, 'google-services.json'));
writeFileSync(resolve(client, 'src/push-build.json'), JSON.stringify({ firebaseConfigured }));
const builtConfig = resolve(client, 'dist/push-build.json');
writeFileSync(builtConfig, JSON.stringify({ firebaseConfigured }));
const manifestPath = resolve(app, 'src/main/AndroidManifest.xml');
let manifest = readFileSync(manifestPath, 'utf8');
if (!manifest.includes('POST_NOTIFICATIONS'))
  manifest = manifest.replace(
    '</manifest>',
    '<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/></manifest>',
  );
if (!manifest.includes('default_notification_icon'))
  manifest = manifest.replace(
    '</application>',
    '<meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_heart"/><meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="messages"/></application>',
  );
manifest = manifest.replace('android:allowBackup="true"', 'android:allowBackup="false"');
writeFileSync(manifestPath, manifest);
const heart = resolve(app, 'src/main/res/drawable/ic_stat_heart.xml');
mkdirSync(dirname(heart), { recursive: true });
writeFileSync(
  heart,
  '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:fillColor="#FFFFFFFF" android:pathData="M12,21L3.2,12.2C-2,6.8 5.2,-0.3 12,6.4C18.8,-0.3 26,6.8 20.8,12.2Z"/></vector>',
);
const gradle = resolve(app, 'build.gradle');
let build = readFileSync(gradle, 'utf8');
build = build
  .replace(
    /^\s*versionCode(?:\s*=)?\s+.*$/m,
    '        versionCode = (System.getenv("LOVE_VERSION_CODE") ?: "1").toInteger()',
  )
  .replace(/versionName "1.0"/, 'versionName "2.0.0"');
writeFileSync(gradle, build);
cap('sync', 'android');
console.log(
  firebaseConfigured
    ? 'Android ready with Firebase push configuration.'
    : 'Android ready. Push is unavailable until google-services.json is supplied.',
);
