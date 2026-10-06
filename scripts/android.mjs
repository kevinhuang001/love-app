import { spawnSync } from 'node:child_process';
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const client = resolve('apps/client');
function cap(...args) {
  const result = spawnSync(
    process.execPath,
    [resolve('node_modules/@capacitor/cli/bin/capacitor'), ...args],
    { cwd: client, stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}
if (!existsSync(resolve(client, 'android'))) cap('add', 'android');
const app = resolve(client, 'android/app'),
  native = resolve(app, 'src/main/java/com/kevinhuang/love');
mkdirSync(native, { recursive: true });
for (const file of [
  'MainActivity.java',
  'LocalNotificationsPlugin.java',
  'LocalNotificationService.java',
])
  copyFileSync(resolve(client, 'native', file), resolve(native, file));
writeFileSync(
  resolve(app, 'src/main/AndroidManifest.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
 <uses-permission android:name="android.permission.INTERNET"/>
 <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
 <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
 <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE"/>
 <application android:allowBackup="false" android:icon="@mipmap/ic_launcher" android:label="@string/app_name" android:roundIcon="@mipmap/ic_launcher_round" android:supportsRtl="true" android:theme="@style/AppTheme" android:usesCleartextTraffic="false">
  <activity android:name=".MainActivity" android:exported="true" android:launchMode="singleTask" android:theme="@style/AppTheme.NoActionBarLaunch" android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity>
  <service android:name=".LocalNotificationService" android:exported="false" android:foregroundServiceType="specialUse"><property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value="User-enabled continuous reception of private chat messages from a self-hosted server, with a visible stop action"/></service>
  <provider android:name="androidx.core.content.FileProvider" android:authorities="\${applicationId}.fileprovider" android:exported="false" android:grantUriPermissions="true"><meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths"/></provider>
 </application>
</manifest>`,
);
mkdirSync(resolve(app, 'src/main/res/drawable'), { recursive: true });
writeFileSync(
  resolve(app, 'src/main/res/drawable/ic_stat_message.xml'),
  '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:fillColor="#FFFFFFFF" android:pathData="M4,3h16v14H8l-4,4zM7,7v2h10V7zM7,11v2h7v-2z"/></vector>',
);
const gradle = resolve(app, 'build.gradle');
let build = readFileSync(gradle, 'utf8')
  .replace(
    /^\s*versionCode(?:\s*=)?\s+.*$/m,
    '        versionCode = (System.getenv("LOVE_VERSION_CODE") ?: "1").toInteger()',
  )
  .replace(/versionName "[^\"]*"/, 'versionName "2.1.0"');
writeFileSync(gradle, build);
cap('sync', 'android');
