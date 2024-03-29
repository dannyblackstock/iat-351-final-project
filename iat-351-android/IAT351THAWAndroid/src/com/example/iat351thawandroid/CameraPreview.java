package com.example.iat351thawandroid;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.List;

import android.app.Activity;
import android.content.Context;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Matrix;
import android.hardware.Camera;
import android.hardware.Camera.Parameters;
import android.hardware.Camera.PreviewCallback;
import android.hardware.Camera.Size;
import android.os.Build;
import android.util.AttributeSet;
import android.util.Log;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.SurfaceHolder;
import android.view.SurfaceView;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;

public class CameraPreview extends SurfaceView implements
		SurfaceHolder.Callback {
	private Activity mActivity;
	private SurfaceHolder mHolder;
	private Camera mCamera;
	private Socket socket;
	private String nodeServerIP;
	private int fingerCount;
	private int[] myPixels;

	private Matrix matrix = new Matrix();
	private float scale = 1f;
	private ScaleGestureDetector SGD;

	// This variable is responsible for getting and setting the camera settings
	private Parameters mParam;
	// this variable stores the camera preview size
	private Size previewSize;

	// public CameraPreview(Activity activity) {
	public CameraPreview(Context context, AttributeSet attrs) {
		super(context, attrs);
		// super(activity); // Always necessary
		// mActivity = activity;
		mHolder = getHolder();
		mHolder.addCallback(this);
		mHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);

		SGD = new ScaleGestureDetector(context, new ScaleListener());

		if (!isInEditMode()) {
			mActivity = (CameraPreviewActivity) this.getContext();
		}
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

		// [GUREN] Creating sockets
		try {
			socketCreate();
		} catch (URISyntaxException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
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
			// TODO: set white balance, set focus to infinity

			// initialize the variables
			previewSize = mParam.getPreviewSize();

			if (portrait) {
				mParam.set("orientation", "portrait");
			} else {
				mParam.set("orientation", "landscape");
			}

			// apply the parameters above
			mCamera.setParameters(mParam);

		} else {
			// 2.2 and later

			if (portrait) {
				mCamera.setDisplayOrientation(90);
			} else {
				mCamera.setDisplayOrientation(0);
			}

			mParam = mCamera.getParameters();

			List<Camera.Size> previewSizes = mParam.getSupportedPreviewSizes();

			// You need to choose the most appropriate previewSize for your app
			Camera.Size previewSize = previewSizes.get(0);// .... select one of
															// previewSizes here
															// (1080x1920

			mParam.setPreviewSize(previewSize.width, previewSize.height);

			// set the exposure and stuff
			mParam.setFocusMode(Parameters.FOCUS_MODE_INFINITY);
			mParam.setWhiteBalance(Parameters.WHITE_BALANCE_DAYLIGHT);

			if (mParam.isAutoExposureLockSupported()) {
				mParam.setAutoExposureLock(true);
			}

			// apply the parameters above
			mCamera.setParameters(mParam);
		}

		mCamera.startPreview();

		// callback called every camera refresh that logs a pixel value
		mCamera.setPreviewCallback(new PreviewCallback() {
			@Override
			public void onPreviewFrame(byte[] data, Camera camera) {
				int frameHeight = camera.getParameters().getPreviewSize().height;
				int frameWidth = camera.getParameters().getPreviewSize().width;
				// number of pixels//transforms NV21 pixel data into RGB pixels
				int rgb[] = new int[frameWidth * frameHeight];
				// conversion NV21 pixel data into RGB pixels
				myPixels = decodeYUV420SP(rgb, data, frameWidth, frameHeight);

				// Output the value of the top left pixel in the preview to
				// LogCat
				// Log.i("Pixels",
				// "The middle pixel has the following RGB (hexadecimal) values:"
				// + Integer
				// .toHexString(myPixels[myPixels.length / 2]));
				int pixelLocation1 = ((myPixels.length - 1) / 100) - 1000;
				int pixelLocation2 = ((myPixels.length - 1) / 100) - 500;
				int pixelLocation3 = ((myPixels.length - 1) / 100) - 750;

				int[] finalRGB = averagePixels(
						Integer.toHexString(myPixels[pixelLocation1]),
						Integer.toHexString(myPixels[pixelLocation2]));
				//
				// Log.i("Pixels",
				// "The pixel at location "
				// + Integer.toString(pixelLocation3)
				// + " has the following RGB (hexadecimal) values:"
				// + Integer.toHexString(myPixels[pixelLocation3]));

				// for some reason myPixels.length / 2 wasn't working so magic
				// number here we go
				sendColor(finalRGB);
			}
		});
	}

	@Override
	public void surfaceDestroyed(SurfaceHolder holder) {
		if (null == mCamera) {
			return;
		}
		mCamera.stopPreview();
		mCamera.setPreviewCallback(null);
		mCamera.release();
		mCamera = null;
	}

	protected boolean isPortrait() {
		return (mActivity.getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT);
	}

	@Override
	public boolean onTouchEvent(MotionEvent event) {
		int action = event.getAction();
		SGD.onTouchEvent(event);

		switch (action & MotionEvent.ACTION_MASK) {
		case MotionEvent.ACTION_UP:
		case MotionEvent.ACTION_POINTER_UP:
			// multi touch!! - touch up
			fingerCount = event.getPointerCount(); // Number of 'fingers' in
													// this
													// time
			// Output the number of fingers touched
			// LogCat
			Log.i("fingers", "Number of fingers on screen now:"
					+ (fingerCount - 1));
			sendFingers(fingerCount - 1);
			return true;
			// break;
		case MotionEvent.ACTION_DOWN:
		case MotionEvent.ACTION_POINTER_DOWN:
			// multi touch!! - touch down
			fingerCount = event.getPointerCount(); // Number of 'fingers' in
													// this
													// time
			// Output the number of fingers touched
			// LogCat
			Log.i("fingers", "Number of fingers on screen now:" + (fingerCount));

			sendFingers(fingerCount);
			return true;
			// break;
		default:
			return false;
		}
		// return super.onTouchEvent(event);
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

	public void socketCreate() throws URISyntaxException {
		// final Socket socket = IO.socket("http://localhost:3000");
		socket = IO.socket(nodeServerIP);
		String sockString = String.valueOf(socket);
		Log.i("SOCKET", sockString);

		socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {

			public void call(Object... arg0) {
				Log.i("SOCKET", "Socket connect");
				System.out.println("Hello World!");
				socket.emit("chat message", "hello");

			}
		}).on("event", new Emitter.Listener() {

			public void call(Object... args) {
			}

		}).on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {

			public void call(Object... args) {
				System.out.println("Goodbye World!");
			}

		}).on("chat message", new Emitter.Listener() {

			public void call(Object... args) {
				System.out.println("hello back!");
			}

		});

		socket.connect();
	}

	public void sendFingers(int value) {
		String valueString = String.valueOf(value);
		// socket.emit("chat message", "Number of fingers: " + countString);
		socket.emit("fingerMsg", valueString);
	}

	public void sendColor(int[] rgbArray) {
		String valueString = Integer.toString(rgbArray[0]) + ","
				+ Integer.toString(rgbArray[1]) + ","
				+ Integer.toString(rgbArray[2]);
		// Log.i("Pixels", valueString);
		// socket.emit("chat message", "Number of fingers: " + countString);
		socket.emit("rgbMsg", valueString);
	}

	public void setNodeServerIP(String nodeServerIP) {
		this.nodeServerIP = nodeServerIP;
	}

	public int[] averagePixels(String pixel1, String pixel2) {
		// TODO: Implement this function

		int[] pixel1RGB = getRGB(pixel1.substring(2, 8));
		int[] pixel2RGB = getRGB(pixel2.substring(2, 8));

		int averageR = (pixel1RGB[0] + pixel2RGB[0]) / 2;
		int averageG = (pixel1RGB[1] + pixel2RGB[1]) / 2;
		int averageB = (pixel1RGB[2] + pixel2RGB[2]) / 2;

		int[] result = { averageR, averageG, averageB };
		return result;
	}

	public static int[] getRGB(final String rgb) {
		final int[] ret = new int[3];
		for (int i = 0; i < 3; i++) {
			ret[i] = Integer.parseInt(rgb.substring(i * 2, i * 2 + 2), 16);
		}
		return ret;
	}

	private class ScaleListener extends
			ScaleGestureDetector.SimpleOnScaleGestureListener {
		@Override
		// public boolean onScale(ScaleGestureDetector detector) {
		// scale *= detector.getScaleFactor();
		// scale = Math.max(0.1f, Math.min(scale, 5.0f));
		// matrix.setScale(scale, scale);
		// // img.setImageMatrix(matrix);
		// Log.i("Scale", Float.toString(scale));
		// return true;
		// }
		public void onScaleEnd(ScaleGestureDetector detector) {
			scale *= detector.getScaleFactor();
			scale = Math.max(0.1f, Math.min(scale, 5.0f));
			matrix.setScale(scale, scale);
			// img.setImageMatrix(matrix);
			String scaleString = Float.toString(scale);

			Log.i("Scale", scaleString);
			socket.emit("scale", scaleString);
			// return true;
		}
	}
}