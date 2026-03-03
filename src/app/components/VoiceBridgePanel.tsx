/**
 * Voice Bridge Panel
 *
 * UI component for the WebRTC voice bridge connection to the Android device.
 * Shows connection status, latency, call state, and audio playback controls.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Phone, PhoneOff, Wifi, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

import { toast } from 'sonner';
import { browserVoiceBridge, BridgeState, IceStatus, CallState } from '../services/BrowserVoiceBridge';
import { useCRM } from '../contexts/CRMContext';
import { useLanguage } from '../contexts/LanguageContext';

export function VoiceBridgePanel() {
  const { settings } = useCRM();
  const { language } = useLanguage();
  const [bridgeState, setBridgeState] = useState<BridgeState>('idle');
  const [iceStatus, setIceStatus] = useState<IceStatus>('disconnected');
  const [latency, setLatency] = useState<number | null>(null);
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive signaling URL — use current origin (Vite proxies /socket.io to backend)
  const signalingUrl = window.location.origin;

  // Call timer
  useEffect(() => {
    if (callState === 'OFFHOOK') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (callState === 'IDLE') {
        setCallDuration(0);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callState]);

  useEffect(() => {
    browserVoiceBridge.setCallbacks({
      onStateChange: setBridgeState,
      onIceStatusChange: setIceStatus,
      onLatencyUpdate: setLatency,
      onError: (error) => {
        toast.error(language === 'ar' ? `خطأ في جسر الصوت: ${error}` : `Voice Bridge error: ${error}`);
      },
      onRemoteStream: (stream) => {
        console.log('[VoiceBridgePanel] Remote stream received, tracks:', stream.getAudioTracks().length);
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
          audioRef.current.play().catch((err) => {
            console.warn('[VoiceBridgePanel] Autoplay blocked:', err);
            toast.error(language === 'ar'
              ? 'انقر في أي مكان بالصفحة لتشغيل الصوت'
              : 'Click anywhere on the page to enable audio playback');
          });
        }
      },
      onCallStateChange: (event) => {
        setCallState(event.state);
        if (event.state === 'IDLE' && event.duration && event.duration > 0) {
          toast.info(language === 'ar'
            ? `انتهت المكالمة (${event.duration} ثانية)`
            : `Call ended (${event.duration}s)`);
        }
      },
    });

    return () => {
      browserVoiceBridge.disconnect();
    };
  }, [language]);

  const handleConnect = useCallback(() => {
    browserVoiceBridge.connect(signalingUrl);
  }, [signalingUrl]);

  const handleDisconnect = useCallback(() => {
    browserVoiceBridge.disconnect();
    setLatency(null);
    setCallState('IDLE');
    setCallDuration(0);
  }, []);

  const handleEndCall = useCallback(async () => {
    setIsEndingCall(true);
    try {
      const result = await browserVoiceBridge.endCall();
      if (result.error) {
        toast.error(language === 'ar' ? `فشل إنهاء المكالمة: ${result.error}` : `Failed to end call: ${result.error}`);
      } else {
        toast.success(language === 'ar' ? 'تم إنهاء المكالمة' : 'Call ended');
      }
    } catch {
      toast.error(language === 'ar' ? 'فشل إنهاء المكالمة' : 'Failed to end call');
    }
    setIsEndingCall(false);
  }, [language]);

  const isConnected = bridgeState === 'active';
  const isConnecting = bridgeState === 'connecting';
  const isInCall = callState === 'OFFHOOK' || callState === 'RINGING';
  // Show call controls even when WebRTC is down — end-call goes through signaling socket
  const showCallControls = isConnected || isInCall;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stateLabel = {
    idle: language === 'ar' ? 'غير متصل' : 'Disconnected',
    connecting: language === 'ar' ? 'جاري الاتصال...' : 'Connecting...',
    active: language === 'ar' ? 'متصل' : 'Connected',
    error: language === 'ar' ? 'خطأ' : 'Error',
  }[bridgeState];

  const stateColor = {
    idle: 'secondary' as const,
    connecting: 'outline' as const,
    active: 'default' as const,
    error: 'destructive' as const,
  }[bridgeState];

  const callStateLabel = {
    IDLE: language === 'ar' ? 'لا توجد مكالمة' : 'No active call',
    RINGING: language === 'ar' ? 'جاري الرنين...' : 'Ringing...',
    OFFHOOK: language === 'ar' ? 'مكالمة جارية' : 'Call active',
  }[callState];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Volume2 className="h-5 w-5" />
            {language === 'ar' ? 'جسر الصوت WebRTC' : 'WebRTC Voice Bridge'}
          </CardTitle>
          <Badge variant={stateColor}>{stateLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden audio element for playback */}
        <audio ref={audioRef} autoPlay />

        {!isConnected && !isConnecting && !isInCall && (
          <>
            <p className="text-xs text-muted-foreground">
              {language === 'ar'
                ? 'تأكد من تشغيل جسر الصوت في تطبيق Android ثم اضغط اتصال'
                : 'Make sure Voice Bridge is running on the Android app, then click Connect'}
            </p>
            <Button
              onClick={handleConnect}
              className="w-full gap-2"
            >
              <Phone className="h-4 w-4" />
              {language === 'ar' ? 'اتصل بجسر الصوت' : 'Connect Voice Bridge'}
            </Button>
          </>
        )}

        {isConnecting && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            <span className="text-sm">{language === 'ar' ? 'جاري الاتصال بالجهاز...' : 'Connecting to device...'}</span>
          </div>
        )}

        {showCallControls && (
          <>
            {/* Connection Info */}
            {isConnected && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">ICE</span>
                  </div>
                  <span className="text-sm font-medium capitalize">{iceStatus}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {language === 'ar' ? 'زمن الاستجابة' : 'Latency'}
                  </div>
                  <span className="text-sm font-medium">
                    {latency !== null ? `${latency}ms` : '—'}
                  </span>
                </div>
              </div>
            )}

            {/* Call State */}
            <div className={`p-3 rounded-lg text-center ${
              callState === 'OFFHOOK' ? 'bg-green-500/10 border border-green-500/30' :
              callState === 'RINGING' ? 'bg-yellow-500/10 border border-yellow-500/30' :
              'bg-muted/50'
            }`}>
              <div className="text-sm font-medium">{callStateLabel}</div>
              {callState === 'OFFHOOK' && (
                <div className="text-lg font-mono mt-1">{formatTime(callDuration)}</div>
              )}
              {callState === 'RINGING' && (
                <div className="text-xs text-muted-foreground mt-1 animate-pulse">
                  {language === 'ar' ? 'في انتظار الرد...' : 'Waiting for answer...'}
                </div>
              )}
            </div>

            {/* End Call Button */}
            {isInCall && (
              <Button
                onClick={handleEndCall}
                variant="destructive"
                className="w-full gap-2"
                disabled={isEndingCall}
              >
                <PhoneOff className="h-4 w-4" />
                {isEndingCall
                  ? (language === 'ar' ? 'جاري إنهاء المكالمة...' : 'Ending call...')
                  : (language === 'ar' ? 'إنهاء المكالمة' : 'End Call')
                }
              </Button>
            )}

            {isConnected && (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full gap-2"
              >
                <PhoneOff className="h-4 w-4" />
                {language === 'ar' ? 'قطع الاتصال' : 'Disconnect'}
              </Button>
            )}
          </>
        )}

        {bridgeState === 'error' && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {language === 'ar'
              ? 'فشل الاتصال بجسر الصوت. تأكد من تشغيل الجسر على جهاز Android.'
              : 'Failed to connect. Make sure Voice Bridge is running on the Android device.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
