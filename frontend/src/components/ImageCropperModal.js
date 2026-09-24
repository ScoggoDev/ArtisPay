import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../cropImage.js'; 

function ImageCropperModal({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropChange = (crop) => setCrop(crop);
  const handleZoomChange = (zoom) => setZoom(zoom);

  const onCropCompleteHandler = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage); // Devuelve la imagen final recortada
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ position: 'relative', width: '90%', height: '60vh', maxLeft: '500px' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1} // Proporción 1:1
          cropShape="round" // Máscara circular
          showGrid={false}
          onCropChange={handleCropChange}
          onZoomChange={handleZoomChange}
          onCropComplete={onCropCompleteHandler}
        />
      </div>

      {/* Control de Zoom y Botones */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSave} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Guardar Recorte
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;