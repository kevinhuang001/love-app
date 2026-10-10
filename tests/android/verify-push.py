"""Verify the actual APK contains only our direct/local notification integration."""
from pathlib import Path
from zipfile import ZipFile
import subprocess
import os
import re
import json
apk=Path(os.environ.get('LOVE_APK_PATH', 'apps/client/android/app/build/outputs/apk/debug/app-debug.apk'))
metadata_path=os.environ.get('LOVE_APK_SIGNING_METADATA')
if metadata_path:
    signing=json.loads(Path(metadata_path).read_text())
    if signing['mode']=='release':
        apksigner=Path(os.environ['ANDROID_HOME'])/'build-tools/36.0.0/apksigner'
        report=subprocess.check_output([str(apksigner),'verify','--verbose','--print-certs',str(apk)],text=True)
        actual=re.search(r'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]+)',report)
        assert actual and actual[1].lower()==signing['certificateSha256'], 'APK signing certificate mismatch'
        print('Fixed signing certificate verified:', actual[1].lower())
with ZipFile(apk) as archive:
    config=json.loads(archive.read('assets/capacitor.config.json'))
    assert config['server']['androidScheme']=='https', 'Changed the app origin'
    assert config['server']['cleartext'] is True, 'HTTP backend access disabled'
    assert config['android']['allowMixedContent'] is True, 'WebView blocks HTTP API/media requests'
    dex=b'\n'.join(archive.read(n) for n in archive.namelist() if n.endswith('.dex'))
    for name in ['LocalNotificationsPlugin','LocalNotificationService','MainActivity']:
        assert ('Lcom/kevinhuang/love/'+name+';').encode() in dex, name
    for package, name in [('com/capacitorjs/plugins/filetransfer','FileTransferPlugin'),('com/capacitorjs/plugins/filesystem','FilesystemPlugin'),('com/capacitorjs/plugins/share','SharePlugin')]:
        assert ('L'+package+'/'+name+';').encode() in dex, f'Missing native album export integration: {name}'
    for forbidden in [b'Lcn/jpush/',b'Lcn/jiguang/',b'Lcom/google/firebase/messaging/',b'Lcom/huawei/hms/push/',b'Lcom/hihonor/push/',b'Lcom/xiaomi/mipush/',b'Lcom/heytap/msp/push/',b'Lcom/vivo/push/',b'Lcom/meizu/cloud/pushsdk/']:
        assert forbidden not in dex, f'Unexpected third-party notification SDK: {forbidden}'
    assert not any(n.endswith('services.json') or 'push-build.json' in n for n in archive.namelist())
aapt=Path(os.environ['ANDROID_HOME'])/'build-tools/36.0.0/aapt'
manifest=subprocess.check_output([str(aapt),'dump','xmltree',str(apk),'AndroidManifest.xml'],text=True)
assert 'LocalNotificationService' in manifest
assert re.search(r'usesCleartextTraffic[^\n]*\(type 0x12\)0xffffffff\b', manifest), 'Android blocks HTTP servers'
# aapt renders enum flags as integers rather than their source XML names.
assert re.search(r'foregroundServiceType[^\n]*\(type 0x11\)0x40000000\b', manifest), 'Missing specialUse service type'
assert 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE' in manifest
permissions=subprocess.check_output([str(aapt),'dump','permissions',str(apk)],text=True)
for permission in ['POST_NOTIFICATIONS','FOREGROUND_SERVICE','FOREGROUND_SERVICE_SPECIAL_USE']:
    assert permission in permissions
for permission in ['ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION','READ_PHONE_STATE','QUERY_ALL_PACKAGES','READ_EXTERNAL_STORAGE','WRITE_EXTERNAL_STORAGE','RECEIVE_BOOT_COMPLETED']:
    assert permission not in permissions
print('APK verified: direct stream/local notifications, no third-party push SDKs or credentials.')
# Resource paths may be shortened in release APKs. Resolve names/configurations
# through the packaged resource table, then inspect the actual compiled XML.
aapt2=Path(os.environ['ANDROID_HOME'])/'build-tools/36.0.0/aapt2'
resource_table=subprocess.check_output([str(aapt2),'dump','resources',str(apk)],text=True)
resource_paths={}
current=None
for line in resource_table.splitlines():
    header=re.search(r'^\s*resource\s+0x[0-9a-fA-F]+\s+(?:[^\s:]+:)?(\w+/\w+)\b', line)
    if header:
        current=header[1]
    file=re.search(r'^\s*\(([^)]*)\)\s+\(file\)\s+(res/\S+)', line)
    if current and file:
        resource_paths.setdefault(current, {})[file[1]]=file[2]

def resource_path(name, qualifier=None):
    entries=resource_paths.get(name, {})
    assert entries, f'Missing brand resource in APK table: {name}'
    paths=[path for config,path in entries.items() if qualifier is None or qualifier in config]
    assert paths, f'Missing brand resource configuration: {name} {qualifier}'
    return paths[0]

with ZipFile(apk) as archive:
    names=archive.namelist()
    foreground_path=resource_path('drawable/love_icon_foreground')
    monochrome_path=resource_path('drawable/love_icon_monochrome')
    adaptive26_path=resource_path('mipmap/ic_launcher', 'v26')
    adaptive33_path=resource_path('mipmap/ic_launcher', 'v33')
    for path in [foreground_path,monochrome_path,adaptive26_path,adaptive33_path]:
        assert path in names, f'Missing packaged brand XML: {path}'
    assert not any(n.endswith('/splash.png') or n.endswith('/ic_launcher_foreground.png') for n in names), 'Capacitor placeholder images remain'
foreground=subprocess.check_output([str(aapt),'dump','xmltree',str(apk),foreground_path],text=True)
for path in ['M58 38H48C40 38 34 44 34 52V62C34 70 40 76 48 76H58','M50 32H60C68 32 74 38 74 46V56C74 64 68 70 60 70H50']:
    assert path in foreground, 'Packaged logo differs from designed artwork'
for color in ['0xffefeade','0xffb69a6b']:
    assert color in foreground.lower(), 'Missing ivory/copper logo colors'
adaptive=subprocess.check_output([str(aapt),'dump','xmltree',str(apk),adaptive33_path],text=True)
assert all('E: '+layer in adaptive for layer in ['background','foreground','monochrome']), 'Missing adaptive/themed layer'
resources=subprocess.check_output([str(aapt),'dump','resources',str(apk)],text=True)
assert 'love_icon_background' in resources and 'ff172e29' in resources.lower(), 'Missing ink green background'
print('APK branding verified: paired-arch artwork, adaptive/themed icons and branded launch resources.')
