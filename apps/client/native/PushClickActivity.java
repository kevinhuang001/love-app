package com.kevinhuang.love;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

// Vendor notifications can start this activity without a live WebView.
public class PushClickActivity extends Activity {
    static void open(Context context) {
        context.getSharedPreferences("love-push", Context.MODE_PRIVATE).edit().putBoolean("openChat", true).apply();
        Intent launch = new Intent(context, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launch.putExtra("loveOpenChat", true);
        context.startActivity(launch);
    }
    @Override public void onCreate(Bundle state) { super.onCreate(state); open(this); finish(); }
}
