package com.kevinhuang.love;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ChinaPushPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
