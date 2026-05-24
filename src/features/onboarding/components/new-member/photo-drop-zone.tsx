/**
 * photo-drop-zone.tsx — HTML5 drag-and-drop photo uploader.
 * BIBLE: HotSeatersMVP/src/components/onboarding/NewMemberOnboarding.jsx
 * (handleDrop / handleDragOver / handleDragLeave / handleFileSelect).
 *
 * - Native HTML5 DnD (onDragOver/Enter/Leave/Drop).
 * - Hover overlay state: border becomes `border-primary border-dashed`
 *   with overlay text "Drop photo here".
 * - Accepts only image/* MIME; otherwise shows inline error.
 * - Click anywhere to open the file picker.
 * - 96×96 rounded-square preview via URL.createObjectURL.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface Props {
  onFileSelected: (file: File) => void;
  currentPreviewUrl?: string | undefined;
}

export function PhotoDropZone({ onFileSelected, currentPreviewUrl }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke the object URL we created when it changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (localPreview && localPreview.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const handleFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('Please choose an image file.');
        return;
      }
      setError(null);
      const url = URL.createObjectURL(file);
      setLocalPreview((prev) => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const previewSrc = currentPreviewUrl ?? localPreview;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        className={cn(
          'relative w-24 h-24 rounded-lg overflow-hidden border-2 flex items-center justify-center cursor-pointer transition-colors',
          dragOver
            ? 'border-primary border-dashed bg-primary/5'
            : 'border-dashed border-stone-300 hover:border-primary/60 bg-stone-50'
        )}
      >
        {previewSrc ? (
          <img src={previewSrc} alt="Profile preview" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus className="w-8 h-8 text-stone-400" aria-hidden />
        )}
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 text-primary text-xs font-medium pointer-events-none">
            Drop photo here
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
