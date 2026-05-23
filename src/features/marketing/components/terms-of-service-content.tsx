/**
 * TermsOfServiceContent — 1:1 port of
 * `HotSeatersMVP/src/components/settings/TermsOfServiceContent.jsx` (354 lines).
 *
 * RULE 0 (pixel parity): every visible string and class is bible-verbatim.
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import { FileText } from 'lucide-react';

export function TermsOfServiceContent() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white">
      <div className="border-b border-stone-100 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-semibold leading-none tracking-tight">Terms of Service</h2>
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
            <h2 className="text-xl font-semibold text-stone-900 mb-3">1. Agreement to Terms</h2>
            <p className="text-stone-600 leading-relaxed mb-3">
              By accessing or using the HotSeaters platform ("Service") operated by Midnight Logic LLC ("Midnight Logic," "we," "our," or "us"),
              you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
              please do not access or use the Service.
            </p>
            <p className="text-stone-600 leading-relaxed">
              These Terms constitute a legally binding agreement between you (whether as an individual or on behalf of a company)
              and Midnight Logic LLC regarding your use of the Service available at <a href="https://hotseaters.com" className="text-indigo-600 hover:underline">hotseaters.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">2. Description of Service</h2>
            <p className="text-stone-600 leading-relaxed mb-3">
              HotSeaters is a cloud-based trial consulting management platform designed for trial consulting firms.
              The Service provides:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Sales pipeline and CRM for law firm client management</li>
              <li>Operations management for trial coordination and service scheduling</li>
              <li>Time tracking with approval workflows and configurable billing rules</li>
              <li>Expense tracking with receipt management</li>
              <li>Automated invoice generation with customizable templates</li>
              <li>Document management with electronic signature capabilities</li>
              <li>HotSeatHub marketplace for subcontractor connections (optional feature)</li>
              <li>Team collaboration with role-based access control</li>
              <li>Optional integration with Google Calendar for schedule synchronization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">3. User Accounts and Registration</h2>
            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">3.1 Account Creation</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>You must provide accurate, complete, and current information when creating an account</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized access or security breaches</li>
              <li>You must be at least 18 years old to create an account</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">3.2 Company Accounts</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Company accounts are created during onboarding by the first user (designated as "owner")</li>
              <li>Owners can invite additional team members with specific roles (admin, sales, trial consultant)</li>
              <li>Each user can belong to only one company at a time</li>
              <li>The owner is responsible for all company data and subscription payments</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">4. Subscription and Payment</h2>
            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">4.1 Subscription Plans</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Single User Plan:</strong> Core platform access for one user</li>
              <li><strong className="text-stone-700">Multi User Plan:</strong> Core platform access for unlimited users</li>
              <li><strong className="text-stone-700">HotSeatHub Add-On:</strong> Optional marketplace access</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">4.2 Billing Terms</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Subscriptions are billed monthly in advance</li>
              <li>Payment is processed securely through Stripe</li>
              <li>You authorize us to charge your payment method for recurring subscription fees</li>
              <li>Prices are subject to change with 30 days notice</li>
              <li>No refunds for partial months or unused services</li>
              <li>Failed payments may result in service suspension or termination</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">4.3 Cancellation</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>You may cancel your subscription at any time from Settings → Subscription</li>
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>You will retain access to the Service until the end of the paid period</li>
              <li>Upon cancellation, your data will be retained for 90 days before permanent deletion</li>
            </ul>
          </section>

          <section>
            <h2 id="google-api" className="text-xl font-semibold text-stone-900 mb-3">5. Google API Services</h2>
            <p className="text-stone-600 leading-relaxed mb-3">
              HotSeaters offers optional integration with Google Calendar. By connecting your Google account,
              you agree to the following terms in addition to Google's Terms of Service:
            </p>
            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">5.1 Google Calendar Integration</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Purpose:</strong> We access your Google Calendar solely to sync your HotSeaters trial assignments and tasks</li>
              <li><strong className="text-stone-700">Permissions:</strong> We request only the minimum permissions necessary to create, update, and delete calendar events</li>
              <li><strong className="text-stone-700">Data Use:</strong> Google data is used exclusively for the calendar sync feature and is not used for any other purpose</li>
              <li><strong className="text-stone-700">Data Sharing:</strong> We do not share your Google data with any third parties</li>
              <li><strong className="text-stone-700">Revocation:</strong> You can disconnect Google Calendar at any time from Settings → Integrations</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">5.2 Compliance with Google Policies</h3>
            <p className="text-stone-600 leading-relaxed">
              Our use of Google APIs complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google API Services User Data Policy</a>,
              including the Limited Use requirements. We only use Google user data to provide and improve the calendar sync feature you explicitly requested.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">6. Acceptable Use</h2>
            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">6.1 Permitted Use</h3>
            <p className="text-stone-600 leading-relaxed mb-3">You agree to use the Service:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Only for lawful purposes in compliance with all applicable laws</li>
              <li>In a manner that does not infringe upon the rights of others</li>
              <li>In accordance with these Terms and any additional guidelines we provide</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">6.2 Prohibited Activities</h3>
            <p className="text-stone-600 leading-relaxed mb-3">You agree NOT to:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Use the Service for any illegal, fraudulent, or unauthorized purpose</li>
              <li>Violate any laws, regulations, or third-party rights</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Scrape, copy, or harvest data using automated means without permission</li>
              <li>Impersonate another person or entity</li>
              <li>Share your account credentials with others</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use the Service to compete with HotSeaters</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">7. Intellectual Property Rights</h2>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>The Service and its original content, features, and functionality are owned by Midnight Logic LLC</li>
              <li>Our trademarks, logos, and service marks are protected by intellectual property laws</li>
              <li>You may not use our branding without explicit written permission</li>
              <li>You retain ownership of all data, content, and documents you create or upload to the Service</li>
              <li>You grant us a license to host, store, and process your content solely to provide the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">8. Data Ownership and Export</h2>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Your Data:</strong> You own all business data you enter into the Service</li>
              <li><strong className="text-stone-700">Data Portability:</strong> You can export your data at any time in standard formats</li>
              <li><strong className="text-stone-700">License to Process:</strong> You grant us permission to process your data to provide platform features</li>
              <li><strong className="text-stone-700">Data Security:</strong> We implement industry-standard security measures to protect your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">9. Third-Party Integrations</h2>
            <p className="text-stone-600 leading-relaxed mb-3">The Service integrates with third-party providers:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li><strong className="text-stone-700">Stripe:</strong> Payment processing — subject to <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Stripe's Terms</a></li>
              <li><strong className="text-stone-700">Resend:</strong> Email delivery — subject to <a href="https://resend.com/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Resend's Terms</a></li>
              <li><strong className="text-stone-700">Google:</strong> Calendar sync — subject to <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google's Terms</a></li>
              <li><strong className="text-stone-700">API2PDF:</strong> PDF generation — subject to <a href="https://www.api2pdf.com/terms-of-service/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">API2PDF's Terms</a></li>
            </ul>
            <p className="text-stone-600 leading-relaxed mt-3">
              We are not responsible for the availability, accuracy, or performance of third-party services.
              Your use of third-party services is subject to their respective terms and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">10. Service Availability</h2>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>We strive for high uptime but do not guarantee uninterrupted access</li>
              <li>We may perform scheduled maintenance with advance notice when possible</li>
              <li>We reserve the right to modify, suspend, or discontinue features with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">11. Limitation of Liability</h2>
            <p className="text-stone-600 leading-relaxed mb-3 font-medium">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND</li>
              <li>WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
              <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE PAST 12 MONTHS</li>
              <li>WE ARE NOT RESPONSIBLE FOR DATA LOSS (though we maintain automatic backups)</li>
              <li>WE ARE NOT LIABLE FOR THIRD-PARTY SERVICE FAILURES</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">12. Indemnification</h2>
            <p className="text-stone-600 leading-relaxed mb-3">
              You agree to indemnify and hold Midnight Logic LLC, its affiliates, officers, directors, employees, and agents harmless
              from any claims, damages, losses, liabilities, and expenses arising from:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Content you upload or create using the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">13. Termination</h2>
            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">13.1 Termination by You</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>You may cancel your subscription at any time from Settings → Subscription</li>
              <li>You can request immediate account deletion (subject to legal retention requirements)</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">13.2 Termination by Us</h3>
            <p className="text-stone-600 leading-relaxed mb-3">We may terminate or suspend your account immediately for:</p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Violation of these Terms</li>
              <li>Fraudulent activity or payment disputes</li>
              <li>Abuse of the Service or other users</li>
              <li>Legal or regulatory requirements</li>
            </ul>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">13.3 Effect of Termination</h3>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Access to the Service will be revoked</li>
              <li>You will have 90 days to export your data before permanent deletion</li>
              <li>Subscription fees are non-refundable upon termination</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">14. Dispute Resolution</h2>
            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">14.1 Informal Resolution</h3>
            <p className="text-stone-600 leading-relaxed">
              Before filing a claim, you agree to contact us at <a href="mailto:support@hotseaters.com" className="text-indigo-600 hover:underline">support@hotseaters.com</a> to
              attempt to resolve the dispute informally within 30 days.
            </p>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">14.2 Governing Law</h3>
            <p className="text-stone-600 leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the State of Texas, United States,
              without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">15. Changes to Terms</h2>
            <p className="text-stone-600 leading-relaxed mb-3">
              We reserve the right to modify these Terms at any time. Changes will be communicated via:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 text-stone-600">
              <li>Updated "Last Updated" date at the top of this page</li>
              <li>Email notification to your registered email address</li>
              <li>In-app notification when you next log in</li>
            </ul>
            <p className="text-stone-600 leading-relaxed mt-3">
              Your continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">16. Miscellaneous</h2>
            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">16.1 Severability</h3>
            <p className="text-stone-600 leading-relaxed">
              If any provision of these Terms is found unenforceable, that provision will be limited or eliminated
              to the minimum extent necessary, and the remaining provisions remain in effect.
            </p>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">16.2 Entire Agreement</h3>
            <p className="text-stone-600 leading-relaxed">
              These Terms, together with our <a href="/PrivacyPolicy" className="text-indigo-600 hover:underline">Privacy Policy</a>,
              constitute the entire agreement between you and Midnight Logic LLC regarding the Service.
            </p>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">16.3 Assignment</h3>
            <p className="text-stone-600 leading-relaxed">
              You may not assign or transfer these Terms without our prior written consent.
              We may assign these Terms to any affiliate or successor without restriction.
            </p>
            <h3 className="text-lg font-medium text-stone-800 mt-5 mb-2">16.4 Waiver</h3>
            <p className="text-stone-600 leading-relaxed">
              Our failure to enforce any right or provision will not be considered a waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">17. Contact Information</h2>
            <p className="text-stone-600 leading-relaxed mb-4">For questions about these Terms of Service, please contact us:</p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-900">
                <strong>Midnight Logic LLC</strong><br />
                <em>Operator of HotSeaters</em><br /><br />
                <strong>General Support:</strong> <a href="mailto:support@hotseaters.com" className="text-indigo-600 hover:underline">support@hotseaters.com</a><br />
                <strong>Legal Inquiries:</strong> <a href="mailto:legal@hotseaters.com" className="text-indigo-600 hover:underline">legal@hotseaters.com</a><br /><br />
                <strong>HotSeaters:</strong> <a href="https://hotseaters.com" className="text-indigo-600 hover:underline">https://hotseaters.com</a><br />
                <strong>Midnight Logic:</strong> <a href="https://midnightlogic.co" className="text-indigo-600 hover:underline">https://midnightlogic.co</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">18. Acknowledgment</h2>
            <p className="text-stone-600 leading-relaxed">
              BY USING HOTSEATERS, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE
              AND OUR <a href="/PrivacyPolicy" className="text-indigo-600 hover:underline">PRIVACY POLICY</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
