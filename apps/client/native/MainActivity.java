package com.kevinhuang.love;
import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 private static boolean openChat=false,openUploads=false;
 static synchronized boolean consumeUploads(){boolean value=openUploads;openUploads=false;return value;}
 static synchronized boolean consumeChat() { boolean value=openChat; openChat=false; return value; }
 private void capture(Intent intent) { if(intent!=null && intent.getBooleanExtra("openUploads",false)){openUploads=true;intent.removeExtra("openUploads");} if(intent!=null && intent.getBooleanExtra("openChat",false)) { openChat=true; intent.removeExtra("openChat"); } }
 @Override public void onCreate(Bundle state) { capture(getIntent()); registerPlugin(LocalNotificationsPlugin.class); registerPlugin(AppUpdatesPlugin.class); registerPlugin(BackgroundUploadsPlugin.class); super.onCreate(state); }
 @Override protected void onNewIntent(Intent intent) { capture(intent); super.onNewIntent(intent); }
 @Override public void onResume() { LocalNotificationService.foreground=true; super.onResume(); }
 @Override public void onPause() { LocalNotificationService.foreground=false; super.onPause(); }
}
