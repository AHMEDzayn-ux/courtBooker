export const metadata = {
  title: "Terms & Conditions | CourtBooker",
  description: "Terms and Conditions for using CourtBooker platform",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            📜 Terms & Conditions
          </h1>
          <div className="text-sm text-slate-600 mb-8">
            <p className="font-semibold">Platform: CourtBooker</p>
            <p>Last Updated: January 9, 2026</p>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed mb-6">
              Welcome to CourtBooker. By accessing or using our platform, you
              agree to the following Terms & Conditions.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                1. Platform Role
              </h2>
              <ul className="space-y-2 text-slate-700">
                <li>
                  CourtBooker is an online platform that facilitates bookings
                  for indoor sports facilities operated by third-party
                  institutions.
                </li>
                <li>
                  CourtBooker does not own, manage, or operate any sports venue
                  listed on the platform.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                2. Bookings
              </h2>
              <ul className="space-y-2 text-slate-700">
                <li>
                  All bookings are subject to availability and confirmation by
                  the respective institution.
                </li>
                <li>
                  Booking confirmations indicate a reservation request has been
                  placed, not a guarantee of service quality.
                </li>
                <li>
                  The institution is solely responsible for providing the booked
                  service.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                3. Payments & Payment Advisory
              </h2>
              <p className="text-slate-700 mb-3">
                CourtBooker may provide an option to make payments online via
                PayHere for user convenience.
              </p>
              <p className="text-slate-700 font-semibold mb-2">However:</p>
              <ul className="space-y-2 text-slate-700">
                <li>Online payment is optional</li>
                <li>
                  Users are strongly advised to visit the sports institution and
                  pay directly at the venue whenever possible
                </li>
                <li>
                  Any online payment made through CourtBooker is done at the
                  user's own discretion
                </li>
                <li>
                  CourtBooker acts only as a booking facilitator and does not
                  guarantee service delivery, refunds, or dispute resolution
                  related to payments.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                4. Cancellations & Refunds
              </h2>
              <ul className="space-y-2 text-slate-700">
                <li>
                  Cancellation and refund policies are determined and enforced
                  solely by the respective institution
                </li>
                <li>CourtBooker does not approve, manage, or issue refunds</li>
                <li>
                  Users must contact the institution directly for cancellations,
                  refunds, or payment disputes
                </li>
                <li>
                  CourtBooker is not responsible for any financial loss arising
                  from online payments
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                5. User Responsibilities
              </h2>
              <ul className="space-y-2 text-slate-700">
                <li>
                  Users must provide accurate and complete information when
                  making bookings
                </li>
                <li>
                  Any misuse or fraudulent activity may result in suspension or
                  termination of access
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                6. Limitation of Liability
              </h2>
              <p className="text-slate-700 mb-2">
                CourtBooker shall not be held liable for:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li>Service quality or availability issues at venues</li>
                <li>Institution-initiated cancellations or changes</li>
                <li>Payment disputes or refund delays</li>
                <li>Any loss incurred due to voluntary online payments</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                7. Governing Law
              </h2>
              <p className="text-slate-700">
                These terms are governed by the laws of Sri Lanka.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
