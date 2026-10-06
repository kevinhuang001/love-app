# Android / 消息通知

## 构建

Capacitor 8 将已构建 Web 资源打包到原生 Android 壳，资源随 APK 分发。Android 工程由 `scripts/android.mjs` 根据锁定版本重新生成，脚本保留推送图标、Manifest、版本号与 Firebase 配置，不提交生成物。

本地需要 Java 21、Android SDK 36、Node 24：

```bash
npm ci
npm run android:prepare
cd apps/client/android
./gradlew assembleDebug
```

APK：`apps/client/android/app/build/outputs/apk/debug/app-debug.apk`。

登录页填写 HTTPS 后端根地址；APK 没有硬编码生产服务器。客户端本地开发 HTTP URL 仅接受 localhost / 127.0.0.1 / 模拟器 10.0.2.2；原生发布网络策略仍要求 HTTPS，手机测试建议使用开发 HTTPS 域名。底部导航、安全区、软键盘避让和可点击大小适配手机。

## FCM

1. 创建 Firebase 项目并添加 Android 应用，包名 **com.kevinhuang.love**。
2. 下载 `google-services.json`，把文件内容保存为 GitHub repository Actions Secret **GOOGLE_SERVICES_JSON**。本地构建可放在仓库 `config/google-services.json`，该路径已忽略。
3. 启用 Firebase Cloud Messaging HTTP v1，创建服务账号。服务端设置 `GOOGLE_APPLICATION_CREDENTIALS` 指向私密文件，或设置 `FIREBASE_SERVICE_ACCOUNT` 为 JSON 内容。不要将服务账号 JSON 放进 APK 或仓库。
4. 用上述客户端配置重新跑 CI、安装 APK。两位用户在“我们”中打开“聊天通知”，允许 Android 13+ 的通知权限。客户端创建高优先级 `messages` 频道并把设备 token 注册到当前服务器。
5. 使用真实设备验证：一方把应用置于后台／锁屏，另一方发消息；点击通知进入聊天。退出登录会撤销当前 session、注销当前设备 token；应用恢复时自动重新注册已开启通知的设备。

后台通知只显示“你的人给你发来了一条消息”，不把聊天内容显示在锁屏。数据库中先保存消息和推送任务，再由 worker 发送，失败最多重试 5 次。已读消息不再发后台通知，失效 token 会删除。推送不替代消息存储：回到前台后始终从服务器补取消息。

FCM 依赖兼容的 Google Play services 及网络；无 GMS 的安卓设备可能无法收到 FCM，需要后续接入对应厂商通道。强制停止 App 后系统可能停止推送，直到再次打开应用。Web 前台使用 Socket.IO，当前版本没有 Web 后台推送。

没有 Firebase client JSON 的 CI 仍生成调试 APK，构建清单 `push-build.json` 会标记不可用；该包不能测试真实后台通知。配好客户端与服务端两份配置后才启用通知。

## 发布签名

调试 APK 适合验证，更新时不同 CI runner 的调试签名可能不同。正式使用需保留自己的 keystore。在 Android Studio 打开 `apps/client/android`，选择 Generate Signed Bundle / APK，以同一 keystore 为每个版本签名。或者自行用 CI Secret 安全传入 keystore 与密码运行 `assembleRelease` 和签名流程，禁止把私钥提交到 Git。
