/**
 * PrivacyPolicyContent — 1:1 port of
 * `HotSeatersMVP/src/components/settings/PrivacyPolicyContent.jsx` (325 lines).
 *
 * RULE 0 (pixel parity): every visible string and class is bible-verbatim.
 * The bible wraps in `<Card>/<CardHeader>/<CardTitle>/<CardContent>` from
 * shadcn — our Card primitive renders differently, so the same chrome is
 * inlined as plain elements with the same tailwind classes the bible's
 * Card would emit. Visual result is identical.
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import { Shield } from 'lucide-react';

export function PrivacyPolicyContent() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white">
      <div className="border-b border-stone-100 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-semibold leading-none tracking-tight">Privacy Policy</h2>
        </div>
        <p className="text-stone-600">Last updated: February 3, 2026</p>
        <p className="text-stone-600 mt-2">
          <strong>HotSeaters</strong>
          <br />
          A trial consulting management platform operated by Midnight Logic LLC
        </p>
      </div>
      <div className="p-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">1. Introduction</h2>
            <p className="text-stone-600 leading-relaxed mb-3">
              HotSeaters is a trial consulting management platform operated by Midnight Logic LLC ("Midnight Logic," "we," "our," or "us"),
              available at <a href="https://hotseaters.com" className="text-indigo-600 hover:underline">hotseaters.com</a> (the "Service").
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
            <p className="text-stone-600 leading-relaxed">
              By accessing or using HotSeaters, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
              If you do not agree with the terms of this Privacy Policy, please do not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">2.1 Information You Provide Directly</h3>
            <p className="text-stone-600 leading-relaxed mb-3">We collect information you voluntarily provide when using our Service:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Account Registration:</strong> Name, email address, company name, and password when you create an account</li>
              <li><strong className="text-stone-700">Profile Information:</strong> First name, last name, phone number, job title, profile photo, and signature image</li>
              <li><strong className="text-stone-700">Business Data:</strong> Client information, trial/case details, attorney contacts, service rates, time entries, expenses, and invoices you create within the platform</li>
              <li><strong className="text-stone-700">Payment Information:</strong> Billing information processed securely through Stripe (we do not store credit card numbers)</li>
              <li><strong className="text-stone-700">Uploaded Files:</strong> Documents, receipts, company logos, templates, and images you upload</li>
              <li><strong className="text-stone-700">Communications:</strong> Emails and messages sent through the platform</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">2.2 Information Collected Automatically</h3>
            <p className="text-stone-600 leading-relaxed mb-3">We automatically collect certain information when you access or use the Service:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Usage Data:</strong> Pages visited, features used, actions performed, and time spent on the Service</li>
              <li><strong className="text-stone-700">Device Information:</strong> Browser type, operating system, device type, and IP address</li>
              <li><strong className="text-stone-700">Cookies and Similar Technologies:</strong> Authentication tokens, session identifiers, and user preferences</li>
              <li><strong className="text-stone-700">Log Data:</strong> Access times, error logs, and referring URLs</li>
            </ul>
          </section>

          <section>
            <h2 id="google-api" className="text-xl font-semibold text-stone-900 mb-3">3. Google API Services and User Data</h2>
            <p className="text-stone-600 leading-relaxed mb-3">
              <strong className="text-stone-700">HotSeaters offers optional integration with Google Calendar.</strong> This section describes how we handle data
              obtained through Google APIs in compliance with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google API Services User Data Policy</a>.
            </p>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">3.1 Google Data We Access</h3>
            <p className="text-stone-600 leading-relaxed mb-3">When you connect your Google Calendar, we request access to:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Calendar Events:</strong> Permission to create, read, update, and delete calendar events in calendars you select</li>
              <li><strong className="text-stone-700">Basic Profile Information:</strong> Your Google account email address for authentication purposes</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">3.2 How We Use Google Data</h3>
            <p className="text-stone-600 leading-relaxed mb-3">We use Google Calendar data <strong className="text-stone-700">solely</strong> to:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Sync your trial service assignments and tasks to your Google Calendar</li>
              <li>Allow you to view your HotSeaters schedule within Google Calendar</li>
              <li>Update calendar events when trial dates or assignments change</li>
              <li>Remove calendar events when assignments are cancelled or deleted</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">3.3 Google Data Storage and Retention</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">OAuth Tokens:</strong> We securely store Google OAuth access tokens and refresh tokens to maintain your calendar connection</li>
              <li><strong className="text-stone-700">Token Expiration:</strong> Access tokens are refreshed automatically; you can disconnect at any time</li>
              <li><strong className="text-stone-700">No Calendar Content Storage:</strong> We do not store the content of your existing Google Calendar events</li>
              <li><strong className="text-stone-700">Disconnection:</strong> When you disconnect Google Calendar, we delete your stored OAuth tokens within 24 hours</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">3.4 Google Data Sharing</h3>
            <p className="text-stone-600 leading-relaxed mb-3">
              <strong className="text-stone-700">We do NOT share your Google user data with any third parties.</strong> Your Google Calendar data is:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Only used to provide the calendar sync feature you requested</li>
              <li>Never sold, rented, or shared with advertisers</li>
              <li>Never used for purposes unrelated to providing our Service</li>
              <li>Accessible only to you and authorized team members within your company account</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">3.5 Limited Use Disclosure</h3>
            <p className="text-stone-600 leading-relaxed">
              HotSeaters' use and transfer of information received from Google APIs adheres to the
              <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline"> Google API Services User Data Policy</a>,
              including the Limited Use requirements.
            </p>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">3.6 Revoking Google Access</h3>
            <p className="text-stone-600 leading-relaxed mb-3">You can revoke HotSeaters' access to your Google account at any time by:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Going to Settings → Integrations in HotSeaters and clicking "Disconnect Google Calendar"</li>
              <li>Visiting your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google Account Permissions</a> page and removing HotSeaters</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">4. How We Use Your Information</h2>
            <p className="text-stone-600 leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Provide the Service:</strong> Enable core platform functionality including CRM, time tracking, billing, document generation, and team collaboration</li>
              <li><strong className="text-stone-700">Process Payments:</strong> Handle subscription billing through Stripe</li>
              <li><strong className="text-stone-700">Send Communications:</strong> Deliver transactional emails (document signing links, invitations, invoice delivery, notifications)</li>
              <li><strong className="text-stone-700">Provide Support:</strong> Respond to your questions and assist with technical issues</li>
              <li><strong className="text-stone-700">Improve the Service:</strong> Analyze usage patterns to enhance features and user experience</li>
              <li><strong className="text-stone-700">Ensure Security:</strong> Detect and prevent fraud, abuse, and security incidents</li>
              <li><strong className="text-stone-700">Comply with Legal Obligations:</strong> Meet regulatory requirements and respond to lawful requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">5. Information Sharing and Disclosure</h2>
            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">5.1 When We Share Information</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Within Your Company:</strong> Data is accessible to team members based on role-based permissions (owner, admin, sales, trial consultant)</li>
              <li><strong className="text-stone-700">HotSeatHub Marketplace:</strong> When using optional marketplace features, your company name and relevant service information is shared with marketplace participants</li>
              <li><strong className="text-stone-700">Document Recipients:</strong> When you send documents for signature, recipient information is shared with email delivery providers</li>
              <li><strong className="text-stone-700">Service Providers:</strong> We use third-party services to operate our platform (listed in Section 9)</li>
              <li><strong className="text-stone-700">Legal Requirements:</strong> When required by law, court order, or legal process</li>
              <li><strong className="text-stone-700">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">5.2 What We Do NOT Do</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>We do NOT sell your personal information to third parties</li>
              <li>We do NOT share your data with advertisers</li>
              <li>We do NOT use your business data for purposes unrelated to providing the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">6. Data Security</h2>
            <p className="text-stone-600 leading-relaxed mb-3">We implement industry-standard security measures to protect your information:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Encryption:</strong> All data transmitted over HTTPS/TLS encryption</li>
              <li><strong className="text-stone-700">Authentication:</strong> Secure token-based user authentication</li>
              <li><strong className="text-stone-700">Data Isolation:</strong> Multi-tenant architecture with strict company-level data separation</li>
              <li><strong className="text-stone-700">Access Controls:</strong> Role-based permissions limit data access to authorized users</li>
              <li><strong className="text-stone-700">Secure Storage:</strong> Data stored on secure, managed infrastructure with automatic backups</li>
              <li><strong className="text-stone-700">Payment Security:</strong> PCI-compliant payment processing through Stripe</li>
            </ul>
            <p className="text-stone-600 leading-relaxed mt-3">
              While we take reasonable precautions, no method of transmission over the internet is 100% secure.
              We cannot guarantee absolute security of your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">7. Data Retention</h2>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Active Accounts:</strong> We retain your data as long as your account is active</li>
              <li><strong className="text-stone-700">Account Cancellation:</strong> Data retained for 90 days after cancellation unless deletion is requested</li>
              <li><strong className="text-stone-700">Legal Requirements:</strong> Financial records retained for 7 years per legal requirements</li>
              <li><strong className="text-stone-700">Deletion Requests:</strong> Data permanently removed within 30 days of request (excluding legally required records)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">8. Your Rights and Choices</h2>
            <p className="text-stone-600 leading-relaxed mb-3">You have the following rights regarding your personal information:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-stone-700">Correction:</strong> Update or correct inaccurate information through your account settings</li>
              <li><strong className="text-stone-700">Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong className="text-stone-700">Export:</strong> Download your business data in standard formats</li>
              <li><strong className="text-stone-700">Opt-Out:</strong> Unsubscribe from marketing emails</li>
              <li><strong className="text-stone-700">Revoke Third-Party Access:</strong> Disconnect Google Calendar or other integrations at any time</li>
            </ul>
            <p className="text-stone-600 leading-relaxed mt-3">
              To exercise these rights, contact us at <a href="mailto:privacy@hotseaters.com" className="text-indigo-600 hover:underline">privacy@hotseaters.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">9. Third-Party Services</h2>
            <p className="text-stone-600 leading-relaxed mb-3">Our platform integrates with third-party services that have their own privacy policies:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Stripe:</strong> Payment processing — <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Stripe Privacy Policy</a></li>
              <li><strong className="text-stone-700">Resend:</strong> Email delivery — <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Resend Privacy Policy</a></li>
              <li><strong className="text-stone-700">Google:</strong> Calendar integration — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google Privacy Policy</a></li>
              <li><strong className="text-stone-700">API2PDF:</strong> PDF generation — <a href="https://www.api2pdf.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">API2PDF Privacy Policy</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">10. Cookies and Tracking</h2>
            <p className="text-stone-600 leading-relaxed mb-3">We use cookies and similar technologies for:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Authentication:</strong> Keep you logged in across sessions</li>
              <li><strong className="text-stone-700">Preferences:</strong> Remember your view settings and configurations</li>
              <li><strong className="text-stone-700">Analytics:</strong> Understand how you use the platform to improve features</li>
            </ul>
            <p className="text-stone-600 leading-relaxed mt-3">
              You can control cookies through your browser settings, though disabling certain cookies may limit platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">11. Children's Privacy</h2>
            <p className="text-stone-600 leading-relaxed">
              HotSeaters is a business platform not intended for use by individuals under the age of 18.
              We do not knowingly collect personal information from children. If you believe we have collected
              information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">12. International Data Transfers</h2>
            <p className="text-stone-600 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence.
              We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">13. California Privacy Rights (CCPA)</h2>
            <p className="text-stone-600 leading-relaxed mb-3">If you are a California resident, you have rights under the California Consumer Privacy Act:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Right to know what personal information is collected, used, shared, or sold</li>
              <li>Right to delete personal information held by businesses</li>
              <li>Right to opt-out of sale of personal information (note: we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
            <p className="text-stone-600 leading-relaxed mt-3">
              To exercise your CCPA rights, contact <a href="mailto:privacy@hotseaters.com" className="text-indigo-600 hover:underline">privacy@hotseaters.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">14. European Privacy Rights (GDPR)</h2>
            <p className="text-stone-600 leading-relaxed mb-3">If you are located in the European Economic Area (EEA), you have rights under GDPR:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>
            <p className="text-stone-600 leading-relaxed mt-3">
              To exercise your GDPR rights, contact <a href="mailto:privacy@hotseaters.com" className="text-indigo-600 hover:underline">privacy@hotseaters.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">15. Changes to This Privacy Policy</h2>
            <p className="text-stone-600 leading-relaxed mb-3">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Posting the new Privacy Policy with an updated "Last Updated" date</li>
              <li>Sending an email notification to your registered email address</li>
              <li>Displaying a notice within the platform</li>
            </ul>
            <p className="text-stone-600 leading-relaxed mt-3">
              Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">16. Contact Us</h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-900">
                <strong>Midnight Logic LLC</strong><br />
                <em>Operator of HotSeaters</em><br /><br />
                <strong>Privacy Inquiries:</strong> <a href="mailto:privacy@hotseaters.com" className="text-indigo-600 hover:underline">privacy@hotseaters.com</a><br />
                <strong>General Support:</strong> <a href="mailto:support@hotseaters.com" className="text-indigo-600 hover:underline">support@hotseaters.com</a><br /><br />
                <strong>HotSeaters:</strong> <a href="https://hotseaters.com" className="text-indigo-600 hover:underline">https://hotseaters.com</a><br />
                <strong>Midnight Logic:</strong> <a href="https://midnightlogic.co" className="text-indigo-600 hover:underline">https://midnightlogic.co</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">17. Consent</h2>
            <p className="text-stone-600 leading-relaxed">
              By using HotSeaters, you consent to this Privacy Policy and agree to its terms.
              If you do not agree, please discontinue use of the Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
