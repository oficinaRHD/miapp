// Shares text through the system share sheet (Android) or the browser. If sharing is not
// available it copies the text instead, so the user always gets something.
import { Share } from '@capacitor/share';
import { copyText } from './clipboard';

export type ShareResult = 'shared' | 'cancelled' | 'copied' | 'failed';

function wasCancelled(e: unknown): boolean {
  const text = `${e instanceof Error ? e.name : ''} ${e instanceof Error ? e.message : String(e)}`.toLowerCase();
  return text.includes('cancel') || text.includes('abort');
}

export async function shareText(title: string, text: string): Promise<ShareResult> {
  try {
    await Share.share({ title, text, dialogTitle: title });
    return 'shared';
  } catch (e) {
    if (wasCancelled(e)) return 'cancelled';
    return (await copyText(text)) ? 'copied' : 'failed';
  }
}
