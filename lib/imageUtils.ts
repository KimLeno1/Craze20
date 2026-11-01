export const getImageUrl = (imagePath: any): string => {
  if (!imagePath) {
    return 'https://picsum.photos/seed/placeholder/800/800';
  }

  // Handle arrays
  if (Array.isArray(imagePath)) {
    return getImageUrl(imagePath[0]);
  }

  if (typeof imagePath !== 'string') {
    return 'https://picsum.photos/seed/placeholder/800/800';
  }

  let raw = imagePath.trim();

  // Handle JSON array string
  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return getImageUrl(parsed[0]);
      }
    } catch {
      // continue with raw
    }
  }

  // Handle comma-separated list
  if (raw.includes(',')) {
    const first = raw.split(',')[0].trim();
    if (first) {
      raw = first;
    }
  }

  // If protocol-relative URL
  if (raw.startsWith('//')) {
    return `https:${raw}`;
  }
  
  // If it's already a full URL or data URI, return it
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
    return raw;
  }
  
  // If it already starts with /uploads/ or uploads/, return it with leading slash
  if (raw.startsWith('/uploads/')) {
    return raw;
  }
  if (raw.startsWith('uploads/')) {
    return `/${raw}`;
  }

  // If it starts with clothes/ or /clothes/, return it as-is with a leading slash
  if (raw.startsWith('/clothes/') || raw.startsWith('clothes/')) {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
  
  // Otherwise, assume it's a local path in the uploads folder
  return `/uploads/${raw}`;
};

export const compressImage = async (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};
