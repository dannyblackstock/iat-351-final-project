package test;

import java.net.MalformedURLException;

import io.socket.IOAcknowledge;
import io.socket.IOCallback;
import io.socket.SocketIO;
import io.socket.SocketIOException;

import org.json.JSONException;
import org.json.JSONObject;



public class sockettest {
	
	
	
	public sockettest() throws MalformedURLException {
		SocketIO socket = new SocketIO("http://localhost:3000/");
        socket.connect(new IOCallback() {
            @Override
            public void onMessage(JSONObject json, IOAcknowledge ack) {
                try {
                    System.out.println("Server said:" + json.toString(2));
                } catch (JSONException e) {
                    e.printStackTrace();
                    
                }
            }
            

            @Override
            public void onMessage(String data, IOAcknowledge ack) {
                System.out.println("Server said: " + data);
            }

            @Override
            public void onError(SocketIOException socketIOException) {
                System.out.println("an Error occured");
                socketIOException.printStackTrace();
            }

            @Override
            public void onDisconnect() {
                System.out.println("Connection terminated.");
            }

            @Override
            public void onConnect() {
                System.out.println("Connection established");
            }

            @Override
            public void on(String event, IOAcknowledge ack, Object... args) {
                System.out.println("Server triggered event '" + event + "'");
            }
        });

        // This line is cached until the connection is establisched.
//        socket.send("Hello Server!");
        socket.emit("chat message", "hello");
	}

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		
		try {
			sockettest sockettest = new sockettest();
		} catch (MalformedURLException e) {
			// TODO Auto-generated catch block
			System.out.println("test");
			e.printStackTrace();
		}
		
	}
	
	
}
