import { useRef, useState, type ChangeEvent } from 'react';
import { Send, Smile, Mic, Paperclip } from 'lucide-react';
import { sendMessage } from '../../hooks/queries/useChat';
import { uploadChatMedia } from '../../lib/storage';
import type { Profile } from '../../types/database';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../ui/cn';

const QUICK_EMOJIS = ['😀', '😂', '😍', '👍', '🎉', '🔥', '😢', '🙏'];

const MAX_FILE_BYTES = 1024 * 1024; // 1MB
const MAX_VOICE_MS = 30_000; // 30s

export function MessageInput({ conversationKey, me }: { conversationKey: string; me: Profile }) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function send(content: string | null, type: 'text' | 'emoji' | 'voice' | 'file', mediaUrl?: string | null) {
    if (!content && !mediaUrl) return;
    setBusy(true);
    sendMessage({ conversationKey, senderId: me.id, content, type, mediaUrl })
      .then(() => setText(''))
      .catch((e) => console.error('[chat] 发送失败', e))
      .finally(() => setBusy(false));
  }

  function startRecording() {
    if (!navigator.mediaDevices) return;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const rec = new MediaRecorder(stream);
        recorderRef.current = rec;
        chunksRef.current = [];
        rec.ondataavailable = (e) => chunksRef.current.push(e.data);
        rec.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach((t) => t.stop());
          if (blob.size === 0) return;
          setBusy(true);
          uploadChatMedia(new File([blob], 'voice.webm', { type: 'audio/webm' }), conversationKey)
            .then((url) => send(null, 'voice', url))
            .catch((e) => console.error('[chat] 语音上传失败', e))
            .finally(() => setBusy(false));
        };
        rec.start();
        setRecording(true);
        setTimeout(() => {
          if (rec.state === 'recording') rec.stop();
        }, MAX_VOICE_MS);
      })
      .catch((e) => console.error('[chat] 无法访问麦克风', e));
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setRecording(false);
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      alert('文件不能超过 1MB');
      return;
    }
    setBusy(true);
    uploadChatMedia(file, conversationKey)
      .then((url) => send(null, 'file', url))
      .catch((err) => console.error('[chat] 文件上传失败', err))
      .finally(() => setBusy(false));
    e.target.value = '';
  }

  return (
    <div className="border-t border-black/5 bg-white p-3">
      {showEmoji && (
        <div className="mb-2 flex gap-1 rounded-xl bg-white p-1 shadow-lift ring-1 ring-black/5">
          {QUICK_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => {
                setText((t) => t + em);
                setShowEmoji(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-black/5"
            >
              {em}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmoji((s) => !s)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-black/5"
          aria-label="表情"
        >
          <Smile className="h-5 w-5" />
        </button>
        <button
          type="button"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={() => recording && stopRecording()}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/5',
            recording ? 'text-brand' : 'text-gray-500',
          )}
          aria-label="按住录音（≤30秒）"
        >
          <Mic className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-black/5"
          aria-label="上传文件（≤1MB）"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入消息，回车发送…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(text.trim() || null, 'text');
            }
          }}
        />
        <Button disabled={busy || !text.trim()} onClick={() => send(text.trim() || null, 'text')}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
