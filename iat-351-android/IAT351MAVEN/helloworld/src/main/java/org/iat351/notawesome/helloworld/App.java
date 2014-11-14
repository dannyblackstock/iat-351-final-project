package org.iat351.notawesome.helloworld;

import java.net.URISyntaxException;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;

/**
 * Hello world!
 *
 */
public class App 
{	
	public App() throws URISyntaxException{
//		final Socket socket = IO.socket("http://localhost:3000");
		final Socket socket = IO.socket("http://207.23.222.128:3000");
		System.out.println(socket);
		socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {

			public void call(Object... arg0) {
				System.out.println( "Hello World!" );
				socket.emit("chat message", "hello");
				
			}
		}).on("event", new Emitter.Listener() {

			  
		  public void call(Object... args) {}

		}).on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {
			
		  public void call(Object... args) {
			  System.out.println( "Goodbye World!" );
		  }

		}).on("chat message", new Emitter.Listener() {

			  
		  public void call(Object... args) {
			  System.out.println( "hello back!" );
		  }

		});
		
		
		socket.connect();
	}
    public static void main( String[] args )
    {
    	try {
			App app = new App();
		} catch (URISyntaxException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        
    }
}
