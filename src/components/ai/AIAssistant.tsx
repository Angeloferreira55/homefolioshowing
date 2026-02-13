import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, X, Loader2, Sparkles, Volume2, VolumeX, Pause, Play, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your HomeFolio AI assistant. I can help you with questions about using HomeFolio, creating sessions, adding properties, and more. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to use the AI assistant');
        setLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: userMessage.content,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (response.error) {
        throw response.error;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response || 'Sorry, I couldn\'t generate a response. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-generate voice if auto-play is enabled
      if (autoPlay) {
        const messageIndex = messages.length + 1; // +1 because we just added the message
        await generateVoice(assistantMessage.content, messageIndex);
      }
    } catch (error) {
      console.error('AI assistant error:', error);
      toast.error('Failed to get response. Please try again.');

      // Add fallback response
      const fallbackMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try asking your question in the Help page or contact our support team at support@home-folio.net.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateVoice = async (text: string, messageIndex: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text },
      });

      if (response.error) {
        console.error('Voice generation error:', response.error);
        return;
      }

      // Update message with audio URL
      setMessages(prev => prev.map((msg, idx) =>
        idx === messageIndex ? { ...msg, audioUrl: response.data.audioUrl } : msg
      ));

      // Auto-play if enabled
      if (autoPlay && response.data.audioUrl) {
        playAudio(response.data.audioUrl, messageIndex);
      }
    } catch (error) {
      console.error('Failed to generate voice:', error);
    }
  };

  const playAudio = (audioUrl: string, messageIndex: number) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingIndex(messageIndex);

    audio.onended = () => {
      setPlayingIndex(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      toast.error('Failed to play audio');
      setPlayingIndex(null);
      audioRef.current = null;
    };

    audio.play().catch(error => {
      console.error('Audio playback error:', error);
      toast.error('Failed to play audio');
      setPlayingIndex(null);
    });
  };

  const toggleAudio = async (message: Message, messageIndex: number) => {
    if (playingIndex === messageIndex) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingIndex(null);
    } else if (message.audioUrl) {
      // Play existing audio
      playAudio(message.audioUrl, messageIndex);
    } else {
      // Generate and play new audio
      await generateVoice(message.content, messageIndex);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingIndex(null);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Chat Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] h-[600px] p-0 gap-0 flex flex-col">
          <DialogHeader className="p-4 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-display">HomeFolio AI Assistant</DialogTitle>
                  <p className="text-xs text-muted-foreground">Ask me anything about HomeFolio</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-xs font-medium">AI Assistant</span>
                      </div>
                      <button
                        onClick={() => toggleAudio(message, index)}
                        className="p-1 hover:bg-background/50 rounded transition-colors"
                        aria-label={playingIndex === index ? 'Pause' : 'Play'}
                      >
                        {playingIndex === index ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Settings */}
          {showSettings && (
            <div className="px-4 py-3 border-t bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="auto-play" className="text-sm font-medium">Auto-play voice responses</Label>
                </div>
                <Switch
                  id="auto-play"
                  checked={autoPlay}
                  onCheckedChange={setAutoPlay}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                When enabled, AI responses will be automatically spoken using ElevenLabs text-to-speech.
              </p>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="shrink-0"
                title="Voice settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
              {playingIndex !== null && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stopAudio}
                  className="shrink-0"
                  title="Stop audio"
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                size="icon"
                className="shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI responses may not always be accurate. For important matters, contact support.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
