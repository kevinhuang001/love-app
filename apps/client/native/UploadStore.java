package com.kevinhuang.love;
import android.content.Context;
import android.content.Intent;
import android.util.AtomicFile;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
// One private, atomic journal owns task state. Files are retained until commit/cancel is confirmed.
final class UploadStore {
 static File root(Context c) { File f=new File(c.getFilesDir(),"uploads");f.mkdirs();return f; }
 static synchronized JSONArray read(Context c) throws Exception {
  AtomicFile file=new AtomicFile(new File(root(c),"tasks.json"));
  try { return new JSONArray(new String(file.readFully(),StandardCharsets.UTF_8)); } catch(FileNotFoundException missing) {return new JSONArray();}
 }
 static synchronized void write(Context c,JSONArray tasks) throws Exception {
  AtomicFile file=new AtomicFile(new File(root(c),"tasks.json"));FileOutputStream out=file.startWrite();
  try {out.write(tasks.toString().getBytes(StandardCharsets.UTF_8));file.finishWrite(out);} catch(Exception error) {file.failWrite(out);throw error;}
 }
 static synchronized JSONObject task(Context c,String scope,String id) throws Exception {
  JSONArray tasks=read(c);for(int i=0;i<tasks.length();i++){JSONObject t=tasks.getJSONObject(i);if(scope.equals(t.optString("scope"))&&id.equals(t.optString("id")))return t;}return null;
 }
 static synchronized void patch(Context c,String scope,String id,JSONObject changes) throws Exception {
  JSONArray tasks=read(c);for(int i=0;i<tasks.length();i++){JSONObject t=tasks.getJSONObject(i);if(scope.equals(t.optString("scope"))&&id.equals(t.optString("id"))){for(java.util.Iterator<String> keys=changes.keys();keys.hasNext();){String key=keys.next();if(changes.isNull(key))t.remove(key);else t.put(key,changes.get(key));}t.put("updated",System.currentTimeMillis());}}write(c,tasks);BackgroundUploadsPlugin.changed();
 }
 static synchronized boolean progress(Context c,String scope,String id,JSONObject changes)throws Exception {JSONObject t=task(c,scope,id);if(t==null||t.optBoolean("cancelRequested")||!t.optString("status").equals("processing"))return false;patch(c,scope,id,changes);return true;}
 static boolean active(JSONObject t) {String s=t.optString("status");return !(s.equals("done")||s.equals("failed")||s.equals("cancelled")||s.equals("paused"));}
 static synchronized void pause(Context c,String message) throws Exception {
  JSONArray tasks=read(c);for(int i=0;i<tasks.length();i++){JSONObject t=tasks.getJSONObject(i);if(active(t))t.put("status","paused").put("error",message);}write(c,tasks);BackgroundUploadsPlugin.changed();
 }
 static File directory(Context c,String id) {
  if(!id.matches("[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}"))throw new IllegalArgumentException("无效任务编号");return new File(root(c),id);
 }
 static void releasePermissions(Context c,JSONObject completed) {
  try {JSONArray uris=completed.getJSONArray("uris"),tasks=read(c);
   for(int part=0;part<uris.length();part++) {String uri=uris.getString(part);boolean needed=false;
    for(int i=0;i<tasks.length();i++) {JSONObject t=tasks.getJSONObject(i);if(t.optString("id").equals(completed.optString("id"))||t.optString("status").equals("done")||t.optString("status").equals("cancelled"))continue;JSONArray used=t.getJSONArray("uris"),files=t.getJSONObject("spec").getJSONArray("files");for(int p=0;p<used.length();p++)if(uri.equals(used.getString(p))){File cached=new File(directory(c,t.getString("id")),"file-"+p);if(!cached.isFile()||cached.length()!=files.getJSONObject(p).getLong("size"))needed=true;}}
    if(!needed)try{c.getContentResolver().releasePersistableUriPermission(android.net.Uri.parse(uri),Intent.FLAG_GRANT_READ_URI_PERMISSION);}catch(SecurityException ignored){}
   }
  }catch(Exception ignored){}
 }
 static void removeFiles(Context c,String id) {File d=directory(c,id);File[] files=d.listFiles();if(files!=null)for(File f:files)f.delete();d.delete();}
}
