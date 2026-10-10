package com.kevinhuang.love;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.util.Arrays;

@CapacitorPlugin(name="AppUpdates")
public class AppUpdatesPlugin extends Plugin {
 @PluginMethod public void install(PluginCall call) {
  getBridge().execute(() -> {
   try {
    File file = new File(Uri.parse(call.getString("uri", "")).getPath()).getCanonicalFile();
    File cache = getContext().getCacheDir().getCanonicalFile();
    if (!file.getPath().startsWith(cache.getPath()+File.separator) || !file.getName().endsWith(".apk")) throw new Exception("安装文件路径无效");
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    try (FileInputStream input = new FileInputStream(file)) { byte[] buffer = new byte[65536]; int n; while ((n=input.read(buffer))!=-1) digest.update(buffer,0,n); }
    StringBuilder hex = new StringBuilder(); for(byte b:digest.digest()) hex.append(String.format("%02x",b & 255));
    if (!hex.toString().equalsIgnoreCase(call.getString("sha256", ""))) throw new Exception("安装包校验失败，请重新下载");
    PackageManager pm = getContext().getPackageManager();
    int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
    PackageInfo apk = pm.getPackageArchiveInfo(file.getPath(), flags);
    PackageInfo installed = pm.getPackageInfo(getContext().getPackageName(), flags);
    if (apk == null || !installed.packageName.equals(apk.packageName)) throw new Exception("不是 Love 安装包");
    long apkVersion = Build.VERSION.SDK_INT >= 28 ? apk.getLongVersionCode() : apk.versionCode;
    long currentVersion = Build.VERSION.SDK_INT >= 28 ? installed.getLongVersionCode() : installed.versionCode;
    if (apkVersion <= currentVersion) throw new Exception("安装包版本不高于当前版本");
    Signature[] a = Build.VERSION.SDK_INT >= 28 ? apk.signingInfo.getApkContentsSigners() : apk.signatures;
    Signature[] b = Build.VERSION.SDK_INT >= 28 ? installed.signingInfo.getApkContentsSigners() : installed.signatures;
    if (!Arrays.equals(a,b)) throw new Exception("安装包签名与当前应用不一致，无法覆盖更新");
    getActivity().runOnUiThread(() -> {
     try {
      if (Build.VERSION.SDK_INT >= 26 && !pm.canRequestPackageInstalls()) {
       getActivity().startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:"+installed.packageName)));
       call.resolve(); return;
      }
      Uri uri = FileProvider.getUriForFile(getContext(), installed.packageName+".fileprovider", file);
      Intent intent = new Intent(Intent.ACTION_VIEW).setDataAndType(uri,"application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      getActivity().startActivity(intent); call.resolve();
     } catch(Exception error) { call.reject(error.getMessage()); }
    });
   } catch(Exception error) { call.reject(error.getMessage()); }
  });
 }
}
