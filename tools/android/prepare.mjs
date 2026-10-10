import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
const client = resolve('apps/client');
const appVersion = JSON.parse(readFileSync(resolve('package.json'), 'utf8')).version;
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
  'AppUpdatesPlugin.java',
  'LocalNotificationsPlugin.java',
  'LocalNotificationService.java',
])
  copyFileSync(resolve(client, 'native', file), resolve(native, file));
writeFileSync(
  resolve(app, 'src/main/AndroidManifest.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
 <uses-permission android:name="android.permission.INTERNET"/>
 <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES"/>
 <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
 <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
 <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE"/>
 <application android:allowBackup="false" android:icon="@mipmap/ic_launcher" android:label="@string/app_name" android:roundIcon="@mipmap/ic_launcher_round" android:supportsRtl="true" android:theme="@style/AppTheme" android:usesCleartextTraffic="true">
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
// Brand resources are generated from text/vector sources, never from Capacitor placeholders.
const res = resolve(app, 'src/main/res');
rmSync(resolve(res, 'values/ic_launcher_background.xml'), { force: true });
const put = (folder, file, content) => {
  mkdirSync(resolve(res, folder), { recursive: true });
  writeFileSync(resolve(res, folder, file), content);
};
for (const folder of readdirSync(res)) {
  if (!folder.startsWith('drawable') && !folder.startsWith('mipmap')) continue;
  for (const file of readdirSync(resolve(res, folder))) {
    if (
      file === 'splash.png' ||
      file === 'ic_launcher_foreground.png' ||
      file === 'ic_launcher_foreground.xml' ||
      file === 'ic_launcher_background.xml'
    )
      rmSync(resolve(res, folder, file));
  }
}
put(
  'values',
  'love_brand.xml',
  '<resources><color name="love_icon_background">#172E29</color><color name="colorPrimary">#172E29</color><color name="colorPrimaryDark">#172E29</color><color name="colorAccent">#B69A6B</color></resources>',
);
for (const variant of ['foreground', 'monochrome'])
  copyFileSync(
    resolve(client, 'branding', variant + '.xml'),
    resolve(res, 'drawable', 'love_icon_' + variant + '.xml'),
  );
for (const api of [26, 33]) {
  const adaptive = `<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/love_icon_background"/><foreground android:drawable="@drawable/love_icon_foreground"/>${api >= 33 ? '<monochrome android:drawable="@drawable/love_icon_monochrome"/>' : ''}</adaptive-icon>`;
  for (const name of ['ic_launcher', 'ic_launcher_round'])
    put('mipmap-anydpi-v' + api, name + '.xml', adaptive);
}
for (const [density, size] of Object.entries({
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
})) {
  mkdirSync(resolve(res, 'mipmap-' + density), { recursive: true });
  const png = await sharp(resolve(client, 'branding/icon.svg')).resize(size, size).png().toBuffer();
  for (const name of ['ic_launcher', 'ic_launcher_round'])
    writeFileSync(resolve(res, 'mipmap-' + density, name + '.png'), png);
}
put(
  'drawable',
  'splash.xml',
  '<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/love_icon_background"/><item android:width="180dp" android:height="180dp" android:gravity="center" android:drawable="@drawable/love_icon_foreground"/></layer-list>',
);
put(
  'values',
  'styles.xml',
  `<resources>
<style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar"><item name="colorPrimary">@color/colorPrimary</item><item name="colorPrimaryDark">@color/colorPrimaryDark</item><item name="colorAccent">@color/colorAccent</item></style>
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar"><item name="windowActionBar">false</item><item name="windowNoTitle">true</item><item name="android:background">@null</item></style>
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen"><item name="windowSplashScreenBackground">@color/love_icon_background</item><item name="windowSplashScreenAnimatedIcon">@drawable/love_icon_foreground</item><item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item><item name="android:windowBackground">@drawable/splash</item></style>
</resources>`,
);
const gradle = resolve(app, 'build.gradle');
let build = readFileSync(gradle, 'utf8')
  .replace(/\n\/\/ LOVE SIGNING BEGIN[\s\S]*?\/\/ LOVE SIGNING END\n?/g, '')
  .replace(
    /^\s*versionCode(?:\s*=)?\s+.*$/m,
    '        versionCode = (System.getenv("LOVE_VERSION_CODE") ?: "1").toInteger()',
  )
  .replace(/versionName "[^\"]*"/, 'versionName "' + appVersion + '"');
build += `
// LOVE SIGNING BEGIN
def loveSigningPath = System.getenv("LOVE_ANDROID_KEYSTORE_PATH")
if (loveSigningPath) {
    android {
        signingConfigs {
            love {
                storeFile = file(loveSigningPath)
                storePassword = System.getenv("LOVE_ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("LOVE_ANDROID_KEY_ALIAS") ?: "love"
                keyPassword = System.getenv("LOVE_ANDROID_KEY_PASSWORD") ?: System.getenv("LOVE_ANDROID_KEYSTORE_PASSWORD")
            }
        }
        buildTypes { release { signingConfig signingConfigs.love } }
    }
}
// LOVE SIGNING END
`;
writeFileSync(gradle, build);
cap('sync', 'android');
