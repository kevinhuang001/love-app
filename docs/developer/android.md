# Android 构建与签名

本文面向维护 APK 的开发者。下载安装、服务器地址和通知设置见 [Android 使用](../user/android.md)。

## 调试构建

需要 Node 24、Java 21 和 Android SDK 36。在仓库根目录执行：

```bash
npm ci
npm run android:prepare
cd apps/client/android
./gradlew assembleDebug
```

产物为 `apps/client/android/app/build/outputs/apk/debug/app-debug.apk`。Windows 使用 `gradlew.bat`。

`android:prepare` 构建 Web 界面、同步 Capacitor，并生成原生配置。原生源码维护在 [apps/client/native](../../apps/client/native)，生成逻辑在 [scripts/android.mjs](../../scripts/android.mjs)。不要只修改生成后的 Java 或 Manifest，下一次 prepare 会覆盖它们。

包名为 `com.kevinhuang.love`，WebView origin 为 `https://localhost`。客户端登录页选择远端服务器，不把服务器地址编译进 APK。应用通过 Preferences 保存会话、服务器地址和用户名，不保存密码；`allowBackup=false`。

## 配置固定正式签名

持续使用同一把密钥，用户才能覆盖安装后续版本并保留应用数据。私钥与密码应单独备份，不能提交到 Git 或上传到 Release。

在自己的电脑生成 JKS，按提示设置密码和证书信息：

```bash
keytool -genkeypair -keystore love-release.jks -storetype JKS \
  -alias love -keyalg RSA -keysize 3072 -validity 10000
```

若密钥密码与 keystore 密码不同，构建时分别提供它们。转成 Base64：

```bash
base64 < love-release.jks | tr -d '\n'
```

在自己的 GitHub 仓库 Settings → Secrets and variables → Actions 配置：

| Secret                           | 内容                             |
| -------------------------------- | -------------------------------- |
| `LOVE_ANDROID_KEYSTORE_BASE64`   | JKS 文件的 Base64                |
| `LOVE_ANDROID_KEYSTORE_PASSWORD` | keystore 密码                    |
| `LOVE_ANDROID_KEY_ALIAS`         | 别名；省略时为 `love`            |
| `LOVE_ANDROID_KEY_PASSWORD`      | 密钥密码；省略时用 keystore 密码 |

Actions 有固定密钥时构建正式 APK，并核对 APK 的实际签名指纹。没有密钥时仍生成调试 APK 供 CI 检查，但发布流程不会把临时调试签名的 APK 当作正式版本发布。

## 本地正式构建

将 `LOVE_ANDROID_KEYSTORE_PATH` 设为 JKS 的绝对路径，同时设置上表中的密码、别名环境变量；本地无需 Base64。不要将密码写进提交的脚本。在仓库根目录执行 prepare，再进入 Android 目录：

```bash
npm run android:prepare
cd apps/client/android
./gradlew assembleRelease
```

产物为 `apps/client/android/app/build/outputs/apk/release/app-release.apk`。

`versionName` 来自根目录 package.json；`versionCode` 来自 `LOVE_VERSION_CODE`，本地默认 1，CI 使用工作流运行编号。覆盖安装要求包名和签名一致，versionCode 不降低。正式发布前检查版本号与签名，不要为每个版本重新生成密钥。

## 通知实现与验证

原生服务使用认证 SSE 连接自建后端，并在手机生成本地通知。用户明确开启后运行可见的 `specialUse` 前台服务。令牌放在 Authorization 头中，事件只携带消息 ID。断线会重连；已读消息和用户自己的消息只推进游标。会话或配对失效后停止。

修改通知行为后，至少用两台真实手机测试：

1. 双方配对并开启通知权限，接收方退到桌面或锁屏。
2. 另一方发送消息，确认通知出现，点击后打开聊天。
3. 断网后恢复，确认补取遗漏消息且不重复提醒。
4. 退出登录或解除配对，确认停止接收。
5. 检查设备的电池限制、深度休眠和进程被终止时的表现。

CI 会验证原生编译、Manifest、实际 DEX、签名和打包网络配置，也会检查本地通知桥接与权限。检查脚本仍叫 [verify-android-push.py](../../scripts/verify-android-push.py)，它验证的是当前本地通知方案。自动检查不能代替真实手机的锁屏与送达测试。服务需要进程持续运行，不具备进程被终止后的离线唤醒或开机自启动能力。

构建产物、发布门槛和版本维护见 [CI 与发布](ci.md)。
