package com.kevinhuang.love;
import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import java.net.URI;
@CapacitorPlugin(name="LocalNotifications", permissions={@Permission(alias="notifications", strings={Manifest.permission.POST_NOTIFICATIONS})})
public class LocalNotificationsPlugin extends Plugin {
 private final java.util.concurrent.atomic.AtomicInteger activation=new java.util.concurrent.atomic.AtomicInteger();
 @PluginMethod public void start(PluginCall call) {
  call.getData().put("activation",activation.incrementAndGet());
  if(Build.VERSION.SDK_INT>=33 && getPermissionState("notifications")!=PermissionState.GRANTED) { requestPermissionForAlias("notifications",call,"permissionResult"); return; }
  begin(call);
 }
 @PermissionCallback private void permissionResult(PluginCall call) {
  if(getPermissionState("notifications")!=PermissionState.GRANTED) { call.reject("请在系统设置中允许通知"); return; } begin(call);
 }
 private void begin(PluginCall call) {
  if(call.getInt("activation",-1)!=activation.get()) { call.reject("通知操作已取消"); return; }
  try {
   String server=call.getString("server",""), token=call.getString("token",""), user=call.getString("userId",""), couple=call.getString("coupleId","");
   URI uri=new URI(server);
   if(!("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) || uri.getHost()==null || uri.getUserInfo()!=null || uri.getQuery()!=null || uri.getFragment()!=null || !(uri.getPath().isEmpty() || "/".equals(uri.getPath())) || token.isEmpty() || user.isEmpty() || couple.isEmpty()) throw new IllegalArgumentException();
   Intent intent=new Intent(getContext(),LocalNotificationService.class);
   intent.putExtra("server",server).putExtra("token",token).putExtra("user",user).putExtra("couple",couple);
   getContext().startForegroundService(intent); call.resolve();
  } catch(Exception error) { call.reject("无法启动本地通知，请检查服务器地址和配对状态"); }
 }
 @PluginMethod public void stop(PluginCall call) { activation.incrementAndGet(); LocalNotificationService.disable(getContext()); call.resolve(); }
 @PluginMethod public void status(PluginCall call) {
  JSObject result=new JSObject(); result.put("enabled",LocalNotificationService.preferences(getContext()).getBoolean("enabled",false)); result.put("connected",LocalNotificationService.connected);
  PowerManager power=(PowerManager)getContext().getSystemService(android.content.Context.POWER_SERVICE);
  result.put("batteryExempt",power.isIgnoringBatteryOptimizations(getContext().getPackageName())); call.resolve(result);
 }
 @PluginMethod public void batterySettings(PluginCall call) { getActivity().startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+getContext().getPackageName()))); call.resolve(); }
 @PluginMethod public void consumeOpen(PluginCall call) { JSObject result=new JSObject(); result.put("opened",MainActivity.consumeChat()); call.resolve(result); }
 @Override protected void handleOnResume() { if(MainActivity.consumeChat()) notifyListeners("openChat",new JSObject(),true); }
}
