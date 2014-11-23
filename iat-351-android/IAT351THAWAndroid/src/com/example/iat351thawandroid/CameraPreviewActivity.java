package com.example.iat351thawandroid;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.TextView;

public class CameraPreviewActivity extends Activity {
	private String ipAddress;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		Intent intent = getIntent();
		ipAddress = intent.getStringExtra(MainActivity.EXTRA_MESSAGE);

		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_camera_preview);
		
		CameraPreview myCameraPreview = (CameraPreview) findViewById(R.id.my_camera_preview);

		// set the camera's IP address
		myCameraPreview.setNodeServerIP(ipAddress);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.camera_preview, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle action bar item clicks here. The action bar will
		// automatically handle clicks on the Home/Up button, so long
		// as you specify a parent activity in AndroidManifest.xml.
		int id = item.getItemId();
		if (id == R.id.action_settings) {
			return true;
		}
		return super.onOptionsItemSelected(item);
	}
}
