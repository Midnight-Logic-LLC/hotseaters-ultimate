import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileSignature,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eraser,
  Send,
} from 'lucide-react';
import { generateThemeCSS } from '@/shared/lib/theme';

// DocumentDisplay is a sub-component not yet ported — stub renders document
// placeholder per bible spec. Functional parity for the signing flow is
// preserved; visual parity for document preview lands when DocumentDisplay ports.
function DocumentDisplayStub({
  documentData,
}: {
  documentData: SignDocumentData | null;
}) {
  const documentName = documentData?.document?.document_name ?? 'Document';
  const companyLogo = documentData?.company?.logo;
  const pdfUrl = documentData?.document?.pdf_url;

  return (
    <Card
      className="mb-6"
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        backgroundColor: 'var(--theme-card-bg)',
        borderWidth: 'var(--theme-card-border)',
        borderColor: 'var(--theme-stone-200)',
      }}
    >
      <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
        <div
          className="grid grid-cols-2 mb-4 sm:mb-6 pb-4"
          style={{
            gap: 'var(--theme-card-gap)',
            borderBottomWidth: '1px',
            borderBottomColor: 'var(--theme-stone-200)',
          }}
        >
          <div className="flex flex-col justify-center">
            <h1
              className="break-words"
              style={{
                fontSize: 'var(--theme-text-card-title)',
                fontWeight: '700',
                color: 'var(--theme-stone-900)',
                fontFamily: 'var(--theme-font-body)',
              }}
            >
              {documentName}
            </h1>
          </div>
          {companyLogo && (
            <div className="flex justify-end items-center">
              <img
                src={companyLogo}
                alt="Company logo"
                className="h-12 sm:h-16 w-auto object-contain"
              />
            </div>
          )}
        </div>
        {pdfUrl ? (
          <div
            className="border flex items-center justify-center"
            style={{
              borderRadius: 'var(--theme-input-radius)',
              borderColor: 'var(--theme-stone-200)',
              minHeight: '60vh',
            }}
          >
            <iframe
              src={pdfUrl}
              title={documentName}
              className="w-full"
              style={{ height: '70vh', border: 'none' }}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p
              style={{
                color: 'var(--theme-danger)',
                fontSize: 'var(--theme-text-body)',
              }}
            >
              No PDF URL available. Please contact support.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignerInfo {
  signer_name?: string;
  signer_email?: string;
}

interface DocumentInfo {
  document_name?: string;
  pdf_url?: string;
}

interface CompanyInfo {
  logo?: string;
  theme?: Record<string, unknown>;
  custom_fonts?: string[];
}

interface SignDocumentData {
  signer?: SignerInfo;
  document?: DocumentInfo;
  company?: CompanyInfo;
  trial?: {
    case_name?: string;
    case_number?: string;
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * SignDocumentPage — port of HotSeatersMVP/src/pages/SignDocument.jsx.
 *
 * Public/unauthenticated page — accessible by external signers via a token
 * link. Calls backend functions directly (no Supabase auth session required).
 *
 * Business rules preserved from bible:
 * - Reads `?token=` and `?view_only=true` from URL search params.
 * - Fetches document data from `/api/functions/getDocumentForSigning`.
 * - Renders loading / error / already-signed / view-only / sign states.
 * - Signature pad: canvas with mouse + touch support, clear button.
 * - On submit: uploads signature to `/api/functions/uploadSignatureImage`,
 *   then calls `/api/functions/signDocument` with the returned URL.
 * - Sends timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`.
 * - Google Fonts dynamically loaded from company theme config.
 * - All `var(--theme-*)` tokens applied via inline `<style>` injection.
 */
export function SignDocumentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<SignDocumentData | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const isViewOnly = urlParams.get('view_only') === 'true';

  useEffect(() => {
    if (!token) {
      setError('Invalid signing link. No token provided.');
      setLoading(false);
      return;
    }
    loadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadDocument = async () => {
    try {
      const functionUrl = `${window.location.origin}/api/functions/getDocumentForSigning`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = (await response.json()) as {
        error?: string;
        already_signed?: boolean;
        company?: CompanyInfo;
        document?: DocumentInfo;
        signer?: SignerInfo;
      };

      if (data.error) {
        if (data.already_signed) {
          setAlreadySigned(true);
        }
        setError(data.error);
      } else {
        setDocumentData(data as SignDocumentData);
        setCompany(data.company ?? null);
      }
    } catch {
      setError('Failed to load document. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  // Canvas drawing functions
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    initCanvas();
  }, [documentData]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      if (touch) {
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return { x: 0, y: 0 };
    }
    const me = e as React.MouseEvent<HTMLCanvasElement>;
    return {
      x: (me.clientX - rect.left) * scaleX,
      y: (me.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!hasSignature) {
      alert('Please draw your signature');
      return;
    }

    setIsSigning(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const signatureBase64 = canvas.toDataURL('image/png');

      // Upload the signature to get a URL
      const uploadUrl = `${window.location.origin}/api/functions/uploadSignatureImage`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_base64: signatureBase64 }),
      });

      const uploadData = (await uploadResponse.json()) as {
        error?: string;
        signature_url?: string;
      };

      if (!uploadResponse.ok || uploadData?.error) {
        alert(
          'Failed to upload signature: ' +
            (uploadData?.error ?? `Status ${uploadResponse.status}`),
        );
        return;
      }

      const signatureUrl = uploadData.signature_url;

      // Sign the document with the signature URL
      const functionUrl = `${window.location.origin}/api/functions/signDocument`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signature_data: signatureUrl,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = (await response.json()) as { error?: string; success?: boolean };

      if (data?.error) {
        alert(data.error);
      } else if (data?.success) {
        setSigned(true);
      } else {
        alert('Failed to sign document. Please try again.');
      }
    } catch {
      alert('Failed to sign document. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  // Generate theme CSS from company theme
  const themeCSS = generateThemeCSS(company?.theme as Parameters<typeof generateThemeCSS>[0]);

  // Build Google Fonts URL from company theme settings
  const fontsToLoad = new Set<string>();
  const systemFonts = ['system-ui', '-apple-system', 'sans-serif', 'serif', 'monospace'];

  const extractCustomFonts = (fontStack: string | undefined): string[] => {
    if (!fontStack) return [];
    return fontStack
      .replace(/['"]/g, '')
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f && !systemFonts.includes(f.toLowerCase()));
  };

  if (company) {
    extractCustomFonts(
      (company.theme as { typography?: { brandTitleFont?: string } } | undefined)?.typography
        ?.brandTitleFont,
    ).forEach((f) => fontsToLoad.add(f));
    extractCustomFonts(
      (company.theme as { typography?: { brandSubtitleFont?: string } } | undefined)?.typography
        ?.brandSubtitleFont,
    ).forEach((f) => fontsToLoad.add(f));
    extractCustomFonts(
      (company.theme as { typography?: { bodyFont?: string } } | undefined)?.typography?.bodyFont,
    ).forEach((f) => fontsToLoad.add(f));
    if (Array.isArray(company.custom_fonts)) {
      company.custom_fonts.forEach((font) => fontsToLoad.add(font));
    }
  }

  const fontFamilies = Array.from(fontsToLoad)
    .map((f) => f.replace(/ /g, '+'))
    .join('&family=');
  const googleFontsUrl = fontFamilies
    ? `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`
    : null;

  if (loading) {
    return (
      <>
        <style>{themeCSS}</style>
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            backgroundColor: 'var(--theme-page-bg)',
            fontFamily: 'var(--theme-font-body)',
          }}
        >
          <Card
            className="w-full max-w-md"
            style={{
              borderRadius: 'var(--theme-card-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
          >
            <CardContent
              className="text-center"
              style={{ padding: 'calc(var(--theme-card-padding) * 2)' }}
            >
              <Loader2
                className="w-12 h-12 mx-auto mb-4 animate-spin"
                style={{ color: 'var(--theme-brand-primary)' }}
              />
              <p style={{ color: 'var(--theme-stone-600)', fontSize: 'var(--theme-text-body)' }}>
                Loading document...
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{themeCSS}</style>
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            backgroundColor: 'var(--theme-page-bg)',
            fontFamily: 'var(--theme-font-body)',
          }}
        >
          <Card
            className="w-full max-w-md"
            style={{
              borderRadius: 'var(--theme-card-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
          >
            <CardContent
              className="text-center"
              style={{ padding: 'calc(var(--theme-card-padding) * 2)' }}
            >
              {alreadySigned ? (
                <CheckCircle2
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: 'var(--theme-success)' }}
                />
              ) : (
                <AlertCircle
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: 'var(--theme-danger)' }}
                />
              )}
              <h2
                className="font-semibold mb-2"
                style={{
                  fontSize: 'var(--theme-text-card-title)',
                  color: 'var(--theme-stone-900)',
                }}
              >
                {alreadySigned ? 'Already Signed' : 'Unable to Load Document'}
              </h2>
              <p style={{ color: 'var(--theme-stone-600)', fontSize: 'var(--theme-text-body)' }}>
                {error}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (signed) {
    return (
      <>
        <style>{themeCSS}</style>
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            backgroundColor: 'var(--theme-page-bg)',
            fontFamily: 'var(--theme-font-body)',
          }}
        >
          <Card
            className="w-full max-w-md"
            style={{
              borderRadius: 'var(--theme-card-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
          >
            <CardContent
              className="text-center"
              style={{ padding: 'calc(var(--theme-card-padding) * 2)' }}
            >
              <CheckCircle2
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: 'var(--theme-success)' }}
              />
              <h2
                className="font-bold mb-2"
                style={{
                  fontSize: 'var(--theme-text-section-title)',
                  color: 'var(--theme-stone-900)',
                }}
              >
                Document Signed!
              </h2>
              <p
                className="mb-4"
                style={{
                  color: 'var(--theme-stone-600)',
                  fontSize: 'var(--theme-text-body)',
                }}
              >
                Thank you, {documentData?.signer?.signer_name}. Your signature has been recorded.
              </p>
              <p
                style={{
                  fontSize: 'var(--theme-text-label)',
                  color: 'var(--theme-stone-500)',
                }}
              >
                A confirmation has been sent to the document owner.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const signerName = documentData?.signer?.signer_name ?? '';
  const signerEmail = documentData?.signer?.signer_email ?? '';

  return (
    <>
      <style>{themeCSS}</style>
      {googleFontsUrl && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href={googleFontsUrl} rel="stylesheet" />
        </>
      )}
      <div
        className="py-4 sm:py-8 px-3 sm:px-4"
        style={{
          backgroundColor: 'var(--theme-page-bg)',
          fontFamily: 'var(--theme-font-body)',
          minHeight: '100dvh',
          position: 'fixed',
          inset: 0,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="max-w-4xl mx-auto" style={{ maxWidth: 'var(--theme-max-content-width)' }}>
          <DocumentDisplayStub documentData={documentData} />

          {/* Signature Section */}
          {!isViewOnly && (
            <Card
              style={{
                borderRadius: 'var(--theme-card-radius)',
                boxShadow: 'var(--theme-card-shadow)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
                <div
                  className="flex items-center mb-4"
                  style={{ gap: 'var(--theme-element-gap)' }}
                >
                  <FileSignature
                    className="w-5 h-5"
                    style={{ color: 'var(--theme-brand-primary)' }}
                  />
                  <h2
                    className="font-semibold"
                    style={{
                      fontSize: 'var(--theme-text-card-title)',
                      color: 'var(--theme-stone-900)',
                    }}
                  >
                    Sign Document
                  </h2>
                </div>

                {/* Signer Info Display */}
                <div
                  className="p-3 sm:p-4 rounded-lg border mb-4 sm:mb-6"
                  style={{
                    backgroundColor: 'var(--theme-card-header-bg)',
                    borderColor: 'var(--theme-stone-200)',
                    borderRadius: 'var(--theme-input-radius)',
                  }}
                >
                  <p
                    className="mb-1"
                    style={{
                      fontSize: 'var(--theme-text-caption)',
                      color: 'var(--theme-stone-500)',
                    }}
                  >
                    Signing as:
                  </p>
                  <p
                    className="font-semibold"
                    style={{
                      fontSize: 'var(--theme-text-body)',
                      color: 'var(--theme-stone-900)',
                    }}
                  >
                    {signerName}
                  </p>
                  <p
                    className="break-words"
                    style={{
                      fontSize: 'var(--theme-text-label)',
                      color: 'var(--theme-stone-600)',
                    }}
                  >
                    {signerEmail}
                  </p>
                </div>

                {/* Signature Pad */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="font-medium"
                      style={{
                        fontSize: 'var(--theme-text-label)',
                        color: 'var(--theme-stone-700)',
                      }}
                    >
                      Your Signature *
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSignature}
                      className="h-8 px-2"
                      style={{ color: 'var(--theme-stone-500)' }}
                    >
                      <Eraser className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <div
                    className="border-2 border-dashed bg-white"
                    style={{
                      borderColor: 'var(--theme-stone-300)',
                      borderRadius: 'var(--theme-input-radius)',
                      aspectRatio: '3.33 / 1',
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={666}
                      height={200}
                      className="w-full h-full touch-none cursor-crosshair"
                      style={{ display: 'block' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <p
                    className="mt-1"
                    style={{
                      fontSize: 'var(--theme-text-caption)',
                      color: 'var(--theme-stone-500)',
                    }}
                  >
                    Draw your signature above using your mouse or finger
                  </p>
                </div>

                {/* Legal Notice */}
                <div
                  className="p-3 sm:p-4 rounded-lg border mb-4 sm:mb-6"
                  style={{
                    backgroundColor: 'var(--theme-card-header-bg)',
                    borderColor: 'var(--theme-stone-200)',
                    borderRadius: 'var(--theme-input-radius)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 'var(--theme-text-label)',
                      color: 'var(--theme-stone-600)',
                    }}
                  >
                    By clicking &ldquo;Sign Document&rdquo; below, I,{' '}
                    <strong>{signerName}</strong>, agree that my electronic signature is the legal
                    equivalent of my manual signature on this document. I consent to be legally
                    bound by this document&apos;s terms.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSign}
                    disabled={isSigning || !hasSignature}
                    className="w-full sm:w-auto sm:px-8 hover:opacity-90 transition-opacity"
                    size="lg"
                    style={{
                      backgroundColor: 'var(--theme-brand-primary)',
                      color: 'white',
                      borderRadius: 'var(--theme-button-radius)',
                      boxShadow: 'var(--theme-button-shadow)',
                    }}
                  >
                    {isSigning ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Sign Document
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* View Only Notice for CC recipients */}
          {isViewOnly && (
            <Card
              style={{
                borderRadius: 'var(--theme-card-radius)',
                boxShadow: 'var(--theme-card-shadow)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <CardContent className="text-center" style={{ padding: 'var(--theme-card-padding)' }}>
                <CheckCircle2
                  className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4"
                  style={{ color: 'var(--theme-stone-400)' }}
                />
                <h2
                  className="font-semibold mb-2"
                  style={{
                    fontSize: 'var(--theme-text-card-title)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  Document Copy
                </h2>
                <p
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-600)',
                  }}
                >
                  This document has been shared with you for your records. No signature is
                  required.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <p
            className="text-center mt-4 sm:mt-6"
            style={{
              fontSize: 'var(--theme-text-caption)',
              color: 'var(--theme-stone-500)',
            }}
          >
            Powered by HotSeaters • Secure Electronic Signature
          </p>
        </div>
      </div>
    </>
  );
}
