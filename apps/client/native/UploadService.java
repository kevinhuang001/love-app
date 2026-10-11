package com.kevinhuang.love;
import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.net.*;
import android.os.*;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
public class UploadService extends Service {
 private static final int NOTIFICATION_ID=3,CHUNK=1048576;
 private static volatile UploadService instance;
 private volatile boolean stopping=false;
 private volatile HttpURLConnection connection;
 private Thread worker;
 private boolean runRequested=false;
 private PowerManager.WakeLock wake;
 static SharedPreferences preferences(Context c){return c.getSharedPreferences("love.uploads",MODE_PRIVATE);}
 static void start(Context c){Intent intent=new Intent(c,UploadService.class);if(Build.VERSION.SDK_INT>=26)c.startForegroundService(intent);else c.startService(intent);}
 static void stop(Context c){UploadService s=instance;if(s!=null){s.stopping=true;if(s.connection!=null)s.connection.disconnect();if(s.worker!=null)s.worker.interrupt();}c.stopService(new Intent(c,UploadService.class));}
 @Override public IBinder onBind(Intent i){return null;}
 private Notification notification(String text,int progress){
  PendingIntent open=PendingIntent.getActivity(this,3,new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("openUploads",true),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Notification.Builder builder=Build.VERSION.SDK_INT>=26 ? new Notification.Builder(this,"uploads") : new Notification.Builder(this);
  return builder.setSmallIcon(R.drawable.ic_stat_message).setContentTitle("Love · 正在上传").setContentText(text).setOngoing(true).setOnlyAlertOnce(true).setVisibility(Notification.VISIBILITY_PRIVATE).setContentIntent(open).setProgress(100,Math.max(0,progress),progress<0).build();
 }
 private void notifyProgress(String text,int progress){((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(NOTIFICATION_ID,notification(text,progress));}
 @Override public synchronized int onStartCommand(Intent intent,int flags,int startId){
  runRequested=true;
  instance=this;NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);if(Build.VERSION.SDK_INT>=26)nm.createNotificationChannel(new NotificationChannel("uploads","媒体上传进度",NotificationManager.IMPORTANCE_LOW));
  if(Build.VERSION.SDK_INT>=29)startForeground(NOTIFICATION_ID,notification("正在恢复上传任务",-1),ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);else startForeground(NOTIFICATION_ID,notification("正在恢复上传任务",-1));
  if(worker==null||!worker.isAlive()){
   stopping=false;wake=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,getPackageName()+":uploads");wake.acquire(6*60*60*1000L);
   worker=new Thread(this::runQueue,"love-upload-worker");worker.start();
  }return START_STICKY;
 }
 @Override public void onTimeout(int startId,int fgsType){stopping=true;if(connection!=null)connection.disconnect();if(worker!=null)worker.interrupt();try{UploadStore.pause(this,"系统暂停了后台上传，打开应用后继续");}catch(Exception ignored){}stopForeground(STOP_FOREGROUND_REMOVE);stopSelf();}
 @Override public void onDestroy(){stopping=true;if(connection!=null)connection.disconnect();if(worker!=null)worker.interrupt();if(wake!=null&&wake.isHeld())wake.release();if(instance==this)instance=null;super.onDestroy();}
 private static final class StatusError extends IOException {final int status;StatusError(int s,String m){super(m);status=s;}}
 private void check()throws InterruptedException{if(stopping||Thread.currentThread().isInterrupted())throw new InterruptedException();}
 private boolean cancelled(String scope,String id)throws Exception{check();JSONObject t=UploadStore.task(this,scope,id);return t==null||t.optBoolean("cancelRequested");}
 private JSONObject http(String scope,String id,String method,String path,byte[] body,String mime,String digest)throws Exception{
  for(int attempt=0;attempt<12;attempt++){
   check();while(!online()){UploadStore.patch(this,scope,id,new JSONObject().put("status","retrying").put("error","等待网络连接"));notifyProgress("等待网络连接",-1);Thread.sleep(2000);check();}
   SharedPreferences prefs=preferences(this);String token=prefs.getString("token","");if(!scope.equals(prefs.getString("scope",""))||token.isEmpty())throw new InterruptedException();
   try{
    HttpURLConnection c=(HttpURLConnection)new URL(prefs.getString("server","")+path).openConnection();connection=c;
    try{
     c.setInstanceFollowRedirects(false);c.setRequestMethod(method);c.setConnectTimeout(30000);c.setReadTimeout(path.endsWith("/complete")?15*60*1000:60000);c.setRequestProperty("Authorization","Bearer "+token);
     if(digest!=null)c.setRequestProperty("X-Chunk-Sha256",digest);
     if(body!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type",mime);c.setFixedLengthStreamingMode(body.length);try(OutputStream out=c.getOutputStream()){out.write(body);}}
     int status=c.getResponseCode();InputStream stream=status<400?c.getInputStream():c.getErrorStream();String text="";
     if(stream!=null)try(InputStream input=stream;ByteArrayOutputStream output=new ByteArrayOutputStream()){byte[] buffer=new byte[8192];int n;while((n=input.read(buffer))!=-1){if(output.size()+n>1024*1024)throw new IOException("服务器响应过大");output.write(buffer,0,n);}text=output.toString(StandardCharsets.UTF_8.name());}
     JSONObject result=text.isEmpty()?new JSONObject():new JSONObject(text);
     if(status<200||status>=300)throw new StatusError(status,result.optString("error","服务器返回 "+status));return result;
    }finally{c.disconnect();connection=null;}
   }catch(StatusError error){if(error.status!=408&&error.status!=429&&error.status<500)throw error;if(attempt==11)throw error;retry(scope,id,attempt,error.getMessage());}
   catch(IOException error){if(attempt==11)throw error;retry(scope,id,attempt,"连接服务器失败，正在重试");}
  }throw new IOException("上传重试次数已用尽");
 }
 private boolean online(){ConnectivityManager manager=(ConnectivityManager)getSystemService(CONNECTIVITY_SERVICE);NetworkCapabilities capabilities=manager.getNetworkCapabilities(manager.getActiveNetwork());return capabilities!=null&&capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);}
 private void retry(String scope,String id,int attempt,String message)throws Exception{check();UploadStore.patch(this,scope,id,new JSONObject().put("status","retrying").put("attempt",attempt+1).put("error",message));notifyProgress("等待重试 · "+(attempt+1),-1);Thread.sleep(Math.min(1000L*(1L<<attempt),30000L));}
 private byte[] json(JSONObject data){return data.toString().getBytes(StandardCharsets.UTF_8);}
 private String digest(byte[] bytes)throws Exception{StringBuilder result=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(bytes))result.append(String.format(java.util.Locale.ROOT,"%02x",b&255));return result.toString();}
 private void done(String scope,String id,JSONObject result,long total)throws Exception{
  UploadStore.patch(this,scope,id,new JSONObject().put("status","done").put("progress",100).put("bytes",total).put("result",result).put("error",JSONObject.NULL).put("cancelRequested",false));UploadStore.releasePermissions(this,UploadStore.task(this,scope,id));UploadStore.removeFiles(this,id);
 }
 private void cancel(String scope,String id,long total)throws Exception{
  try{JSONObject state=http(scope,id,"GET","/api/uploads/"+id,null,null,null);if(state.has("result")){done(scope,id,state.getJSONObject("result"),total);return;}http(scope,id,"DELETE","/api/uploads/"+id,null,null,null);}
  catch(StatusError error){if(error.status==409){JSONObject state=http(scope,id,"GET","/api/uploads/"+id,null,null,null);if(state.has("result")){done(scope,id,state.getJSONObject("result"),total);return;}throw error;}if(error.status!=404&&error.status!=410)throw error;}
  UploadStore.patch(this,scope,id,new JSONObject().put("status","cancelled").put("error",JSONObject.NULL));UploadStore.releasePermissions(this,UploadStore.task(this,scope,id));UploadStore.removeFiles(this,id);
 }
 private void transfer(JSONObject task)throws Exception{
  String scope=task.getString("scope"),id=task.getString("id");long total=task.getLong("total");JSONObject spec=task.getJSONObject("spec");JSONArray files=spec.getJSONArray("files"),uris=task.getJSONArray("uris");
  if(cancelled(scope,id)){cancel(scope,id,total);return;}
  JSONObject state=http(scope,id,"POST","/api/uploads",json(spec),"application/json",null);
  if(state.has("result")){done(scope,id,state.getJSONObject("result"),total);return;}
  File directory=UploadStore.directory(this,id);directory.mkdirs();
  for(int part=0;part<files.length();part++){
   File local=new File(directory,"file-"+part);long expected=files.getJSONObject(part).getLong("size");if(local.isFile()&&local.length()==expected)continue;
   UploadStore.patch(this,scope,id,new JSONObject().put("status","preparing").put("error",JSONObject.NULL));notifyProgress("正在保存本地文件",-1);
   File temp=new File(directory,"file-"+part+".tmp");
   try(InputStream in=getContentResolver().openInputStream(Uri.parse(uris.getString(part)));FileOutputStream out=new FileOutputStream(temp)){
    if(in==null)throw new IOException("无法读取原文件，请重新选择");long copied=0;byte[] buffer=new byte[CHUNK];int n;
    while((n=in.read(buffer))!=-1){check();if(cancelled(scope,id)){temp.delete();cancel(scope,id,total);return;}copied+=n;if(copied>expected)throw new IOException("原文件大小已改变，请重新选择");out.write(buffer,0,n);}
    if(copied!=expected)throw new IOException("原文件不完整，请重新选择");out.getFD().sync();
   }
   if(!temp.renameTo(local))throw new IOException("无法保存上传文件，请检查设备空间");
  }
  JSONArray offsets=state.getJSONArray("offsets");long bytes=0;for(int p=0;p<offsets.length();p++)bytes+=offsets.getLong(p);
  for(int part=0;part<files.length();part++){
   File local=new File(directory,"file-"+part);long offset=offsets.getLong(part),size=files.getJSONObject(part).getLong("size");
   try(RandomAccessFile input=new RandomAccessFile(local,"r")){
    input.seek(offset);
    while(offset<size){check();if(cancelled(scope,id)){cancel(scope,id,total);return;}byte[] chunk=new byte[(int)Math.min(CHUNK,size-offset)];input.readFully(chunk);
     UploadStore.patch(this,scope,id,new JSONObject().put("status","uploading").put("error",JSONObject.NULL));
     http(scope,id,"PUT","/api/uploads/"+id+"/"+part+"/"+(offset/CHUNK),chunk,"application/octet-stream",digest(chunk));offset+=chunk.length;bytes+=chunk.length;int progress=(int)(bytes*100/total);
     UploadStore.patch(this,scope,id,new JSONObject().put("bytes",bytes).put("progress",progress));notifyProgress(progress+"% · "+(bytes/1024/1024)+" / "+(total/1024/1024)+" MB",progress);
    }
   }
  }
  if(cancelled(scope,id)){cancel(scope,id,total);return;}
  UploadStore.patch(this,scope,id,new JSONObject().put("status","processing").put("progress",100).put("error",JSONObject.NULL));notifyProgress("正在处理并保存",-1);
  done(scope,id,http(scope,id,"POST","/api/uploads/"+id+"/complete",json(new JSONObject()),"application/json",null),total);
 }
 private void finishWorker(){if(wake!=null&&wake.isHeld())wake.release();worker=null;stopForeground(STOP_FOREGROUND_REMOVE);stopSelf();}
 private void runQueue(){
  try{
   while(!stopping){synchronized(this){runRequested=false;}String scope=preferences(this).getString("scope","");if(preferences(this).getString("token","").isEmpty())break;JSONObject next=null;
    JSONArray tasks=UploadStore.read(this);for(int i=0;i<tasks.length();i++){JSONObject t=tasks.getJSONObject(i);if(scope.equals(t.optString("scope"))&&UploadStore.active(t)){next=t;break;}}
    if(next==null){synchronized(this){if(runRequested)continue;finishWorker();return;}}
    try{transfer(next);}catch(InterruptedException stopped){throw stopped;}catch(Exception error){check();UploadStore.patch(this,scope,next.getString("id"),new JSONObject().put("status","failed").put("error",error.getMessage()==null?"上传失败，请重试":error.getMessage()));}
   }
  }catch(InterruptedException stopped){/* Explicit stop/timeout persists state in the caller. */}
  catch(Exception error){try{UploadStore.pause(this,"无法读取上传任务，请检查设备存储");}catch(Exception ignored){}}
  finally{synchronized(this){if(worker==Thread.currentThread())finishWorker();}}
 }
}
