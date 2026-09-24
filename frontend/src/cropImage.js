export const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Se fija el tamaño del canvas al tamaño del área recortada real
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // Dibujar la porción seleccionada sin alterar las proporciones
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      // Exportar en formato base64 con calidad 0.75
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };

    image.onerror = (error) => reject(error);
  });
};