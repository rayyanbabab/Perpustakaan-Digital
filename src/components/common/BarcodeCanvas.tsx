import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeCanvasProps {
  value: string;
  format?: 'CODE128' | 'CODE39' | 'EAN13';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeCanvas: React.FC<BarcodeCanvasProps> = ({
  value,
  format = 'CODE128',
  width = 1.6,
  height = 40,
  displayValue = true,
  fontSize = 12,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          margin: 6,
          background: '#ffffff',
          lineColor: '#0f172a'
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  return <svg ref={svgRef} className={`barcode-svg max-w-full ${className}`} />;
};
