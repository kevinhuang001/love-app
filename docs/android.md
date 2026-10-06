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

FCM 依赖兼容的 Google Play services 及网络；在中国大陆即使有 GMS，FCM 的 Google 长连接也可能不可达，可使用下方的国内厂商通道。强制停止 App 后系统可能停止推送，直到再次打开应用。Web 前台使用 Socket.IO，当前版本没有 Web 后台推送。

未提供推送客户端配置时 CI 仍生成调试 APK，构建清单 `push-build.json` 标记各提供者不可用；该包不能测试真实后台通知。FCM 或国内推送都需要客户端与服务端配置对应后才能启用。

## 发布签名

调试 APK 适合验证，更新时不同 CI runner 的调试签名可能不同。正式使用需保留自己的 keystore。在 Android Studio 打开 `apps/client/android`，选择 Generate Signed Bundle / APK，以同一 keystore 为每个版本签名。或者自行用 CI Secret 安全传入 keystore 与密码运行 `assembleRelease` 和签名流程，禁止把私钥提交到 Git。

## 中国大陆厂商推送（极光聚合通道）

本项目通过 **JPush 6.2.0 + JCore 5.5.0** 的原生厂商插件接入华为、荣耀、小米/Redmi、OPPO（兼容机型上的一加/realme）、vivo（兼容机型上的 iQOO）、魅族。六种 SDK 都编译进 APK，无需依赖手机访问 Google。提供者是极光，系统离线通道是对应厂商；这不是自建厂商直连服务。是否可用取决于设备系统、应用审核、签名及凭据；纯 HarmonyOS NEXT 不属于 Android APK 支持范围。

### 配置客户端与厂商控制台

1. 在[极光控制台](https://www.jiguang.cn/)创建 Android 推送应用，包名 **com.kevinhuang.love**，取得 **AppKey** 和 **MasterSecret**。MasterSecret 只放服务器，严禁放 APK 或 Git。
2. 在各厂商开放平台创建相同包名的应用、开通推送，按平台要求添加 **实际 APK 签名证书指纹**。在极光控制台的“推送设置 → 集成设置”配置各厂商的服务端凭据并启用对应通道。OPPO、vivo 通常需要企业开发者认证；未上架/未审核应用存在测试设备、消息类别及额度限制。极光账户的费用、认证与额度请以其控制台当前方案为准；接入代码不代表免费开通所有平台。
3. GitHub Actions Secret **JPUSH_ANDROID_CONFIG** 配置如下（字符串均替换为你的真实值；删除尚未开通的厂商整个字段）：

```json
{
  "appKey": "24位极光AppKey",
  "huawei": true,
  "honor": { "appId": "荣耀AppID" },
  "xiaomi": { "appId": "小米AppID", "appKey": "小米AppKey" },
  "oppo": { "appId": "OPPO_AppID", "appKey": "OPPO_AppKey", "appSecret": "OPPO客户端AppSecret" },
  "vivo": { "appId": "vivo_AppID", "appKey": "vivo_AppKey" },
  "meizu": { "appId": "魅族AppID", "appKey": "魅族AppKey" }
}
```

这是**客户端 SDK 参数**。OPPO SDK 要求的客户端 AppSecret 会进入 APK；OPPO 服务端 MasterSecret/AppServerSecret、极光 MasterSecret、其他厂商服务端密钥不能进入上述 JSON。构建脚本会拒绝未知字段/不完整配置、自动补齐 OP-/MZ- 前缀。本地可保存为已忽略的 `config/jpush-android.json`。

4. 华为通道还需要把 AppGallery Connect 的 `agconnect-services.json` 完整内容保存为 Actions Secret **AGCONNECT_SERVICES_JSON**；本地路径 `config/agconnect-services.json`。启用 `huawei: true` 而缺少该文件会明确构建失败。其他厂商不依赖该文件。
5. 重跑 CI，安装生成 APK。APK 不会自动初始化国内推送；用户在“我们 → 聊天通知”开启通知、同意页面所述设备标识用途并授予通知权限后才注册。没有配置的 APK 会明确提示不可用，不能用它验证真机消息。

### 配置 Docker 服务端

`.env` 增加以下变量，然后 `docker compose up -d --build love`：

```dotenv
JPUSH_APP_KEY=与APK一致的极光AppKey
JPUSH_MASTER_SECRET=极光MasterSecret
JPUSH_THIRD_PARTY_CHANNEL='{"xiaomi":{"channel_id":"已审核的聊天频道","mi_template_id":"私信模板ID","mi_template_param":"{\"app_name\":\"Love\"}"},"oppo":{"channel_id":"已审核的聊天频道"},"vivo":{"classification":1,"category":"IM"}}'
```

**以上 channel/template/category 是结构示例，必须使用各厂商审核通过的真实值**，不能直接照抄中文示例或擅自宣称消息类别。华为/荣耀的分类、OPPO 私信模板等参数也可通过 `JPUSH_THIRD_PARTY_CHANNEL` 的对应厂商字段配置；接口按极光 `options.third_party_channel` 结构原样传递。通知正文固定为“你的人给你发来了一条消息”，不会上传聊天正文或附件。项目不申请定位、电话状态、查询所有应用、外部存储权限。

客户端仅将极光 Registration ID 注册到自己的服务器；服务端以 Basic 鉴权调用固定的 `https://api.jpush.cn/v3/push`，并设置六家厂商 `first_ospush` 策略。同时配置 FCM 与国内推送时，客户端优先国内通道，每台安装只保留一个当前注册令牌，不同时发两份通知。国内通道运行时注册失败会提示错误，不静默降级到在中国可能不可达的 FCM。

管理员从独立管理地址 `/#admin` 查看“概览 → 运行状态”的提供者、设备数量和失败任务；日志中 `push.jpush.failed` / `push.fcm.failed` 表示发送失败，不记录密钥或通知令牌。任务最多尝试 5 次，已被服务商接受的设备在下一次重试不会再次发送，接受状态持久保存；网络超时造成“服务商已接受而本地未收到响应”的极端情况仍可能重复。极光 API 成功仅代表服务商接受，不能代替厂商送达回执。

### 真机验收

对每个已开通厂商分别测试：通知开启、双方配对 → 发消息 → 收件手机退到桌面/锁屏 → 划掉应用进程后再发 → 点击通知冷启动进入聊天 → 查看服务器存储的消息及已读 → 关闭通知/退出登录后不再收到。设备强制停止与划掉进程不同，Android 强制停止可能禁止任何通道，需重新打开应用。在极光控制台检查目标 RID 的厂商 token、推送记录和厂商错误码；“国内推送已连接”不等同于厂商 token 已注册，设置中只有收到厂商 token 回调才显示厂商注册状态。

正式使用必须固定 keystore，并将同一签名指纹配置到各厂商控制台；新 CI 调试包签名可能不同，不能拿旧签名凭据验证新包。没有真实厂商账户/凭据/设备时，本项目 CI 只验证 SDK 编译、Manifest/DEX、协议及应用流程，不能声称锁屏离线消息已经送达。

参考官方：[厂商 SDK 集成](https://docs.jiguang.cn/jpush/client/Android/android_3rd_guide)、[凭据申请](https://docs.jiguang.cn/jpush/client/Android/android_3rd_param)、[通知分类](https://docs.jiguang.cn/jpush/client/Android/android_channel_id)、[推送 API](https://docs.jiguang.cn/jpush/server/push/rest_api_v3_push)、[SDK 隐私说明](https://docs.jiguang.cn/jpush/practice/compliance)。
