import heic2any from 'heic2any';

export interface HeicConversionResult {
  success: boolean;
  file?: File;
  error?: string;
}

export async function convertHeicToJpeg(file: File): Promise<HeicConversionResult> {
  console.log('🔄 Starting HEIC conversion for:', file.name);
  
  try {
    // Try different conversion options
    const conversionOptions = [
      { toType: 'image/jpeg', quality: 0.9 },
      { toType: 'image/jpeg', quality: 0.8 },
      { toType: 'image/jpeg', quality: 0.7 },
      { toType: 'image/png', quality: 0.9 },
    ];

    for (const options of conversionOptions) {
      try {
        console.log(`🔄 Trying conversion with options:`, options);
        
        let converted = await heic2any({ 
          blob: file, 
          ...options 
        });
        
        if (Array.isArray(converted)) {
          converted = converted[0];
        }
        
        const outputType = options.toType === 'image/png' ? 'png' : 'jpg';
        const jpegFile = new File([converted], file.name.replace(/\.(heic|heif)$/i, `.${outputType}`), { 
          type: options.toType 
        });
        
        console.log('✅ HEIC conversion successful:', jpegFile.name);
        return { success: true, file: jpegFile };
        
      } catch (conversionError) {
        console.log(`❌ Conversion failed with options:`, options, conversionError);
        continue; // Try next option
      }
    }
    
    // If all conversion attempts failed, try a different approach
    console.log('🔄 All standard conversions failed, trying alternative approach...');
    
    try {
      // Try with minimal options
      const converted = await heic2any({ blob: file });
      const jpegFile = new File([converted as Blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { 
        type: 'image/jpeg' 
      });
      
      console.log('✅ Alternative HEIC conversion successful:', jpegFile.name);
      return { success: true, file: jpegFile };
      
    } catch (alternativeError) {
      console.error('❌ Alternative conversion also failed:', alternativeError);
      
      // If all else fails, try to create a canvas-based conversion
      return await tryCanvasConversion(file);
    }
    
  } catch (error) {
    console.error('❌ HEIC conversion completely failed:', error);
    return { 
      success: false, 
      error: 'HEIC-kuvan muuntaminen epäonnistui. Tämä HEIC-tiedosto ei ole tuettu.' 
    };
  }
}

async function tryCanvasConversion(file: File): Promise<HeicConversionResult> {
  try {
    console.log('🔄 Trying canvas-based conversion...');
    
    // Create a canvas and try to draw the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    
    // Create an image element
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        try {
          // Set canvas size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const jpegFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { 
                type: 'image/jpeg' 
              });
              console.log('✅ Canvas conversion successful:', jpegFile.name);
              resolve({ success: true, file: jpegFile });
            } else {
              console.error('❌ Canvas blob creation failed');
              resolve({ 
                success: false, 
                error: 'HEIC-kuvan muuntaminen epäonnistui. Tämä HEIC-tiedosto ei ole tuettu.' 
              });
            }
          }, 'image/jpeg', 0.9);
          
        } catch (canvasError) {
          console.error('❌ Canvas conversion failed:', canvasError);
          resolve({ 
            success: false, 
            error: 'HEIC-kuvan muuntaminen epäonnistui. Tämä HEIC-tiedosto ei ole tuettu.' 
          });
        }
      };
      
      img.onerror = () => {
        console.error('❌ Image loading failed for canvas conversion');
        resolve({ 
          success: false, 
          error: 'HEIC-kuvan muuntaminen epäonnistui. Tämä HEIC-tiedosto ei ole tuettu.' 
        });
      };
      
      // Create object URL and load image
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      
      // Clean up object URL after a delay
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    });
    
  } catch (error) {
    console.error('❌ Canvas conversion setup failed:', error);
    return { 
      success: false, 
      error: 'HEIC-kuvan muuntaminen epäonnistui. Tämä HEIC-tiedosto ei ole tuettu.' 
    };
  }
}

export function isHeicFile(file: File): boolean {
  return (
    file.type === 'image/heic' || 
    file.type === 'image/heif' || 
    file.name.toLowerCase().endsWith('.heic') || 
    file.name.toLowerCase().endsWith('.heif')
  );
} 