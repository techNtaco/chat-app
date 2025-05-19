import { useEffect, useRef, useState } from 'react';

type Message = {
  from: string;
  message: string;
};

const roomOptions = ['Red', 'Blue', 'Green'];

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [joinedRoom, setJoinedRoom] = useState('');
  const [userId, setUserId] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  // Establish WebSocket connection
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ Connected to WebSocket');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'system' && data.userId) {
        // System message after join
        setUserId(data.userId);
        setJoinedRoom(selectedRoom); // set from dropdown
        setMessages([]);
        console.log(`Joined room ${selectedRoom} as ${data.userId}`);
      }

      if (data.type === 'message') {
        setMessages((prev) => [...prev, { from: data.from, message: data.message }]);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      socket.close();
    };
  }, [selectedRoom]);

  // Send room join request
  const joinRoom = () => {
    if (!selectedRoom || !socketRef.current) return;

    socketRef.current.send(
      JSON.stringify({ type: 'join', room: selectedRoom })
    );
  };

  // Send message inside room
  const sendMessage = () => {
    if (!input.trim() || !joinedRoom || !socketRef.current) return;

    socketRef.current.send(
      JSON.stringify({ type: 'message', message: input.trim() })
    );
    setInput('');
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(to right, #eef2f3, #ffffff)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <div style={{
        background: '#fff',
        width: '90%',
        maxWidth: '500px',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h2 style={{ textAlign: 'center' }}>🎨 Chat Room</h2>

        {!joinedRoom ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid #ccc',
                background: '#f8f8f8'
              }}
            >
              <option value="">Select a Room</option>
              {roomOptions.map((room) => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
            <button
              onClick={joinRoom}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Join
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              Room: <b>{joinedRoom}</b><br />
              You: <b>{userId}</b>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #ccc'
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Send
              </button>
            </div>

            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '0.5rem',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              background: '#f9f9f9',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{
                  padding: '0.6rem 1rem',
                  background: msg.from === userId ? '#d4edda' : '#e1f0ff',
                  borderRadius: '8px',
                  alignSelf: msg.from === userId ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  wordBreak: 'break-word'
                }}>
                  <strong>{msg.from}:</strong> {msg.message}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;