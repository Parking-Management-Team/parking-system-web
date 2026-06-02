/**
 * Footer Component - Chân trang
 *
 * Chân trang với 4 cột:
 * 1. Logo + mô tả + social links (f, t, in)
 * 2. Quick Links: Home, About, Features, Pricing, Contact
 * 3. Services: Smart Spot Allocation, Predictive Booking...
 * 4. Legal: Privacy Policy, Terms of Service...
 *
 * @param scrollToSection - Hàm cuộn đến section khi click link
 */

'use client'

interface FooterProps {
  scrollToSection: (id: string) => void;
}

export default function Footer({ scrollToSection }: FooterProps) {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-2xl font-bold font-heading tracking-tight">NexPark</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Revolutionizing parking with intelligent solutions for modern smart cities.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                <span className="text-sm font-semibold">f</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                <span className="text-sm font-semibold">t</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                <span className="text-sm font-semibold">in</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold font-heading mb-6 border-b border-gray-800 pb-2">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="#home" onClick={(e) => handleLinkClick(e, 'home')} className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" onClick={(e) => handleLinkClick(e, 'about')} className="text-gray-400 hover:text-emerald-400 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => handleLinkClick(e, 'features')} className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" onClick={(e) => handleLinkClick(e, 'pricing')} className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => handleLinkClick(e, 'contact')} className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold font-heading mb-6 border-b border-gray-800 pb-2">Services</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Smart Spot Allocation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Predictive Booking</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">VIP Monthly Passes</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Enterprise Administration</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Real-time Analytics</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold font-heading mb-6 border-b border-gray-800 pb-2">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Security Audit</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} NexPark. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
