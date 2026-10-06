package com.kevinhuang.love;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import cn.jpush.android.api.JPushInterface;
import java.lang.ref.WeakReference;

@CapacitorPlugin(name = "ChinaPush", permissions = {
    @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
})
public class ChinaPushPlugin extends Plugin {
    private static WeakReference<ChinaPushPlugin> active = new WeakReference<>(null);
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean running = false;
    private PluginCall pending;
    private int polls = 0;
    @Override public void load() { active = new WeakReference<>(this); }
    @PluginMethod public void status(PluginCall call) {
        JSObject status = new JSObject();
        status.put("manufacturer", Build.MANUFACTURER);
        status.put("vendor", getContext().getSharedPreferences("love-push", Context.MODE_PRIVATE).getString("vendor", ""));
        call.resolve(status);
    }
    @PluginMethod public void register(PluginCall call) {
        if (!getContext().getResources().getBoolean(R.bool.china_push_configured)) {
            call.reject("此 APK 尚未配置国内推送 AppKey"); return;
        }
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED)
            requestPermissionForAlias("notifications", call, "notificationPermission");
        else start(call);
    }
    @PermissionCallback private void notificationPermission(PluginCall call) {
        if (getPermissionState("notifications") == PermissionState.GRANTED) start(call);
        else call.reject("请在系统设置中允许通知");
    }
    private void start(PluginCall call) {
        NotificationManager manager = getContext().getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26) {
        NotificationChannel channel = new NotificationChannel("messages", "聊天消息", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("另一半的新消息");
        channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PRIVATE);
        manager.createNotificationChannel(channel);
        }
        getContext().getSharedPreferences("love-push", Context.MODE_PRIVATE).edit().putBoolean("enabled", true).apply();
        running = true;
        JPushInterface.setDebugMode(false);
        JPushInterface.init(getContext());
        JPushInterface.resumePush(getContext());
        if (pending != null) pending.reject("推送注册已被新的请求替代");
        pending = call; polls = 0;
        handler.removeCallbacks(poll); handler.post(poll);
    }
    private final Runnable poll = new Runnable() {
        @Override public void run() {
            if (!running || pending == null) return;
            String token = JPushInterface.getRegistrationID(getContext());
            if (token != null && !token.isEmpty()) {
                JSObject data = new JSObject(); data.put("token", token);
                pending.resolve(data); pending = null;
            } else if (++polls >= 60) {
                pending.reject("国内推送注册超时，请检查网络与 AppKey"); pending = null;
            } else handler.postDelayed(this, 500);
        }
    };
    @PluginMethod public void unregister(PluginCall call) {
        boolean wasEnabled = getContext().getSharedPreferences("love-push", Context.MODE_PRIVATE).getBoolean("enabled", false);
        getContext().getSharedPreferences("love-push", Context.MODE_PRIVATE).edit().putBoolean("enabled", false).apply();
        running = false; handler.removeCallbacks(poll);
        if (pending != null) { pending.reject("推送已关闭"); pending = null; }
        if (wasEnabled) { JPushInterface.stopPush(getContext()); JPushInterface.clearAllNotifications(getContext()); }
        call.resolve();
    }
    @PluginMethod public void consumeOpen(PluginCall call) {
        var prefs = getContext().getSharedPreferences("love-push", Context.MODE_PRIVATE);
        JSObject data = new JSObject(); data.put("opened", prefs.getBoolean("openChat", false));
        prefs.edit().remove("openChat").apply(); call.resolve(data);
    }
    static void registered(String token) {
        ChinaPushPlugin plugin = active.get();
        if (plugin == null || !plugin.running || token == null || token.isEmpty()) return;
        JSObject data = new JSObject(); data.put("token", token);
        plugin.notifyListeners("registration", data);
    }
    @Override protected void handleOnNewIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra("loveOpenChat", false)) {
            getContext().getSharedPreferences("love-push", Context.MODE_PRIVATE).edit().remove("openChat").apply();
            notifyListeners("openChat", new JSObject(), true);
        }
    }
    @Override protected void handleOnDestroy() {
        handler.removeCallbacks(poll);
        if (pending != null) { pending.reject("页面已关闭"); pending = null; }
        active.clear();
    }
}
