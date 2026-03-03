import { io } from 'socket.io-client';

const s = io('http://localhost:5001', { transports: ['websocket'] });

s.on('connect', () => {
  console.log('Connected:', s.id);
  
  s.emit('list-sessions', (sessions) => {
    console.log('Sessions:', JSON.stringify(sessions, null, 2));
    
    if (!sessions || sessions.length === 0) {
      console.log('No sessions found');
      process.exit(1);
    }
    
    const sess = sessions[0];
    console.log('Joining session:', sess.sessionId, 'as browser');
    s.emit('join', { sessionId: sess.sessionId, role: 'browser' });
    
    // Listen for call-state events
    s.on('call-state', (data) => {
      console.log('CALL STATE EVENT:', JSON.stringify(data));
    });
    
    // Wait then send end-call
    setTimeout(() => {
      console.log('>>> Sending end-call command...');
      s.emit('end-call', { sessionId: sess.sessionId }, (response) => {
        console.log('<<< End-call response:', JSON.stringify(response));
        setTimeout(() => process.exit(0), 3000);
      });
    }, 2000);
    
    // Timeout failsafe
    setTimeout(() => {
      console.log('TIMEOUT: No ack received after 10s');
      process.exit(1);
    }, 10000);
  });
});

s.on('connect_error', (e) => {
  console.log('Connection error:', e.message);
  process.exit(1);
});
