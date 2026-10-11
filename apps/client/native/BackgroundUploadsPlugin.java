package com.kevinhuang.love;
import android.app.Activity;
import android.content.*;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.PickVisualMediaRequest;
import androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia;
import androidx.activity.result.contract.ActivityResultContracts.PickMultipleVisualMedia;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import org.json.*;
import java.util.UUID;
@CapacitorPlugin(name="BackgroundUploads")
public class BackgroundUploadsPlugin extends Plugin {
 private static volatile BackgroundUploadsPlugin instance;
 @Override public void load(){instance=this;}
 static void changed(){BackgroundUploadsPlugin p=instance;if(p!=null)p.getActivity().runOnUiThread(()->p.notifyListeners("changed",new JSObject()));}
 @Override protected void handleOnDestroy(){if(instance==this)instance=null;}
 static Intent pickerIntent(Context context,boolean multiple,boolean imagesOnly){
  PickVisualMediaRequest request=new PickVisualMediaRequest.Builder().setMediaType(imagesOnly?PickVisualMedia.ImageOnly.INSTANCE:PickVisualMedia.ImageAndVideo.INSTANCE).build();
  int limit=android.os.Build.VERSION.SDK_INT>=33?Math.min(100,android.provider.MediaStore.getPickImagesMaxLimit()):100;
  return multiple?new PickMultipleVisualMedia(limit).createIntent(context,request):new PickVisualMedia().createIntent(context,request);
 }
 @PluginMethod public void pick(PluginCall call){
  startActivityForResult(call,pickerIntent(getContext(),call.getBoolean("multiple",true),call.getBoolean("imagesOnly",false)),"picked");
 }
 @ActivityCallback private void picked(PluginCall call,ActivityResult result){
  if(call==null)return;if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null){call.resolve(new JSObject().put("files",new JSArray()));return;}
  try{
   Intent data=result.getData();java.util.ArrayList<Uri> uris=new java.util.ArrayList<>();if(data.getClipData()!=null)for(int i=0;i<data.getClipData().getItemCount();i++)uris.add(data.getClipData().getItemAt(i).getUri());else if(data.getData()!=null)uris.add(data.getData());
   if(uris.size()>100)throw new Exception("一次最多选择 100 个文件");
   JSArray files=new JSArray();
   for(Uri uri:uris){
    getContext().getContentResolver().takePersistableUriPermission(uri,Intent.FLAG_GRANT_READ_URI_PERMISSION);
    String name="媒体";long size=-1;
    try(Cursor cursor=getContext().getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE},null,null,null)){if(cursor!=null&&cursor.moveToFirst()){name=cursor.getString(0);if(!cursor.isNull(1))size=cursor.getLong(1);}}
    if(size<=0)throw new Exception("请选择可读取大小的本地图片或视频");
    String type=getContext().getContentResolver().getType(uri);String extension=name.toLowerCase(java.util.Locale.ROOT);
    if(type==null||type.equals("application/octet-stream")){if(extension.endsWith(".mov"))type="video/quicktime";else if(extension.endsWith(".heic"))type="image/heic";else if(extension.endsWith(".heif"))type="image/heif";else type=java.net.URLConnection.guessContentTypeFromName(name);}
    files.put(new JSObject().put("uri",uri.toString()).put("name",name).put("size",size).put("type",type==null?"":type));
   }
   call.resolve(new JSObject().put("files",files));
  }catch(Exception error){call.reject(error.getMessage()==null?"无法读取文件":error.getMessage());}
 }
 @PluginMethod public void configure(PluginCall call){
  try{
   String scope=call.getString("scope",""),server=call.getString("server",""),token=call.getString("token","");java.net.URI uri=new java.net.URI(server);
   if(scope.isEmpty()||token.isEmpty()||uri.getHost()==null||uri.getUserInfo()!=null||!("https".equals(uri.getScheme())||"http".equals(uri.getScheme()))||!(uri.getPath().isEmpty()||uri.getPath().equals("/"))||uri.getQuery()!=null||uri.getFragment()!=null)throw new Exception();
   android.content.SharedPreferences prefs=UploadService.preferences(getContext());
   if(!scope.equals(prefs.getString("scope",""))){UploadService.stop(getContext());UploadStore.pause(getContext(),"账号或配对状态已改变");}
   prefs.edit().putString("scope",scope).putString("server",server).putString("token",token).commit();
   boolean pending=false;synchronized(UploadStore.class){JSONArray tasks=UploadStore.read(getContext());for(int i=0;i<tasks.length();i++){JSONObject t=tasks.getJSONObject(i);if(scope.equals(t.optString("scope"))){if("paused".equals(t.optString("status")))t.put("status","queued").remove("error");if(UploadStore.active(t))pending=true;}}UploadStore.write(getContext(),tasks);}
   if(pending)UploadService.start(getContext());call.resolve();
  }catch(Exception error){call.reject("无法恢复上传任务，请检查服务器与设备存储");}
 }
 @PluginMethod public void enqueue(PluginCall call){
  try{
   String scope=call.getString("scope","");if(!scope.equals(UploadService.preferences(getContext()).getString("scope","")))throw new Exception("账号或配对状态已改变");
   JSONArray inputs=call.getArray("tasks");if(inputs==null||inputs.length()==0||inputs.length()>100)throw new Exception("一次最多上传 100 个文件");
   synchronized(UploadStore.class){JSONArray tasks=UploadStore.read(getContext());int pending=0;for(int i=0;i<tasks.length();i++)if(UploadStore.active(tasks.getJSONObject(i)))pending++;if(pending+inputs.length()>100)throw new Exception("请先处理现有上传任务");
    for(int i=0;i<inputs.length();i++){
     JSONObject input=inputs.getJSONObject(i),spec=input.getJSONObject("spec");String id=spec.getString("id");UUID.fromString(id);if(UploadStore.task(getContext(),scope,id)!=null)throw new Exception("上传任务编号重复");
     JSONArray files=spec.getJSONArray("files"),uris=input.getJSONArray("uris");if(files.length()!=uris.length()||files.length()<1||files.length()>2)throw new Exception("文件列表无效");long total=0;
     for(int f=0;f<files.length();f++){if(!"content".equals(Uri.parse(uris.getString(f)).getScheme()))throw new Exception("文件来源无效");total+=files.getJSONObject(f).getLong("size");}if(total<=0)throw new Exception("请选择非空文件");
     long now=System.currentTimeMillis();tasks.put(new JSONObject().put("scope",scope).put("id",id).put("spec",spec).put("uris",uris).put("target",spec.getString("target")).put("name",files.getJSONObject(0).getString("name")).put("total",total).put("bytes",0).put("progress",0).put("status","queued").put("created",now).put("updated",now));
    }UploadStore.write(getContext(),tasks);
   }
   try{UploadService.start(getContext());}catch(Exception e){UploadStore.pause(getContext(),"系统暂停了后台上传，请点击重试继续");}
   changed();call.resolve();
  }catch(Exception error){call.reject(error.getMessage()==null?"无法保存上传任务":error.getMessage());}
 }
 @PluginMethod public void list(PluginCall call){try{String scope=call.getString("scope","");JSArray out=new JSArray();JSONArray tasks=UploadStore.read(getContext());for(int i=0;i<tasks.length();i++){JSONObject t=tasks.getJSONObject(i);if(scope.equals(t.optString("scope"))){JSONObject view=new JSONObject(t.toString());view.remove("scope");view.remove("spec");view.remove("uris");view.remove("cancelRequested");out.put(view);}}call.resolve(new JSObject().put("tasks",out));}catch(Exception e){call.reject("无法读取上传记录");}}
 @PluginMethod public void action(PluginCall call){
  try{String scope=call.getString("scope",""),id=call.getString("id",""),action=call.getString("action","");if(!scope.equals(UploadService.preferences(getContext()).getString("scope","")))throw new Exception("账号已改变");JSONObject task=UploadStore.task(getContext(),scope,id);if(task==null)throw new Exception("任务不存在");
   if(action.equals("retry")){UploadStore.patch(getContext(),scope,id,new JSONObject().put("status","queued").put("attempt",0).put("error",JSONObject.NULL));UploadService.start(getContext());}
   else if(action.equals("cancel")){if(!task.optString("status").equals("done")){UploadStore.patch(getContext(),scope,id,new JSONObject().put("cancelRequested",true).put("status","cancelling"));UploadService.cancelCurrent(scope,id);UploadService.start(getContext());}}
   else if(action.equals("claim"))UploadStore.patch(getContext(),scope,id,new JSONObject().put("claimed",true));
   else if(action.equals("clear")&&!UploadStore.active(task)&&!(task.optString("target").equals("draft")&&task.optString("status").equals("done")&&!task.optBoolean("claimed"))){synchronized(UploadStore.class){JSONArray tasks=UploadStore.read(getContext()),next=new JSONArray();for(int i=0;i<tasks.length();i++){JSONObject t=tasks.getJSONObject(i);if(!(scope.equals(t.optString("scope"))&&id.equals(t.optString("id"))))next.put(t);}UploadStore.write(getContext(),next);UploadStore.removeFiles(getContext(),id);}changed();}
   call.resolve();
  }catch(Exception e){call.reject(e.getMessage()==null?"上传操作失败":e.getMessage());}
 }
 @PluginMethod public void consumeOpen(PluginCall call){call.resolve(new JSObject().put("opened",MainActivity.consumeUploads()));}
 @Override protected void handleOnResume(){if(MainActivity.consumeUploads())notifyListeners("openUploads",new JSObject(),true);}
 @PluginMethod public void pause(PluginCall call){try{UploadService.stop(getContext());UploadService.preferences(getContext()).edit().remove("token").commit();UploadStore.pause(getContext(),"已退出账号，上传暂停");call.resolve();}catch(Exception e){call.reject("无法暂停上传任务");}}
}
