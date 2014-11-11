package com.example.iat351thawandroid;

import java.io.IOException;

import android.app.Activity;
import android.content.res.Configuration;
import android.hardware.Camera;
import android.hardware.Camera.Parameters;
import android.hardware.Camera.PreviewCallback;
import android.hardware.Camera.Size;
import android.os.Build;
import android.util.Log;
import android.view.SurfaceHolder;
import android.view.SurfaceView;

public class CameraPreview extends SurfaceView implements
		SurfaceHolder.Callback {
	private Activity mActivity;
	private SurfaceHolder mHolder;
	private Camera mCamera;

	// This variable is responsible for getting and setting the camera settings
	private Parameters mParam;
	// this variable stores the camera preview size
	private Size previewSize;

	public CameraPreview(Activity activity) {
		super(activity); // Always necessary
		mActivity = activity;
		mHolder = getHolder();
		mHolder.addCallback(this);
		mHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);
	}

	@Override
	public void surfaceCreated(SurfaceHolder holder) {
		if (null == mCamera) {
			mCamera = Camera.open();
		}

		try {
			mCamera.setPreviewDisplay(mHolder);
			mCamera.startPreview();
		} catch (IOException e) {
			mCamera.release();
			mCamera = null;
		}
	}

	@Override
	public void surfaceChanged(SurfaceHolder holder, int format, int width,
			int height) {
		mCamera.stopPreview();

		// Set orientation
		boolean portrait = isPortrait();
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.ECLAIR) {
			// 2.1 and before
			mParam = mCamera.getParameters();

			// initialize the variables
			previewSize = mParam.getPreviewSize();

			if (portrait) {
				mParam.set("orientation", "portrait");
			} else {
				mParam.set("orientation", "landscape");
			}
			mCamera.setParameters(mParam);
		} else {
			// 2.2 and later
			if (portrait) {
				mCamera.setDisplayOrientation(90);
			} else {
				mCamera.setDisplayOrientation(0);
			}
		}

		mCamera.startPreview();

		mCamera.setPreviewCallback(new PreviewCallback() {
			@Override
			public void onPreviewFrame(byte[] data, Camera camera) {
				int frameHeight = camera.getParameters().getPreviewSize().height;
				int frameWidth = camera.getParameters().getPreviewSize().width;
				// number of pixels//transforms NV21 pixel data into RGB pixels
				int rgb[] = new int[frameWidth * frameHeight];
				// conversion NV21 pixel data into RGB pixels
				int[] myPixels = decodeYUV420SP(rgb, data, frameWidth,
						frameHeight);

				// Output the value of the top left pixel in the preview to
				// LogCat
				Log.i("Pixels",
						"The top right pixel has the following RGB (hexadecimal) values:"
								+ Integer.toHexString(myPixels[0]));
			}
		});
	}

	@Override
	public void surfaceDestroyed(SurfaceHolder holder) {
		if (null == mCamera) {
			return;
		}
		mCamera.stopPreview();
		mCamera.release();
		mCamera = null;
	}

	protected boolean isPortrait() {
		return (mActivity.getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT);
	}

	// Method from Ketai project! Not mine! See below...
	public int[] decodeYUV420SP(int[] rgb, byte[] yuv420sp, int width,
			int height) {

		// here we're using our own internal PImage attributes
		final int frameSize = width * height;

		for (int j = 0, yp = 0; j < height; j++) {
			int uvp = frameSize + (j >> 1) * width, u = 0, v = 0;
			for (int i = 0; i < width; i++, yp++) {
				int y = (0xff & ((int) yuv420sp[yp])) - 16;
				if (y < 0)
					y = 0;
				if ((i & 1) == 0) {
					v = (0xff & yuv420sp[uvp++]) - 128;
					u = (0xff & yuv420sp[uvp++]) - 128;
				}

				int y1192 = 1192 * y;
				int r = (y1192 + 1634 * v);
				int g = (y1192 - 833 * v - 400 * u);
				int b = (y1192 + 2066 * u);

				if (r < 0)
					r = 0;
				else if (r > 262143)
					r = 262143;
				if (g < 0)
					g = 0;
				else if (g > 262143)
					g = 262143;
				if (b < 0)
					b = 0;
				else if (b > 262143)
					b = 262143;

				// use internal buffer instead of pixels for UX reasons
				rgb[yp] = 0xff000000 | ((r << 6) & 0xff0000)
						| ((g >> 2) & 0xff00) | ((b >> 10) & 0xff);
			}
		}
		return rgb;
	}
}