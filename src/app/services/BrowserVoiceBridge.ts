/**
 * Browser WebRTC Voice Bridge Service
 *
 * Connects to the signaling server via Socket.IO, establishes a WebRTC
 * peer connection with the Android device, and plays incoming audio.
 * Mirrors the protocol used by the mobile VoiceBridge service.
 */
import { io, Socket } from 'socket.io-client';

export type BridgeState = 'idle' | 'connecting' | 'active' | 'error';
export type IceStatus = 'connected' | 'searching' | 'disconnected' | 'failed';
export type CallState = 'IDLE' | 'OFFHOOK' | 'RINGING';

export interface CallStateEvent {
  state: CallState;
  duration?: number;
  timestamp: number;
}

export interface VoiceBridgeCallbacks {
  onStateChange: (state: BridgeState) => void;
  onIceStatusChange: (status: IceStatus) => void;
  onLatencyUpdate: (latencyMs: number) => void;
  onError: (error: string) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onCallStateChange?: (event: CallStateEvent) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

class BrowserVoiceBridge {
  private peerConnection: RTCPeerConnection | null = null;
  private socket: Socket | null = null;
  private state: BridgeState = 'idle';
  private callbacks: VoiceBridgeCallbacks | null = null;
  private sessionId: string | null = null;
  private latencyInterval: ReturnType<typeof setInterval> | null = null;
  private pendingCandidates: Array<{ candidate: string; sdpMid: string; sdpMLineIndex: number }> = [];
  private hasRemoteDescription = false;
  private audioContext: AudioContext | null = null;

  getState(): BridgeState {
    return this.state;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  isSocketConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  setCallbacks(callbacks: VoiceBridgeCallbacks): void {
    this.callbacks = callbacks;
  }

  async connect(signalingUrl: string, sessionId?: string): Promise<void> {
    if (this.state === 'active' || this.state === 'connecting') {
      return;
    }

    this.setState('connecting');

    // Create AudioContext NOW — inside a user-gesture (click) handler.
    // Chrome's autoplay policy requires AudioContext to be created/resumed
    // from a user gesture, otherwise it stays 'suspended' forever.
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.nextPlayTime = 0;
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    console.log('[BrowserVoiceBridge] AudioContext state:', this.audioContext.state);

    try {
      await this.connectSignaling(signalingUrl);

      // If no session ID provided, auto-discover from server
      if (!sessionId) {
        const sessions = await this.listSessions();
        const available = sessions.find((s: { hasBrowser: boolean }) => !s.hasBrowser);
        if (!available) {
          throw new Error('No active device session found');
        }
        this.sessionId = available.sessionId;
      } else {
        this.sessionId = sessionId;
      }

      this.createPeerConnection();

      this.socket?.emit('join', {
        sessionId: this.sessionId,
        role: 'browser',
      });

      this.startLatencyMonitoring();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect';
      this.callbacks?.onError(message);
      this.setState('error');
      this.disconnect();
    }
  }

  private listSessions(): Promise<Array<{ sessionId: string; deviceId: string; hasBrowser: boolean }>> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve([]);
        return;
      }
      this.socket.emit('list-sessions', (sessions: Array<{ sessionId: string; deviceId: string; hasBrowser: boolean }>) => {
        resolve(sessions || []);
      });
    });
  }

  endCall(): Promise<{ status?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ error: 'Not connected to signaling server' });
        return;
      }
      this.socket.emit('end-call', { sessionId: this.sessionId }, (response: { status?: string; error?: string }) => {
        resolve(response || { status: 'ended' });
      });
      // Timeout in case device doesn't respond
      setTimeout(() => resolve({ status: 'sent' }), 5000);
    });
  }

  disconnect(): void {
    this.stopLatencyMonitoring();

    if (this.socket) {
      this.socket.emit('leave', { sessionId: this.sessionId });
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.nextPlayTime = 0;
    }

    this.sessionId = null;
    this.hasRemoteDescription = false;
    this.pendingCandidates = [];
    this.setState('idle');
    this.callbacks?.onIceStatusChange('disconnected');
  }

  private connectSignaling(signalingUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(signalingUrl, {
        transports: ['websocket'],
        query: { deviceId: 'browser' },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Signaling server connection timeout'));
        }
      }, 15000);

      this.socket.on('connect', () => {
        console.log('[BrowserVoiceBridge] Signaling connected:', this.socket?.id);
        // On reconnect, re-join session so signaling knows about us
        if (settled && this.sessionId) {
          console.log('[BrowserVoiceBridge] Reconnected — rejoining session', this.sessionId);
          this.createPeerConnection();
          this.socket?.emit('join', {
            sessionId: this.sessionId,
            role: 'browser',
          });
        }
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(new Error(`Signaling connection failed: ${error.message}`));
        }
      });

      // Handle incoming SDP offer from device
      this.socket.on('offer', async (data: { sdp: string; type: RTCSdpType }) => {
        try {
          await this.handleOffer(data);
        } catch (err) {
          console.error('[BrowserVoiceBridge] Error handling offer:', err);
          this.callbacks?.onError('Failed to handle device offer');
        }
      });

      // Handle incoming ICE candidates from device
      this.socket.on('ice-candidate', async (data: { candidate: string; sdpMid: string; sdpMLineIndex: number }) => {
        try {
          await this.handleRemoteIceCandidate(data);
        } catch (err) {
          console.error('[BrowserVoiceBridge] Error handling ICE candidate:', err);
        }
      });

      // Handle device disconnection — keep socket alive, just close peer
      this.socket.on('peer-left', () => {
        console.log('[BrowserVoiceBridge] Device peer left — keeping socket alive');
        this.callbacks?.onIceStatusChange('disconnected');
        this.hasRemoteDescription = false;
        this.pendingCandidates = [];
        if (this.peerConnection) {
          this.peerConnection.close();
          this.peerConnection = null;
        }
        // Don't go to idle — stay connected to signaling for end-call etc.
      });

      // Handle peer-ready: device is in the session — recreate peer connection
      this.socket.on('peer-ready', () => {
        console.log('[BrowserVoiceBridge] Device peer is ready — creating peer connection');
        if (!this.peerConnection) {
          this.createPeerConnection();
        }
      });

      // Handle call state changes from device
      this.socket.on('call-state', (data: CallStateEvent) => {
        console.log('[BrowserVoiceBridge] Call state:', data.state, data.duration ? `duration: ${data.duration}s` : '');
        this.callbacks?.onCallStateChange?.(data);
      });

      // Handle audio data via Socket.IO (fallback when DataChannel unavailable)
      let socketAudioChunks = 0;
      this.socket.on('audio-data', (data: { data: string; sampleRate: number; samples: number }) => {
        socketAudioChunks++;
        if (socketAudioChunks === 1) {
          console.log('[BrowserVoiceBridge] First audio chunk received via Socket.IO fallback');
        }
        if (socketAudioChunks % 200 === 0) {
          console.log('[BrowserVoiceBridge] Socket.IO audio chunks received:', socketAudioChunks);
        }
        this.playAudioChunk(data.data, data.sampleRate || 16000, data.samples);
      });
    });
  }

  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Explicitly declare we want to receive audio
    this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });

    // ICE candidate handling — send to device via signaling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        console.log('[BrowserVoiceBridge] Sending ICE candidate');
        this.socket.emit('ice-candidate', {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sessionId: this.sessionId,
        });
      }
    };

    // Connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection?.iceConnectionState;
      console.log('[BrowserVoiceBridge] ICE state:', iceState);
      switch (iceState) {
        case 'connected':
        case 'completed':
          this.callbacks?.onIceStatusChange('connected');
          this.setState('active');
          break;
        case 'checking':
          this.callbacks?.onIceStatusChange('searching');
          break;
        case 'disconnected':
          this.callbacks?.onIceStatusChange('disconnected');
          break;
        case 'failed':
          this.callbacks?.onIceStatusChange('failed');
          this.callbacks?.onError('ICE connection failed — check network');
          this.setState('error');
          break;
      }
    };

    // Receive remote audio stream from device
    this.peerConnection.ontrack = (event) => {
      console.log('[BrowserVoiceBridge] ontrack fired, streams:', event.streams.length, 'track kind:', event.track.kind);
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.callbacks?.onRemoteStream(stream);
    };

    // Handle DataChannel for call audio (captured natively on Android)
    this.peerConnection.ondatachannel = (event) => {
      console.log('[BrowserVoiceBridge] DataChannel received:', event.channel.label);
      const channel = event.channel;
      let chunksReceived = 0;
      channel.onmessage = (msgEvent) => {
        try {
          const msg = JSON.parse(msgEvent.data);
          if (msg.type === 'audio' && msg.data) {
            chunksReceived++;
            if (chunksReceived === 1) {
              console.log('[BrowserVoiceBridge] First audio chunk received via DataChannel');
            }
            if (chunksReceived % 200 === 0) {
              console.log('[BrowserVoiceBridge] DataChannel audio chunks received:', chunksReceived);
            }
            this.playAudioChunk(msg.data, msg.sampleRate || 16000, msg.samples);
          }
        } catch {
          // Ignore non-JSON messages
        }
      };
    };
  }

  private async handleOffer(data: { sdp: string; type: RTCSdpType }): Promise<void> {
    if (!this.peerConnection || !data.sdp) {
      console.warn('[BrowserVoiceBridge] Received offer but no peer connection or no SDP');
      return;
    }

    console.log('[BrowserVoiceBridge] Received offer, setting remote description...');
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription({ sdp: data.sdp, type: data.type })
    );
    this.hasRemoteDescription = true;
    console.log('[BrowserVoiceBridge] Remote description set, flushing', this.pendingCandidates.length, 'pending candidates');
    await this.flushPendingCandidates();

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    console.log('[BrowserVoiceBridge] Answer created and local description set, sending to device');

    this.socket?.emit('answer', {
      sdp: answer.sdp,
      type: answer.type,
      sessionId: this.sessionId,
    });
  }

  private async handleRemoteIceCandidate(data: {
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
  }): Promise<void> {
    if (!this.peerConnection) return;

    if (!this.hasRemoteDescription) {
      this.pendingCandidates.push(data);
      return;
    }

    await this.peerConnection.addIceCandidate(
      new RTCIceCandidate({
        candidate: data.candidate,
        sdpMid: data.sdpMid,
        sdpMLineIndex: data.sdpMLineIndex,
      })
    );
  }

  private async flushPendingCandidates(): Promise<void> {
    const candidates = this.pendingCandidates;
    this.pendingCandidates = [];
    for (const data of candidates) {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate({
            candidate: data.candidate,
            sdpMid: data.sdpMid,
            sdpMLineIndex: data.sdpMLineIndex,
          })
        );
      }
    }
  }

  private startLatencyMonitoring(): void {
    this.latencyInterval = setInterval(async () => {
      if (this.peerConnection && this.state === 'active') {
        try {
          const stats = await this.peerConnection.getStats();
          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              const rtt = report.currentRoundTripTime;
              if (rtt !== undefined) {
                this.callbacks?.onLatencyUpdate(Math.round(rtt * 1000));
              }
            }
          });
        } catch {
          // Stats may not always be available
        }
      }
    }, 2000);
  }

  private stopLatencyMonitoring(): void {
    if (this.latencyInterval) {
      clearInterval(this.latencyInterval);
      this.latencyInterval = null;
    }
  }

  private setState(state: BridgeState): void {
    this.state = state;
    this.callbacks?.onStateChange(state);
  }

  private nextPlayTime = 0;

  /**
   * Decode base64 PCM16 audio and play it via Web Audio API.
   * Schedules chunks sequentially to avoid overlap/gaps.
   */
  private playAudioChunk(base64Data: string, sampleRate: number, sampleCount: number): void {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      // AudioContext should have been created in connect(). If not running, skip.
      return;
    }

    // Decode base64 to binary
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Convert PCM16 little-endian to Float32
    const int16 = new Int16Array(bytes.buffer);
    const numSamples = sampleCount || int16.length;
    const float32 = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      float32[i] = int16[i] / 32768;
    }

    // Create AudioBuffer
    const audioBuffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    audioBuffer.getChannelData(0).set(float32);

    // Schedule playback sequentially to avoid gaps/overlap
    const now = this.audioContext.currentTime;
    const startTime = Math.max(now, this.nextPlayTime);
    this.nextPlayTime = startTime + audioBuffer.duration;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start(startTime);
  }
}

export const browserVoiceBridge = new BrowserVoiceBridge();
