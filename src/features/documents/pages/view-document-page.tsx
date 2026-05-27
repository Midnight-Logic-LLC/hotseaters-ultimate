import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { generateThemeCSS } from '@/shared/lib/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocumentInfo {
  document_name?: string;
  pdf_url?: string;
}

interface CompanyInfo {
  logo?: string;
  theme?: Record<string, unknown>;
  custom_fonts?: string[];
}

interface ViewDocumentData {
  document?: DocumentInfo;
  company?: CompanyInfo;
  trial?: {
    case_name?: string;
    case_number?: string;
  };
}

// ─── DocumentDisplay stub ─────────────────────────────────────────────────────
// DocumentDisplay sub-component not yet ported — renders document preview.
// Functional parity for the view-only flow is preserved; visual parity for the
// document viewer lands when DocumentDisplay ports as a shared component.

function DocumentDisplayStub({ documentData }: { documentData: ViewDocumentData | null }) {
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
            className="border"
            style={{
              borderRadius: 'var(--theme-input-radius)',
              borderColor: 'var(--theme-stone-200)',
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

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * ViewDocumentPage — port of HotSeatersMVP/src/pages/ViewDocument.jsx.
 *
 * Public/unauthenticated page accessible by CC recipients via a token link.
 * Read-only — no signature required.
 *
 * Business rules preserved from bible:
 * - Reads `?token=` from URL search params.
 * - Fetches document data from the `getDocumentForSigning` function (view-only
 *   semantics — same endpoint, no signing step).
 * - Renders loading / error / document-received states.
 * - Google Fonts dynamically loaded from company theme config.
 * - All `var(--theme-*)` tokens applied via inline `<style>` injection.
 *
 * Adapter note: bible calls `base44.functions.invoke('getDocumentForSigning', ...)`
 * — ported to `fetch('/api/functions/getDocumentForSigning', ...)` matching the
 * SignDocument page's direct-fetch pattern (self-hosted, no base44 client).
 */
export function ViewDocumentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<ViewDocumentData | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid document link. No token provided.');
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
        company?: CompanyInfo;
        document?: DocumentInfo;
      };

      if (data.error) {
        setError(data.error);
      } else {
        setDocumentData(data as ViewDocumentData);
        setCompany(data.company ?? null);
      }
    } catch {
      setError('Failed to load document. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

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

  const themeCSS = generateThemeCSS(company?.theme as Parameters<typeof generateThemeCSS>[0]);

  const fontLinks = googleFontsUrl ? (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={googleFontsUrl} rel="stylesheet" />
    </>
  ) : null;

  if (loading) {
    return (
      <>
        <style>{themeCSS}</style>
        {fontLinks}
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
        {fontLinks}
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
              <AlertCircle
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: 'var(--theme-danger)' }}
              />
              <h2
                className="font-semibold mb-2"
                style={{
                  fontSize: 'var(--theme-text-card-title)',
                  color: 'var(--theme-stone-900)',
                }}
              >
                Unable to Load Document
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

  return (
    <>
      <style>{themeCSS}</style>
      {fontLinks}
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
        <div className="mx-auto" style={{ maxWidth: 'var(--theme-max-content-width)' }}>
          <DocumentDisplayStub documentData={documentData} />

          {/* View Only Notice */}
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
                Document Received
              </h2>
              <p
                style={{
                  fontSize: 'var(--theme-text-body)',
                  color: 'var(--theme-stone-600)',
                }}
              >
                This document has been shared with you for your records. No signature is required.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <p
            className="text-center mt-4 sm:mt-6"
            style={{
              fontSize: 'var(--theme-text-caption)',
              color: 'var(--theme-stone-500)',
            }}
          >
            Powered by HotSeaters
          </p>
        </div>
      </div>
    </>
  );
}
