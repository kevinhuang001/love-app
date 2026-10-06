package com.kevinhuang.love;
import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.os.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.json.JSONObject;
public class LocalNotificationService extends Service {
 public static volatile boolean foreground=false,connected=false;
 private volatile int generation=0;
 private volatile HttpURLConnection connection;
 private Thread worker;
 private String identity="",session="";
 static SharedPreferences preferences(Context c) { return c.getSharedPreferences("love.local-notifications",MODE_PRIVATE); }
 static void disable(Context c) {
  preferences(c).edit().remove("enabled").apply(); c.stopService(new Intent(c,LocalNotificationService.class));
  ((NotificationManager)c.getSystemService(NOTIFICATION_SERVICE)).cancelAll();
 }
 @Override public IBinder onBind(Intent intent) { return null; }
 private PendingIntent open(boolean chat) {
  Intent intent=new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("openChat",chat);
  return PendingIntent.getActivity(this,chat?1:0,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
 }
 private Notification statusNotification(String text) {
  Intent stop=new Intent(this,LocalNotificationService.class).setAction("stop");
  return new Notification.Builder(this,"connection").setSmallIcon(R.drawable.ic_stat_message).setContentTitle("Love · 本地通知").setContentText(text).setOngoing(true).setContentIntent(open(false))
   .addAction(new Notification.Action.Builder(null,"停止接收",PendingIntent.getService(this,2,stop,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE)).build()).build();
 }
 private void showStatus(String text) { ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(1,statusNotification(text)); }
 @Override public int onStartCommand(Intent intent,int flags,int startId) {
  if(intent==null || "stop".equals(intent.getAction())) { disable(this); return START_NOT_STICKY; }
  String server=intent.getStringExtra("server"),token=intent.getStringExtra("token"),user=intent.getStringExtra("user"),couple=intent.getStringExtra("couple");
  if(server==null || token==null || user==null || couple==null) { stopSelf(); return START_NOT_STICKY; }
  NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
  manager.createNotificationChannel(new NotificationChannel("connection","后台消息连接",NotificationManager.IMPORTANCE_LOW));
  manager.createNotificationChannel(new NotificationChannel("messages","聊天消息",NotificationManager.IMPORTANCE_HIGH));
  if(Build.VERSION.SDK_INT>=34) startForeground(1,statusNotification("正在连接你的服务器"),ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
  else startForeground(1,statusNotification("正在连接你的服务器"));
  String key;
  try {
   byte[] digest=MessageDigest.getInstance("SHA-256").digest((server+"|"+user+"|"+couple).getBytes(StandardCharsets.UTF_8));
   StringBuilder hex=new StringBuilder(); for(byte b:digest) hex.append(String.format("%02x",b)); key=hex.toString();
  } catch(Exception error) { stopSelf(); return START_NOT_STICKY; }
  preferences(this).edit().putBoolean("enabled",true).apply();
  if(identity.equals(key) && session.equals(token) && worker!=null && worker.isAlive()) { showStatus(connected?"正在接收聊天消息":"断线重连中"); return START_NOT_STICKY; }
  stopWorker(); identity=key; session=token;
  final int run=generation; final String cursorKey="cursor."+key;
  worker=new Thread(()->listen(run,server,token,couple,cursorKey),"love-message-stream"); worker.start(); return START_NOT_STICKY;
 }
 private void listen(int run,String server,String token,String couple,String cursorKey) {
  long retry=1000;
  while(run==generation) {
   HttpURLConnection local=null;
   try {
    SharedPreferences prefs=preferences(this); String suffix=prefs.contains(cursorKey)?"?after="+prefs.getLong(cursorKey,0):"";
    local=(HttpURLConnection)new URL(server+"/api/notifications/stream"+suffix).openConnection(); connection=local;
    local.setInstanceFollowRedirects(false); local.setConnectTimeout(15000); local.setReadTimeout(45000);
    local.setRequestProperty("Authorization","Bearer "+token); local.setRequestProperty("Accept","text/event-stream");
    int status=local.getResponseCode();
    if(status==401 || status==403 || status==409) { if(run==generation) disable(this); return; }
    if(status!=200) throw new IOException(); if(run!=generation) return;
    connected=true; showStatus("正在接收聊天消息"); retry=1000;
    try(BufferedReader reader=new BufferedReader(new InputStreamReader(local.getInputStream(),StandardCharsets.UTF_8))) {
     String line,event="",data="";
     while(run==generation && (line=reader.readLine())!=null) {
      if(line.length()>8192) throw new IOException();
      if(line.startsWith("event: ")) event=line.substring(7);
      else if(line.startsWith("data: ")) data=line.substring(6);
      else if(line.isEmpty() && !data.isEmpty()) {
       JSONObject payload=new JSONObject(data);
       if("stop".equals(event) || ("ready".equals(event) && !couple.equals(payload.optString("coupleId")))) { if(run==generation) disable(this); return; }
       long cursor=payload.optLong("messageId",payload.optLong("cursor",0)),previous=prefs.getLong(cursorKey,-1);
       if(cursor>previous) {
        prefs.edit().putLong(cursorKey,cursor).apply();
        if("message".equals(event) && !foreground && run==generation) {
         Notification notification=new Notification.Builder(this,"messages").setSmallIcon(R.drawable.ic_stat_message).setContentTitle("Love · 新消息").setContentText("你的人给你发来了一条消息")
          .setVisibility(Notification.VISIBILITY_PRIVATE).setAutoCancel(true).setContentIntent(open(true)).build();
         ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify("message-"+cursor,2,notification);
        }
       }
       event="";data="";
      }
     }
    }
   } catch(Exception ignored) {
    // Never log session credentials or message content.
   } finally {
    if(local!=null) local.disconnect();
    if(run==generation) { connected=false; if(preferences(this).getBoolean("enabled",false)) showStatus("断线重连中 · 恢复网络后继续接收"); }
   }
   if(run!=generation) return;
   try { Thread.sleep(retry); } catch(InterruptedException stop) { return; } retry=Math.min(30000,retry*2);
  }
 }
 private void stopWorker() {
  generation++; connected=false;
  HttpURLConnection retiring=connection; connection=null;
  if(worker!=null) worker.interrupt();
  // A socket close can wait on an active read; never block Android's main thread.
  if(retiring!=null) new Thread(retiring::disconnect,"love-stream-close").start();
 }
 @Override public void onDestroy() { stopWorker(); super.onDestroy(); }
}
