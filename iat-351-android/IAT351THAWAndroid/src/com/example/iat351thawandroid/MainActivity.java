package com.example.iat351thawandroid;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;

public class MainActivity extends Activity {

	public final static String EXTRA_MESSAGE = "com.example.iat351thawandroid.MESSAGE";

	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
	}

	// Called when user presses connect button
	public void connectUsingIP(View view) {
		Intent intent = new Intent(this, CameraPreviewActivity.class);
		EditText editText = (EditText) findViewById(R.id.enter_ip);
		String ipAddress = editText.getText().toString();
		intent.putExtra(EXTRA_MESSAGE, ipAddress);
		startActivity(intent);
	}

}
