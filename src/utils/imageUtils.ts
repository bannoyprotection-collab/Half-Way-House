/**
 * Utility functions for resizing and compressing images to Base64 JPEG data URLs
 * Suitable for local storage and Firestore storage (< 100KB per image).
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export async function resizeImageBase64(
  base64: string,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('รูปภาพไม่ถูกต้องหรือไม่รองรับ'));
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      const scale = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.src = base64;
  });
}

export async function compressImageFileToBase64(
  file: File,
  maxDimension = 720,
  quality = 0.75
): Promise<string> {
  const base64 = await fileToBase64(file);
  return resizeImageBase64(base64, maxDimension, maxDimension, quality);
}

