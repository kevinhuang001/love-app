# Android / 本地通知

Capacitor 8 打包 Web 界面，原生前台服务直接连接自建后端，在手机生成本地通知。没有第三方推送 SDK、厂商通道、设备令牌注册或相关配置密钥。

## Android 返回键

系统返回键和返回手势按顺序处理：收起软键盘、关闭当前最上层弹窗/图片视频预览、从其他底部页面返回聊天。登录注册/找回密码页面先返回登录；主页面将应用退到后台，不退出账号或清除登录信息。监听在卸载组件时释放，避免重复触发。

## 本地构建

本地需要 Node 24、Java 21、Android SDK 36：

```bash
npm ci
npm run android:prepare
cd apps/client/android
./gradlew assembleDebug
```

APK 位于 `apps/client/android/app/build/outputs/apk/debug/app-debug.apk`。GitHub Actions 生成 `love-android-apk`，包含 `love.apk` 和不含私钥的 `signing.json`。包名始终为 `com.kevinhuang.love`，WebView origin 始终为 `https://localhost`。

## 更新与登录信息

正常更新直接安装新 APK 覆盖旧版本，不要卸载。相同包名、相同签名且 versionCode 不降低时，Android 保留应用数据。登录会话、上次服务器地址和用户名保存在 Capacitor Preferences 中，密码不保存；退出登录仅清除会话，仍可复用服务器和用户名。会话默认有效期 30 天，过期、改密码或管理员撤销后需重新登录。

卸载或清除应用数据会删除本地信息；应用不依赖 Android 云备份恢复登录，也不会把登录令牌写到公开下载目录。服务器上的配对、相册、聊天不会因卸载而删除。

以前发布的 APK 使用临时调试签名，可能不能覆盖安装。转换到固定正式签名时通常需要最后一次重新安装；之后一直使用同一密钥覆盖更新。

## 一次性配置固定 APK 签名

在自己的电脑上生成 keystore（提示时设置密码并填写证书信息）：

```bash
keytool -genkeypair -keystore love-release.jks -alias love -keyalg RSA -keysize 3072 -validity 10000
base64 < love-release.jks | tr -d '\n'
```

将第二行结果复制到仓库 [Settings → Secrets and variables → Actions](https://github.com/kevinhuang001/love-app/settings/secrets/actions)，创建：

| Secret                           | 内容                         |
| -------------------------------- | ---------------------------- |
| `LOVE_ANDROID_KEYSTORE_BASE64`   | keystore 的 Base64           |
| `LOVE_ANDROID_KEYSTORE_PASSWORD` | keystore 密码                |
| `LOVE_ANDROID_KEY_ALIAS`         | 可不填，默认 `love`          |
| `LOVE_ANDROID_KEY_PASSWORD`      | 可不填，默认同 keystore 密码 |

备份 keystore 与密码，后续更新不要重新生成或替换。私钥不提交到 Git，不上传到 Release，也不进入 Docker 镜像。插件没有管理仓库 Secrets 的权限，需要仓库所有者在 GitHub 设置。

配置后在 Actions 的 **Test and build** 点 **Run workflow**（main）。CI 使用固定密钥构建正式 APK，并核对 APK 实际签名证书；全部检查通过后发布 `Love-v2.8.1.apk`、文件 SHA-256 与签名指纹到 Release。没有配置密钥时，CI 仍构建调试 APK用于测试，但不自动发布随机签名 APK。

本地正式构建：设置 `LOVE_ANDROID_KEYSTORE_PATH` 为 keystore 绝对路径，设置上述密码、alias 环境变量，执行 `npm run android:prepare` 和 `./gradlew assembleRelease`。APK 位于 `app/build/outputs/apk/release/app-release.apk`。无需配置任何推送 Secret。

## 使用

1. APK 登录页展开最下面的“服务器设置”，填写完整根地址，例如 `http://192.168.1.10:3000` 或 `https://love.example.com`，不加 `/api`。支持 HTTP/HTTPS 的域名、IPv4、IPv6 和端口；HTTP 连接未加密，公网建议配置 HTTPS。手机上的 localhost 指向手机自身，连接电脑或服务器请填它的实际地址。
2. 地址留空或格式无效时，账号/密码禁止输入，placeholder 显示“请先配置服务器地址”，不使用弹窗。服务器设置中的“测试连接”检查健康接口和登录配置，显示成功/失败结果；`0.0.0.0` 是部署监听地址，手机填写实际 IP 或域名。
3. 双方配对后，在“我们 → 聊天通知”开启，并允许 Android 通知权限。
4. 通知栏显示低优先级的“Love · 本地通知”连接状态，可通过“停止接收”关闭服务。新消息使用独立的高优先级频道 `messages`。
5. “打开后台运行设置”进入系统应用信息页，手动允许后台运行并将电池设为“不受限制”；部分系统还需要在最近任务中锁定应用。
6. 本地服务在应用界面进入后台后仍接收消息，前台不再生成重复系统通知。通知正文固定为“你的人给你发来了一条消息”，点击打开聊天。

连接使用认证的 SSE `/api/notifications/stream`，令牌只放 Authorization 请求头，不放 URL。消息流只包含消息编号，15 秒心跳，网络中断按 1–30 秒退避重连，并按服务器、用户和配对作用域保存游标。重连补取遗漏事件，已读消息和自己的普通消息只推进游标，不产生通知；消息正文始终留在数据库中。

首次开启以当前消息位置作为起点，不弹历史通知。解除配对、退出登录、会话撤销、管理员停用账号会关闭服务连接；原生端收到未授权或未配对状态后停止。关闭开关会停止连接并清理通知。服务为用户明确开启、带可见停止按钮的 `specialUse` 前台服务；不使用 dataSync 无限保活，也不申请定位、电话、存储、开机自启动权限。

这个模式以进程继续运行为前提，不支持进程被系统终止后的离线唤醒。没有开机自启动。重新打开应用可恢复曾开启的服务；系统深度休眠、厂商电池策略或断网仍可能导致延迟。Web 只提供前台实时聊天，不提供后台本地通知。

## 验证

两台真实手机：配对、开启权限 → 接收方退到桌面／锁屏 → 另一方发送 → 查看本地通知并点击 → 暂时断网再恢复 → 确认遗漏消息补取且不重复提醒 → 解除配对／退出后不再收到。管理员独立访问 `/#admin`，概览显示当前直连连接数。

CI 检查原生编译、APK 实际 DEX、Manifest 和打包的 Capacitor 网络配置、本地通知桥接类及必要权限，并拒绝第三方推送 SDK 和凭据文件；登录回归测试覆盖非 localhost 的 HTTP 服务器、地址错误和验证码请求超时，服务端测试覆盖事件流隔离、重连、已读抑制和撤销连接。CI 不能代替真实手机的锁屏、电池策略与送达测试。
