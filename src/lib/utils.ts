import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

export function getTemporalContext(userTimezone?: string) {
  const tz = userTimezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC') || 'UTC';
  const now = new Date();

  let formattedDate = '';
  let formattedTime = '';
  let dayOfWeek = '';
  let fullDate = '';

  try {
    formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: tz
    }).format(now);

    formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
      timeZone: tz,
      timeZoneName: 'short'
    }).format(now);

    dayOfWeek = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: tz
    }).format(now);

    fullDate = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: tz
    }).format(now);
  } catch (e) {
    formattedDate = now.toDateString();
    formattedTime = now.toTimeString();
    dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    fullDate = now.toUTCString();
  }

  return {
    timezone: tz,
    year: now.getFullYear(),
    dayOfWeek,
    formattedDate,
    formattedTime,
    fullDate,
    iso: now.toISOString()
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn("Failed to copy text:", err);
    return false;
  }
}

export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      let pngBlob: Blob | null = null;

      if (imageUrl.startsWith('data:image/png')) {
        const res = await fetch(imageUrl);
        pngBlob = await res.blob();
      } else {
        pngBlob = await new Promise<Blob | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth || img.width;
              canvas.height = img.naturalHeight || img.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) return resolve(null);
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((b) => resolve(b), 'image/png');
            } catch (e) {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = imageUrl;
        });
      }

      if (pngBlob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ]);
        return true;
      }
    }
  } catch (err) {
    console.warn("Direct image copy to clipboard failed:", err);
  }

  return copyTextToClipboard(imageUrl);
}
