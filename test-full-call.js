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
      console.log('>>> CALL STATE:', JSON.stringify(data));
    });

    // Listen for peer-ready
    s.on('peer-ready', () => {
      console.log('>>> PEER READY');
    });
    
    // Step 1: Dial a test number after 2s
    setTimeout(() => {
      const testPhone = '01060003361';
      console.log(`\n=== DIALING ${testPhone} ===`);
      s.emit('dial', { phone: testPhone, sessionId: sess.sessionId }, (response) => {
        console.log('Dial response:', JSON.stringify(response));
      });
    }, 2000);
    
    // Step 2: End the call after 15s (give time for call to connect)
    setTimeout(() => {
      console.log('\n=== SENDING END-CALL ===');
      s.emit('end-call', { sessionId: sess.sessionId }, (response) => {
        console.log('End-call response:', JSON.stringify(response));
        setTimeout(() => {
          console.log('Test complete. Exiting.');
          process.exit(0);
        }, 3000);
      });
    }, 15000);
    
    // Timeout failsafe
    setTimeout(() => {
      console.log('TIMEOUT: Test exceeded 25s');
      process.exit(1);
    }, 25000);
  });
});

s.on('connect_error', (e) => {
  console.log('Connection error:', e.message);
  process.exit(1);
});
