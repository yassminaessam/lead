/**
 * WebRTC Signaling Server
 *
 * Relays WebRTC signaling messages (offer/answer/ICE candidates) between
 * the Android device (role: 'device') and the browser (role: 'browser').
 * Uses Socket.IO for transport, matching the protocol expected by
 * Mobarez Android Remote Call Proxy's VoiceBridge service.
 */

// Map sessionId -> { device: socketId, browser: socketId }
const sessions = new Map();
// Map socketId -> { role, sessionId }
const clients = new Map();

// Reference to io instance for dialDevice
let ioRef = null;

export function setupSignaling(io) {
  ioRef = io;
  io.on('connection', (socket) => {
    const deviceId = socket.handshake.query.deviceId || 'unknown';
    console.log(`[Signaling] Client connected: ${socket.id} (deviceId: ${deviceId})`);

    // Join a session
    socket.on('join', ({ sessionId, role, deviceId: joinDeviceId }) => {
      if (!sessionId || !role) return;

      clients.set(socket.id, { role, sessionId, deviceId: joinDeviceId || deviceId });

      let session = sessions.get(sessionId);
      if (!session) {
        session = { deviceId: joinDeviceId || deviceId };
        sessions.set(sessionId, session);
      }
      session[role] = socket.id;

      console.log(`[Signaling] ${role} joined session ${sessionId}`);

      // Notify both peers when both are in the session
      const otherRole = role === 'device' ? 'browser' : 'device';
      const otherSocketId = session[otherRole];
      if (otherSocketId) {
        io.to(socket.id).emit('peer-ready', { role: otherRole });
        io.to(otherSocketId).emit('peer-ready', { role });
        console.log(`[Signaling] Both peers ready in session ${sessionId}`);
      }
    });

    // List active device sessions (for browser auto-discovery)
    socket.on('list-sessions', (callback) => {
      const activeSessions = [];
      for (const [sessionId, session] of sessions.entries()) {
        if (session.device) {
          activeSessions.push({
            sessionId,
            deviceId: session.deviceId || 'unknown',
            hasBrowser: !!session.browser,
          });
        }
      }
      if (typeof callback === 'function') {
        callback(activeSessions);
      }
    });

    // Relay SDP offer (device -> browser or browser -> device)
    socket.on('offer', (data) => {
      const client = clients.get(socket.id);
      if (!client) return;

      const session = sessions.get(data.sessionId || client.sessionId);
      if (!session) return;

      // Send to the other peer
      const targetRole = client.role === 'device' ? 'browser' : 'device';
      const targetSocketId = session[targetRole];
      if (targetSocketId) {
        io.to(targetSocketId).emit('offer', {
          sdp: data.sdp,
          type: data.type,
        });
        console.log(`[Signaling] Relayed offer from ${client.role} to ${targetRole}`);
      }
    });

    // Relay SDP answer
    socket.on('answer', (data) => {
      const client = clients.get(socket.id);
      if (!client) return;

      const session = sessions.get(data.sessionId || client.sessionId);
      if (!session) return;

      const targetRole = client.role === 'device' ? 'browser' : 'device';
      const targetSocketId = session[targetRole];
      if (targetSocketId) {
        io.to(targetSocketId).emit('answer', {
          sdp: data.sdp,
          type: data.type,
        });
        console.log(`[Signaling] Relayed answer from ${client.role} to ${targetRole}`);
      }
    });

    // Relay ICE candidates
    socket.on('ice-candidate', (data) => {
      const client = clients.get(socket.id);
      if (!client) return;

      const session = sessions.get(data.sessionId || client.sessionId);
      if (!session) return;

      const targetRole = client.role === 'device' ? 'browser' : 'device';
      const targetSocketId = session[targetRole];
      if (targetSocketId) {
        io.to(targetSocketId).emit('ice-candidate', {
          candidate: data.candidate,
          sdpMid: data.sdpMid,
          sdpMLineIndex: data.sdpMLineIndex,
        });
      }
    });

    // Relay audio data from device to browser (fallback when DataChannel unavailable)
    socket.on('audio-data', (data) => {
      const client = clients.get(socket.id);
      if (!client) return;

      const session = sessions.get(data?.sessionId || client.sessionId);
      if (!session) return;

      if (client.role === 'device' && session.browser) {
        io.to(session.browser).emit('audio-data', {
          data: data.data,
          sampleRate: data.sampleRate,
          samples: data.samples,
        });
      }
    });

    // Relay call state from device to browser
    socket.on('call-state', (data) => {
      const client = clients.get(socket.id);
      if (!client) return;

      const session = sessions.get(data.sessionId || client.sessionId);
      if (!session) return;

      // Only relay from device to browser
      if (client.role === 'device' && session.browser) {
        io.to(session.browser).emit('call-state', {
          state: data.state,
          duration: data.duration,
          timestamp: data.timestamp,
        });
        console.log(`[Signaling] Relayed call-state ${data.state} to browser`);
      }
    });

    // Relay dial command from browser to device
    socket.on('dial', (data, callback) => {
      const client = clients.get(socket.id);
      if (!client) return;

      const session = sessions.get(data?.sessionId || client.sessionId);
      if (!session) return;

      if (client.role === 'browser' && session.device) {
        const deviceSocket = io.sockets.sockets.get(session.device);
        if (deviceSocket) {
          deviceSocket.emit('dial', { phone: data.phone }, (response) => {
            if (typeof callback === 'function') {
              callback(response);
            }
          });
          console.log(`[Signaling] Relayed dial command to device: ${data.phone}`);
        } else {
          if (typeof callback === 'function') {
            callback({ error: 'Device socket not found' });
          }
        }
      } else if (typeof callback === 'function') {
        callback({ error: 'No device connected' });
      }
    });

    // Relay end-call command from browser to device
    socket.on('end-call', (data, callback) => {
      const client = clients.get(socket.id);
      if (!client) return;

      const session = sessions.get(data?.sessionId || client.sessionId);
      if (!session) return;

      // Only relay from browser to device
      if (client.role === 'browser' && session.device) {
        // Must use socket.emit() directly — io.to().emit() does NOT support ack callbacks
        const deviceSocket = io.sockets.sockets.get(session.device);
        if (deviceSocket) {
          deviceSocket.emit('end-call', {}, (response) => {
            if (typeof callback === 'function') {
              callback(response);
            }
          });
          console.log(`[Signaling] Relayed end-call to device`);
        } else {
          console.log(`[Signaling] Device socket not found: ${session.device}`);
          if (typeof callback === 'function') {
            callback({ error: 'Device socket not found' });
          }
        }
      } else if (typeof callback === 'function') {
        callback({ error: 'No device connected' });
      }
    });

    // Leave session
    socket.on('leave', (data) => {
      cleanupClient(socket.id, io);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Signaling] Client disconnected: ${socket.id}`);
      cleanupClient(socket.id, io);
    });
  });

  console.log('[Signaling] WebRTC signaling server initialized');
}

function cleanupClient(socketId, io) {
  const client = clients.get(socketId);
  if (!client) return;

  const session = sessions.get(client.sessionId);
  if (session) {
    // Notify the other peer
    const otherRole = client.role === 'device' ? 'browser' : 'device';
    const otherSocketId = session[otherRole];
    if (otherSocketId) {
      io.to(otherSocketId).emit('peer-left');
    }

    // Remove this client from session
    if (session[client.role] === socketId) {
      delete session[client.role];
    }

    // Clean up empty sessions
    if (!session.device && !session.browser) {
      sessions.delete(client.sessionId);
    }
  }

  clients.delete(socketId);
}

/**
 * Dial a phone number on the connected Android device via Socket.IO.
 * Returns a promise that resolves with the device response.
 */
export function dialDevice(phone) {
  return new Promise((resolve, reject) => {
    if (!ioRef) {
      return reject(new Error('Signaling server not initialized'));
    }

    // Find any connected device socket
    let deviceSocketId = null;
    for (const [sessionId, session] of sessions.entries()) {
      if (session.device) {
        deviceSocketId = session.device;
        break;
      }
    }

    if (!deviceSocketId) {
      return reject(new Error('No Android device connected via Voice Bridge'));
    }

    // Send dial command with a 15s timeout for response
    const timeout = setTimeout(() => {
      reject(new Error('Device did not respond to dial command (timeout)'));
    }, 15000);

    // Must use socket.emit() directly — io.to().emit() does NOT support ack callbacks
    const deviceSocket = ioRef.sockets.sockets.get(deviceSocketId);
    if (!deviceSocket) {
      clearTimeout(timeout);
      return reject(new Error('Device socket not found'));
    }
    deviceSocket.emit('dial', { phone }, (response) => {
      clearTimeout(timeout);
      if (response && response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response || { status: 'calling', phone });
      }
    });
  });
}
