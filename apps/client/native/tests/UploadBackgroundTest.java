package com.kevinhuang.love;
import static org.junit.Assert.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.core.content.FileProvider;
import android.app.Instrumentation;
import android.content.*;
import android.net.Uri;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
@RunWith(AndroidJUnit4.class)
public class UploadBackgroundTest {
 static void foreground(Instrumentation instrument,Context context,Intent activity)throws Exception {
  // singleTask resumes an existing Activity; startActivitySync waits for a new launch.
  instrument.runOnMainSync(()->context.startActivity(activity));
  long limit=System.currentTimeMillis()+15000;while(!LocalNotificationService.foreground&&System.currentTimeMillis()<limit)Thread.sleep(50);
  assertTrue("activity resumed before starting the foreground service",LocalNotificationService.foreground);
 }
 @Test public void uploadsAfterHomeAndResumesWithoutDuplicatingCommit()throws Exception {
  Instrumentation instrument=InstrumentationRegistry.getInstrumentation();Context context=instrument.getTargetContext();
  Intent gallery=BackgroundUploadsPlugin.pickerIntent(context,true,false),avatarPicker=BackgroundUploadsPlugin.pickerIntent(context,false,true);
  assertEquals("media selection opens the gallery Photo Picker",android.provider.MediaStore.ACTION_PICK_IMAGES,gallery.getAction());
  assertNull("gallery allows both photos and videos",gallery.getType());
  assertNotNull(context.getPackageManager().resolveActivity(gallery,0));
  assertEquals(android.provider.MediaStore.ACTION_PICK_IMAGES,avatarPicker.getAction());assertEquals("image/*",avatarPicker.getType());
  Intent activity=new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);foreground(instrument,context,activity);
  byte[] original=new byte[2*1048576+113];for(int i=0;i<original.length;i++)original[i]=(byte)(i%251);
  File source=new File(context.getCacheDir(),"background-upload-fixture.jpg");try(FileOutputStream out=new FileOutputStream(source)){out.write(original);out.getFD().sync();}
  Uri uri=FileProvider.getUriForFile(context,context.getPackageName()+".fileprovider",source);
  try(FixtureServer server=new FixtureServer(original)){
   String scope="background-test",id=UUID.randomUUID().toString();long now=System.currentTimeMillis();
   JSONObject spec=new JSONObject().put("id",id).put("target","album").put("title","").put("files",new JSONArray().put(new JSONObject().put("name","background.jpg").put("type","image/jpeg").put("size",original.length)));
   JSONObject task=new JSONObject().put("scope",scope).put("id",id).put("spec",spec).put("uris",new JSONArray().put(uri.toString())).put("status","queued").put("name","background.jpg").put("target","album").put("total",original.length).put("bytes",0).put("progress",0).put("created",now).put("updated",now);
   UploadService.preferences(context).edit().putString("scope",scope).putString("token","fixture-token").putString("server","http://127.0.0.1:"+server.port()).commit();UploadStore.write(context,new JSONArray().put(task));
   UploadService.start(context);instrument.getUiAutomation().executeShellCommand("input keyevent 3").close();
   long limit=System.currentTimeMillis()+15000;while(server.chunks<1&&System.currentTimeMillis()<limit)Thread.sleep(50);assertTrue("service sent a chunk after Home",server.chunks>=1);assertFalse("activity is backgrounded",LocalNotificationService.foreground);
   UploadService.stop(context);Thread.sleep(500);JSONObject persisted=UploadStore.task(context,scope,id);assertNotNull(persisted);assertTrue("private input copy survives service restart",new File(UploadStore.directory(context,id),"file-0").isFile());
   foreground(instrument,context,activity);UploadService.start(context);instrument.getUiAutomation().executeShellCommand("input keyevent 3").close();
   limit=System.currentTimeMillis()+40000;JSONObject result;
   do{Thread.sleep(100);result=UploadStore.task(context,scope,id);}while(!"done".equals(result.optString("status"))&&System.currentTimeMillis()<limit);
   assertEquals(result.toString(),"done",result.getString("status"));assertEquals(original.length,result.getLong("bytes"));assertEquals(100,result.getInt("progress"));assertEquals("lost commit response did not publish twice",1,server.commits);assertArrayEquals(original,server.received.toByteArray());assertFalse("local input removed only after confirmed completion",UploadStore.directory(context,id).exists());
   assertEquals("missing-date notice persists with native history","2026-10-11",UploadStore.task(context,scope,id).getJSONObject("result").getString("fallbackDate"));
  }finally{UploadService.stop(context);UploadService.preferences(context).edit().clear().commit();UploadStore.write(context,new JSONArray());source.delete();}
 }
 @Test public void databaseProgressAndCancellationCleanOneTask()throws Exception {
  Instrumentation instrument=InstrumentationRegistry.getInstrumentation();Context context=instrument.getTargetContext();Intent activity=new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);foreground(instrument,context,activity);
  byte[] original=new byte[2048];File source=new File(context.getCacheDir(),"cancel-upload-fixture.jpg");try(FileOutputStream out=new FileOutputStream(source)){out.write(original);}
  Uri uri=FileProvider.getUriForFile(context,context.getPackageName()+".fileprovider",source);String scope="cancel-test",id=UUID.randomUUID().toString();long now=System.currentTimeMillis();
  try(FixtureServer server=new FixtureServer(original,true)){
   JSONObject spec=new JSONObject().put("id",id).put("target","album").put("title","批次描述").put("files",new JSONArray().put(new JSONObject().put("name","cancel.jpg").put("type","image/jpeg").put("size",original.length)));
   JSONObject task=new JSONObject().put("scope",scope).put("id",id).put("spec",spec).put("uris",new JSONArray().put(uri.toString())).put("status","queued").put("name","cancel.jpg").put("target","album").put("total",original.length).put("bytes",0).put("progress",0).put("created",now).put("updated",now);
   UploadService.preferences(context).edit().putString("scope",scope).putString("token","fixture-token").putString("server","http://127.0.0.1:"+server.port()).commit();UploadStore.write(context,new JSONArray().put(task));UploadService.start(context);instrument.getUiAutomation().executeShellCommand("input keyevent 3").close();
   long limit=System.currentTimeMillis()+20000;JSONObject state;
   do{Thread.sleep(100);state=UploadStore.task(context,scope,id);}while(!"database".equals(state.optString("phase"))&&System.currentTimeMillis()<limit);
   assertEquals(state.toString(),"database",state.optString("phase"));assertEquals("postgres",state.optString("storage"));assertEquals(1024,state.getLong("databaseBytes"));assertEquals(2048,state.getLong("databaseTotal"));
   UploadStore.patch(context,scope,id,new JSONObject().put("cancelRequested",true).put("status","cancelling"));UploadService.cancelCurrent(scope,id);
   limit=System.currentTimeMillis()+20000;do{Thread.sleep(100);state=UploadStore.task(context,scope,id);}while(!"cancelled".equals(state.optString("status"))&&System.currentTimeMillis()<limit);
   assertEquals(state.toString(),"cancelled",state.optString("status"));assertTrue(server.cancelled);assertEquals(0,server.commits);assertEquals(0,server.received.size());assertFalse(UploadStore.directory(context,id).exists());
   assertFalse("late status reads cannot restore a cancelled task",UploadStore.progress(context,scope,id,new JSONObject().put("status","processing").put("phase","database")));
  }finally{UploadService.stop(context);UploadService.preferences(context).edit().clear().commit();UploadStore.write(context,new JSONArray());source.delete();}
 }
 static final class FixtureServer implements AutoCloseable {
  final ServerSocket listener;final Thread worker;final byte[] original;final ByteArrayOutputStream received=new ByteArrayOutputStream();volatile boolean closed=false;volatile int chunks=0,commits=0;boolean firstChunk=true,firstCommit=true;final boolean cancelMode;volatile boolean databasePhase=false,cancelled=false;
  FixtureServer(byte[] original)throws Exception {this(original,false);}
  FixtureServer(byte[] original,boolean cancelMode)throws Exception {this.cancelMode=cancelMode;this.original=original;listener=new ServerSocket(0,20,InetAddress.getByName("127.0.0.1"));worker=new Thread(this::serve);worker.start();}
  int port(){return listener.getLocalPort();}
  String line(InputStream in)throws Exception{ByteArrayOutputStream out=new ByteArrayOutputStream();int b;while((b=in.read())!=-1){if(b==10)break;if(b!=13)out.write(b);}return out.toString(StandardCharsets.UTF_8.name());}
  void serve(){while(!closed)try{Socket socket=listener.accept();new Thread(()->handle(socket)).start();}catch(IOException ignored){}}
  void handle(Socket accepted){try(Socket socket=accepted){
   socket.setSoTimeout(30000);InputStream in=socket.getInputStream();String[] request=line(in).split(" ");if(request.length<2)return;String method=request[0],path=request[1],header;int length=0;String hash="";
   while(!(header=line(in)).isEmpty()){int split=header.indexOf(':');if(split<0)continue;String name=header.substring(0,split).trim().toLowerCase(java.util.Locale.ROOT),value=header.substring(split+1).trim();if(name.equals("content-length"))length=Integer.parseInt(value);if(name.equals("x-chunk-sha256"))hash=value;}
   byte[] body=in.readNBytes(length);int status=200;JSONObject reply=new JSONObject();
   if(path.equals("/api/uploads"))reply.put("offsets",new JSONArray().put(received.size()));
   else if(method.equals("DELETE")){cancelled=true;received.reset();status=204;}
   else if(method.equals("GET")&&databasePhase){reply.put("phase","database").put("storage","postgres").put("databaseBytes",1024).put("databaseTotal",2048);}
   else if(method.equals("PUT")){
    if(firstChunk){firstChunk=false;status=503;reply.put("error","temporary database outage");}
    else{int index=Integer.parseInt(path.substring(path.lastIndexOf('/')+1));StringBuilder actual=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(body))actual.append(String.format(java.util.Locale.ROOT,"%02x",b&255));if(!hash.equals(actual.toString()))throw new Exception("chunk checksum mismatch");
     if(index*1048576==received.size()){received.write(body);chunks++;}Thread.sleep(700);reply.put("offsets",new JSONArray().put(received.size()));}
   }else if(path.endsWith("/complete")){if(cancelMode){databasePhase=true;while(!cancelled&&!closed)Thread.sleep(50);status=410;reply.put("error","cancelled");}else{if(commits==0)commits++;if(firstCommit){firstCommit=false;return;}}reply.put("id",path.split("/")[3]).put("kind","image").put("previewUrl","/fixture").put("thumbnailUrl","/fixture").put("capturedDate",JSONObject.NULL).put("fallbackDate","2026-10-11");}
   byte[] data=reply.toString().getBytes(StandardCharsets.UTF_8);OutputStream out=socket.getOutputStream();out.write(("HTTP/1.1 "+status+" OK\r\nContent-Type: application/json\r\nContent-Length: "+data.length+"\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.US_ASCII));out.write(data);out.flush();
  }catch(IOException disconnected){/* Restart deliberately disconnects an in-flight response. */}catch(Exception error){if(!closed)throw new RuntimeException(error);}}
  public void close()throws Exception{closed=true;listener.close();worker.join(2000);}
 }
}
