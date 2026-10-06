import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
export type CaptchaValue = { id: string; code: string };
export function CaptchaField({
  api,
  purpose,
  value,
  onChange,
  busy,
  refreshToken = 0,
}: {
  api: Api;
  purpose: 'login' | 'register' | 'admin' | 'reset';
  value: CaptchaValue;
  onChange: (value: CaptchaValue) => void;
  busy: boolean;
  refreshToken?: number;
}) {
  const [image, setImage] = useState(''),
    [error, setError] = useState(''),
    [version, setVersion] = useState(0),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    onChange({ id: '', code: '' });
    setImage('');
    void api
      .request<{ id: string; image: string }>(`/api/auth/captcha?purpose=${purpose}`, {
        signal: controller.signal,
      })
      .then((result) => {
        onChange({ id: result.id, code: '' });
        setImage(result.image);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError((err as Error).message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api.session.server, purpose, version, refreshToken]);
  return (
    <div className="space-y-2">
      <Label htmlFor={`captcha-${purpose}`}>图形验证码</Label>
      <div className="flex items-center gap-2">
        <Input
          id={`captcha-${purpose}`}
          className="min-w-0 flex-1"
          value={value.code}
          onChange={(e) => onChange({ ...value, code: e.target.value })}
          maxLength={5}
          required
          disabled={busy || loading}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="图片中的字符"
        />
        <button
          type="button"
          onClick={() => setVersion((v) => v + 1)}
          disabled={busy || loading}
          aria-label="刷新图形验证码"
          data-captcha-id={value.id}
          className="h-12 w-32 shrink-0 overflow-hidden rounded-lg border bg-secondary"
        >
          {image ? (
            <img className="h-full w-full object-contain" src={image} alt="图形验证码图片" />
          ) : (
            <RefreshCw className="mx-auto size-4" />
          )}
        </button>
      </div>
      {error && (
        <div role="alert" className="flex items-center gap-2 text-xs text-destructive">
          <span>{error}</span>
          <Button size="sm" variant="ghost" type="button" onClick={() => setVersion((v) => v + 1)}>
            重新获取
          </Button>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">不区分大小写，点击图片可以更换。</p>
    </div>
  );
}
