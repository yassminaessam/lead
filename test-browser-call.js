/**
 * Browser-side call test: simulates exactly what BrowserVoiceBridge does.
 * Connects to signaling, joins session, dials, receives audio via Socket.IO,
 * then ends the call. Reports audio stats.
 */
import { io } from 'socket.io-client';

const PHONE = '01060003361';
const CALL_DURATION_MS = 15000; // listen for 15 seconds
const SERVER = 'http://localhost:5001';

let audioChunksReceived = 0;
let firstChunkTime = null;
let totalBytes = 0;
let callStateEvents = [];

const s = io(SERVER, { transports: ['websocket'] });

s.on('connect', () => {
  console.log('✅ Connected to signaling:', s.id);

  // Step 1: List sessions and join
  s.emit('list-sessions', (sessions) => {
    if (!sessions || sessions.length === 0) {
      console.log('❌ No device sessions found. Is the Android app running?');
      process.exit(1);
    }

    const sess = sessions[0];
    console.log(`✅ Found device session: ${sess.sessionId}`);
    s.emit('join', { sessionId: sess.sessionId, role: 'browser' });

    // Listen for audio data (Socket.IO fallback)
    s.on('audio-data', (data) => {
      audioChunksReceived++;
      if (data.data) {
        totalBytes += data.data.length; // base64 length
      }
      if (audioChunksReceived === 1) {
        firstChunkTime = Date.now();
        console.log(`🔊 First audio chunk received! sampleRate=${data.sampleRate}, samples=${data.samples}`);
      }
      if (audioChunksReceived % 50 === 0) {
        const elapsed = ((Date.now() - firstChunkTime) / 1000).toFixed(1);
        console.log(`🔊 Audio chunks: ${audioChunksReceived} (${elapsed}s, ~${(totalBytes / 1024).toFixed(0)}KB total)`);
      }
    });

    // Listen for call state changes
    s.on('call-state', (data) => {
      callStateEvents.push(data);
      const icon = data.state === 'OFFHOOK' ? '📞' : data.state === 'IDLE' ? '📴' : '🔔';
      console.log(`${icon} Call state: ${data.state}${data.duration ? ` (duration: ${data.duration}s)` : ''}`);
    });

    // Listen for peer-ready
    s.on('peer-ready', () => {
      console.log('✅ Peer ready (device is in session)');
    });

    // Listen for offer (WebRTC - we won't answer but that's OK for Socket.IO audio)
    s.on('offer', () => {
      console.log('📡 WebRTC offer received (not answering - using Socket.IO audio)');
    });

    // Step 2: Dial after 2s
    setTimeout(() => {
      console.log(`\n📱 Dialing ${PHONE}...`);
      s.emit('dial', { phone: PHONE, sessionId: sess.sessionId }, (response) => {
        if (response.error) {
          console.log(`❌ Dial failed: ${response.error}`);
          process.exit(1);
        }
        console.log(`✅ Dial response: ${JSON.stringify(response)}`);
      });
    }, 2000);

    // Step 3: End call after CALL_DURATION_MS
    setTimeout(() => {
      console.log(`\n🛑 Ending call...`);
      s.emit('end-call', { sessionId: sess.sessionId }, (response) => {
        console.log(`✅ End-call response: ${JSON.stringify(response)}`);

        // Wait 3s for IDLE event and final stats
        setTimeout(() => {
          console.log('\n' + '='.repeat(50));
          console.log('📊 TEST RESULTS:');
          console.log('='.repeat(50));
          console.log(`  Audio chunks received: ${audioChunksReceived}`);
          console.log(`  Total audio data: ${(totalBytes / 1024).toFixed(1)} KB`);
          console.log(`  Call state events: ${callStateEvents.map(e => e.state).join(' → ')}`);
          
          if (audioChunksReceived > 0) {
            const duration = (Date.now() - firstChunkTime) / 1000;
            console.log(`  Audio stream duration: ${duration.toFixed(1)}s`);
            console.log(`  Chunks per second: ${(audioChunksReceived / duration).toFixed(1)}`);
            console.log(`\n✅ AUDIO TEST PASSED - ${audioChunksReceived} chunks received`);
          } else {
            console.log(`\n❌ AUDIO TEST FAILED - No audio chunks received!`);
          }

          const hasOffhook = callStateEvents.some(e => e.state === 'OFFHOOK');
          const hasIdle = callStateEvents.some(e => e.state === 'IDLE');
          
          if (hasOffhook && hasIdle) {
            console.log('✅ CALL STATE TEST PASSED - OFFHOOK → IDLE detected');
          } else {
            console.log(`❌ CALL STATE TEST ${hasOffhook ? 'PARTIAL' : 'FAILED'} - OFFHOOK:${hasOffhook} IDLE:${hasIdle}`);
          }

          console.log('='.repeat(50));
          process.exit(0);
        }, 3000);
      });
    }, CALL_DURATION_MS + 2000); // dial delay + call duration

    // Timeout failsafe
    setTimeout(() => {
      console.log('⏰ TIMEOUT exceeded');
      process.exit(1);
    }, 30000);
  });
});

s.on('connect_error', (e) => {
  console.log('❌ Connection error:', e.message);
  process.exit(1);
});
