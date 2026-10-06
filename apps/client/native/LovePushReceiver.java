package com.kevinhuang.love;

import android.content.Context;
import cn.jpush.android.service.JPushMessageReceiver;
import cn.jpush.android.api.NotificationMessage;
import cn.jpush.android.api.CmdMessage;

public class LovePushReceiver extends JPushMessageReceiver {
    @Override public void onRegister(Context context, String registrationId) {
        ChinaPushPlugin.registered(registrationId);
    }
    @Override public void onNotifyMessageOpened(Context context, NotificationMessage message) {
        PushClickActivity.open(context);
    }
    @Override public void onCommandResult(Context context, CmdMessage message) {
        if (message == null || message.cmd != 10000 || message.extra == null) return;
        String token = message.extra.getString("ttoken");
        if (token == null || token.isEmpty()) return;
        String vendor;
        switch (message.extra.getInt("platform")) {
            case 1: vendor = "小米"; break;
            case 2: vendor = "华为"; break;
            case 3: vendor = "魅族"; break;
            case 4: vendor = "OPPO"; break;
            case 5: vendor = "vivo"; break;
            case 7: vendor = "荣耀"; break;
            default: return;
        }
        context.getSharedPreferences("love-push", Context.MODE_PRIVATE).edit().putString("vendor", vendor).apply();
    }
}
