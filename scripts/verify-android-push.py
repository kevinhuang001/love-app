"""Verify the actual APK contains only our direct/local notification integration."""
from pathlib import Path
from zipfile import ZipFile
import subprocess
import os
import re
apk=Path('apps/client/android/app/build/outputs/apk/debug/app-debug.apk')
with ZipFile(apk) as archive:
    dex=b'\n'.join(archive.read(n) for n in archive.namelist() if n.endswith('.dex'))
    for name in ['LocalNotificationsPlugin','LocalNotificationService','MainActivity']:
        assert ('Lcom/kevinhuang/love/'+name+';').encode() in dex, name
    for forbidden in [b'Lcn/jpush/',b'Lcn/jiguang/',b'Lcom/google/firebase/messaging/',b'Lcom/huawei/hms/push/',b'Lcom/hihonor/push/',b'Lcom/xiaomi/mipush/',b'Lcom/heytap/msp/push/',b'Lcom/vivo/push/',b'Lcom/meizu/cloud/pushsdk/']:
        assert forbidden not in dex, f'Unexpected third-party notification SDK: {forbidden}'
    assert not any(n.endswith('services.json') or 'push-build.json' in n for n in archive.namelist())
aapt=Path(os.environ['ANDROID_HOME'])/'build-tools/36.0.0/aapt'
manifest=subprocess.check_output([str(aapt),'dump','xmltree',str(apk),'AndroidManifest.xml'],text=True)
assert 'LocalNotificationService' in manifest
# aapt renders enum flags as integers rather than their source XML names.
assert re.search(r'foregroundServiceType[^\n]*\(type 0x11\)0x40000000\b', manifest), 'Missing specialUse service type'
assert 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE' in manifest
permissions=subprocess.check_output([str(aapt),'dump','permissions',str(apk)],text=True)
for permission in ['POST_NOTIFICATIONS','FOREGROUND_SERVICE','FOREGROUND_SERVICE_SPECIAL_USE']:
    assert permission in permissions
for permission in ['ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION','READ_PHONE_STATE','QUERY_ALL_PACKAGES','READ_EXTERNAL_STORAGE','WRITE_EXTERNAL_STORAGE','RECEIVE_BOOT_COMPLETED']:
    assert permission not in permissions
print('APK verified: direct stream/local notifications, no third-party push SDKs or credentials.')
