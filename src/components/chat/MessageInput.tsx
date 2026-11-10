import { useRef, useState, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Send, Smile, Mic, Paperclip } from 'lucide-react';
import { sendMessage } from '../../hooks/queries/useChat';
import { uploadChatMedia } from '../../lib/storage';
import { useToast } from '../ui/Toast';
import type { Profile } from '../../types/database';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { cn } from '../ui/cn';

const QUICK_EMOJIS = ['😀', '😂', '😍', '👍', '🎉', '🔥', '😢', '🙏'];
const MAX_FILE_BYTES = 1024 * 1024; // 1MB
const MAX_VOICE_MS = 30_000; // 30s

type PendingFile = { path: string; name: string; kind: 'file' | 'voice' };

export function MessageInput({
  conversationKey,
  me,
  members = [],
}: {
  conversationKey: string;
  me: Profile;
  members?: Profile[];
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const mentionMatches = mentionOpen
    ? members.filter((m) => m.display_name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
    : [];

  function applyMention(name: string) {
    setText((t) => t.replace(/(^|\s)@[^\s@]*$/, `$1@${name} `));
    setMentionOpen(false);
    setMentionQuery('');
  }

  function onChange(value: string) {
    setText(value);
    const m = value.match(/(?:^|\s)@([^\s@]*)$/);
    if (m) {
      setMentionOpen(true);
      setMentionQuery(m[1]);
    } else {
      setMentionOpen(false);
    }
  }

  async function send() {
    const txt = text.trim();
    if (!txt && !pendingFile) return;
    setBusy(true);
    try {
      if (pendingFile) {
        await sendMessage({
          conversationKey,
          senderId: me.id,
          content: pendingFile.path,
          content_type: pendingFile.kind,
          queryClient: qc,
        });
      }
      if (txt) {
        await sendMessage({
          conversationKey,
          senderId: me.id,
          content: txt,
          content_type: 'text',
          queryClient: qc,
        });
      }
      setText('');
      setPendingFile(null);
      setMentionOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '发送失败');
    } finally {
      setBusy(false);
    }
  }

  function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('当前环境不支持录音');
      return;
    }
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
            .then((path) => setPendingFile({ path, name: '语音消息', kind: 'voice' }))
            .catch((e) => toast.error(e instanceof Error ? e.message : '语音上传失败'))
            .finally(() => setBusy(false));
        };
        rec.start();
        setRecording(true);
        setTimeout(() => {
          if (rec.state === 'recording') rec.stop();
        }, MAX_VOICE_MS);
      })
      .catch(() => toast.error('无法访问麦克风，请检查浏览器权限'));
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setRecording(false);
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error('文件不能超过 1MB');
      return;
    }
    setBusy(true);
    uploadChatMedia(file, conversationKey)
      .then((path) => setPendingFile({ path, name: file.name, kind: 'file' }))
      .catch((err) => toast.error(err instanceof Error ? err.message : '文件上传失败'))
      .finally(() => setBusy(false));
  }

  return (
    <div className="relative border-t border-black/5 bg-white p-3">
      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2">
          <span className="text-sm text-gray-700">
            {pendingFile.kind === 'voice' ? '🎤' : '📎'} {pendingFile.name}
          </span>
          <button
            type="button"
            onClick={() => setPendingFile(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
            aria-label="移除附件"
          >
            ✕
          </button>
        </div>
      )}
      {mentionOpen && mentionMatches.length > 0 && (
        <div className="absolute bottom-full left-3 mb-1 w-56 overflow-hidden rounded-xl bg-white shadow-lift ring-1 ring-black/5">
          {mentionMatches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => applyMention(m.display_name)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs text-white">
                {m.display_name.slice(0, 1)}
              </span>
              {m.display_name}
            </button>
          ))}
        </div>
      )}
      {showEmoji && (
        <div className="absolute bottom-full left-3 mb-1 flex gap-1 rounded-xl bg-white p-1 shadow-lift ring-1 ring-black/5">
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
      <div className="flex items-end gap-2">
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
        <Textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="输入消息，回车发送，Shift+回车换行，输入 @ 提及…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none break-words"
        />
        <Button disabled={busy || (!text.trim() && !pendingFile)} onClick={() => void send()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
