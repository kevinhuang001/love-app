"""CI assertion against the compiled APK, never against source-only stubs."""
from pathlib import Path
from zipfile import ZipFile
import json
import subprocess
import os

apk = Path('apps/client/android/app/build/outputs/apk/debug/app-debug.apk')
with ZipFile(apk) as archive:
    dex = b'\n'.join(archive.read(name) for name in archive.namelist() if name.endswith('.dex'))
    classes = [
        'com/kevinhuang/love/ChinaPushPlugin',
        'com/kevinhuang/love/LovePushReceiver',
        'com/kevinhuang/love/PushClickActivity',
        'com/huawei/hms/push/HmsMessageService',
        'com/hihonor/push/sdk/HonorPushClient',
        'com/xiaomi/mipush/sdk/MiPushClient',
        'com/heytap/msp/push/HeytapPushManager',
        'com/vivo/push/PushClient',
        'com/meizu/cloud/pushsdk/PushManager',
    ]
    for name in classes:
        assert ('L' + name + ';').encode() in dex, f'Missing compiled SDK class: {name}'
    config = json.loads(archive.read('assets/public/push-build.json'))
    assert set(config) == {'firebaseConfigured', 'jpushConfigured', 'vendors'}
    assert isinstance(config['jpushConfigured'], bool)
    assert not any('MasterSecret' in name for name in archive.namelist())

sdk = Path(os.environ['ANDROID_HOME'])
aapt = sdk / 'build-tools' / '36.0.0' / 'aapt'
manifest = subprocess.check_output([str(aapt), 'dump', 'xmltree', str(apk), 'AndroidManifest.xml'], text=True)
for component in ['LovePushReceiver', 'PushClickActivity', 'PluginXiaomiPlatformsReceiver', 'PluginVivoMessageReceiver', 'JHonorService']:
    assert component in manifest, f'Missing manifest component: {component}'
permissions = subprocess.check_output([str(aapt), 'dump', 'permissions', str(apk)], text=True)
for denied in ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'READ_PHONE_STATE', 'QUERY_ALL_PACKAGES', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE']:
    assert denied not in permissions, f'Unnecessary permission present: {denied}'
assert 'POST_NOTIFICATIONS' in permissions
print('APK verified: six vendor SDKs, native bridge/click handling, public build status and notification permissions.')
