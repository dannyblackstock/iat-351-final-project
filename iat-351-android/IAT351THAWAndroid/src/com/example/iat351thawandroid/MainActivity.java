package com.example.iat351thawandroid;

import android.app.Activity;
import android.os.Bundle;

public class MainActivity extends Activity {
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        CameraPreview myCameraPreview = (CameraPreview) findViewById(R.id.my_camera_preview);
//        setContentView(new CameraPreview(this));
    }
}
