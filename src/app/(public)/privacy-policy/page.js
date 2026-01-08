export const metadata = {
  title: "Privacy Policy | CourtBooker",
  description: "Privacy Policy for CourtBooker platform",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🔐 Privacy Policy
          </h1>
          <div className="text-sm text-slate-600 mb-8">
            <p className="font-semibold">Platform: CourtBooker</p>
            <p>Last Updated: January 9, 2026</p>
          </div>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                1. Information We Collect
              </h2>
              <p className="text-slate-700 mb-3">CourtBooker may collect:</p>
              <ul className="space-y-2 text-slate-700">
                <li>Name</li>
                <li>Email address and phone number</li>
                <li>Booking details</li>
                <li>Payment reference identifiers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                2. Payment Information
              </h2>
              <ul className="space-y-2 text-slate-700">
                <li>All online payments are securely processed by PayHere</li>
                <li>
                  CourtBooker does not store credit card, debit card, or banking
                  information
                </li>
                <li>
                  Users are encouraged to make payments directly at the venue
                  where possible
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                3. Use of Information
              </h2>
              <p className="text-slate-700 mb-3">Information is used to:</p>
              <ul className="space-y-2 text-slate-700">
                <li>Facilitate and manage bookings</li>
                <li>Send booking confirmations and updates</li>
                <li>Improve platform functionality</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                4. Data Sharing
              </h2>
              <p className="text-slate-700">
                Booking information may be shared with the respective
                institution only for booking fulfillment purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                5. Data Protection
              </h2>
              <p className="text-slate-700">
                CourtBooker takes reasonable measures to protect user data from
                unauthorized access or misuse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                6. User Consent
              </h2>
              <p className="text-slate-700">
                By using CourtBooker, you consent to this Privacy Policy.
              </p>
            </section>

            <div className="bg-green-50 border-l-4 border-green-500 p-6 mt-8 rounded-r-lg">
              <p className="text-green-900 font-medium">
                💡 We respect your privacy and are committed to protecting your
                personal information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
