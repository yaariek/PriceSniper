import { useState, useEffect, useCallback } from 'react';
import { LiveKitRoom, useRoomContext, RoomAudioRenderer, ControlBar } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import '@livekit/components-styles';

interface VoiceInputProps {
    onTranscription: (text: string) => void;
    className?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const VoiceInputContent = ({ onTranscription }: { onTranscription: (text: string) => void }) => {
    const room = useRoomContext();
    const [isListening, setIsListening] = useState(false);

    // Use Web Speech API for dictation as a reliable fallback/primary method
    const startDictation = useCallback(() => {
        if (!('webkitSpeechRecognition' in window)) {
            toast.error("Speech recognition not supported in this browser");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-GB';

        recognition.onstart = () => {
            setIsListening(true);
            toast.success("Listening...");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const result = event.results[0];
            if (result.isFinal) {
                const text = result[0].transcript;
                onTranscription(text);
            }
        }; recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            toast.error("Dictation failed");
        };

        recognition.start();
    }, [onTranscription]);

    // Keep LiveKit data listener for future agent integration
    useEffect(() => {
        if (!room) return;

        const onDataReceived = (payload: Uint8Array, participant: any, kind: DataPacket_Kind, topic?: string) => {
            if (topic === "transcription") {
                const text = new TextDecoder().decode(payload);
                onTranscription(text);
            }
        };

        room.on(RoomEvent.DataReceived, onDataReceived);
        return () => {
            room.off(RoomEvent.DataReceived, onDataReceived);
        };
    }, [room, onTranscription]);

    const toggleMicrophone = useCallback(async () => {
        // Prefer Web Speech API for simple dictation if no agent is confirmed
        startDictation();

        // Also toggle LiveKit mic if connected, for potential agent interaction
        if (room) {
            const isEnabled = room.localParticipant.isMicrophoneEnabled;
            try {
                await room.localParticipant.setMicrophoneEnabled(!isEnabled);
            } catch (error) {
                console.error("Failed to toggle LiveKit microphone:", error);
            }
        }
    }, [room, startDictation]);

    return (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                variant={isListening ? "destructive" : "secondary"}
                size="sm"
                onClick={toggleMicrophone}
                className="gap-2"
            >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isListening ? "Stop Recording" : "Dictate Description"}
            </Button>
            {isListening && (
                <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            )}
        </div>
    );
};

export const VoiceInput = ({ onTranscription, className }: VoiceInputProps) => {
    const [token, setToken] = useState<string>("");
    const [url, setUrl] = useState<string>("");
    const [isConnecting, setIsConnecting] = useState(false);

    const connect = async () => {
        setIsConnecting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/voice/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_name: `job-${Math.random().toString(36).substring(7)}`,
                    identity: `user-${Math.random().toString(36).substring(7)}`
                })
            });

            if (!response.ok) throw new Error('Failed to get token');

            const data = await response.json();
            setToken(data.token);
            setUrl(data.url);
        } catch (error) {
            console.error(error);
            toast.error("Failed to connect to voice service");
        } finally {
            setIsConnecting(false);
        }
    };

    if (!token) {
        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={connect}
                disabled={isConnecting}
                className={className}
            >
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                Enable Voice Input
            </Button>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={url}
            connect={true}
            audio={true}
            video={false}
            className={className}
            onDisconnected={() => setToken("")}
        >
            <VoiceInputContent onTranscription={onTranscription} />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
};
