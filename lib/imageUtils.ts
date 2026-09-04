export const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) {
    return 'https://picsum.photos/seed/placeholder/800/800';
  }
  
  // If it's already a full URL or data URI, return it
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // If it already starts with /uploads/ or uploads/, return it with leading slash
  if (imagePath.startsWith('/uploads/')) {
    return imagePath;
  }
  if (imagePath.startsWith('uploads/')) {
    return `/${imagePath}`;
  }

  // If it starts with clothes/ or /clothes/, return it as-is with a leading slash
  if (imagePath.startsWith('/clothes/') || imagePath.startsWith('clothes/')) {
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  }
  
  // Otherwise, assume it's a local path in the uploads folder
  return `/uploads/${imagePath}`;
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
