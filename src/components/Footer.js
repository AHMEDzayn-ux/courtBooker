import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* About Section */}
          <div className="space-y-2 max-w-sm text-center md:text-left">
            <h3 className="text-lg font-bold text-white">About Us</h3>
            <p className="text-gray-300 text-sm leading-snug">
              Your trusted platform for booking sports courts and facilities.
              Quick, easy, and reliable reservations.
            </p>
          </div>

          {/* Contact Info - Linked Email & WhatsApp */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white text-center md:text-left">Connect With Us</h3>
            
            <div className="flex flex-col gap-3">
               
               {/* Email Option - Changed div to 'a' tag with mailto: */}
              <a 
                href="mailto:ruzainia.23@cse.mrt.ac.lk"
                className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">ruzainia.23@cse.mrt.ac.lk</span>
              </a>

               {/* WhatsApp Option - Changed div to 'a' tag with wa.me link */}
              <a 
                href="https://wa.me/94781193758" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 1.666.465 3.28 1.508 4.97l-1.599 5.84 5.98-1.569zm10.089-6.215c.136-.224 2.69-1.334 3.154-1.486.465-.152.802-.223 1.139.224.337.447 1.433 1.786 1.733 2.15.3.364.6.41.937.26 1.367-.607 3.076-1.327 4.303-2.423.96-.858 1.616-1.92 1.844-2.321.229-.401.147-.583-.088-.819-.184-.184-.536-.475-.827-.475s-.582.084-.863.373c-.281.289-.984.973-.984 2.372s1.019 2.753 1.161 2.941c.142.188 2.007 3.065 4.864 4.298.679.294 1.209.469 1.623.6.682.216 1.302.186 1.792.113.547-.082 1.683-.688 1.919-1.352.236-.664.236-1.233.165-1.352-.071-.119-.261-.188-.548-.332z"/>
                </svg>
                <span className="text-sm">+94781193758 (WhatsApp)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-4 pt-4">
          <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-2">
            <p className="text-gray-400 text-xs text-center md:text-left">
              © {currentYear} Ticket Reservation. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
