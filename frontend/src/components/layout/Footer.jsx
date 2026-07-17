import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Globe, MessageCircle, Camera, Play, Shield } from 'lucide-react';

const FOOTER_LINKS = {
  'Get to Know Us': [
    { label: 'About NexCart',  to: '#' },
    { label: 'Careers',        to: '#' },
    { label: 'Press Releases', to: '#' },
    { label: 'Investor Relations', to: '#' },
    { label: 'Accessibility',  to: '#' },
  ],
  'Make Money With Us': [
    { label: 'Sell on NexCart',   to: '#' },
    { label: 'Sell Under Private Brands', to: '#' },
    { label: 'Become an Affiliate', to: '#' },
    { label: 'Advertise Your Products', to: '#' },
  ],
  'Shopping Categories': [
    { label: 'Electronics',      to: '/products?category=Electronics' },
    { label: 'Fashion',          to: '/products?category=Fashion' },
    { label: 'Home & Kitchen',   to: '/products?category=Home+%26+Kitchen' },
    { label: 'Gaming',           to: '/products?category=Gaming' },
    { label: 'Sports',           to: '/products?category=Sports' },
    { label: 'Books',            to: '/products?category=Books' },
    { label: 'Beauty',           to: '/products?category=Beauty' },
    { label: 'All Products',     to: '/products' },
  ],
  'Let Us Help You': [
    { label: 'Your Account',      to: '/profile' },
    { label: 'Your Orders',       to: '/orders' },
    { label: 'Your Wishlist',     to: '/wishlist' },
    { label: 'Shipping Rates',    to: '#' },
    { label: 'Returns & Replacements', to: '#' },
    { label: 'Help Center',       to: '#' },
    { label: 'Contact Us',        to: '#' },
  ],
};

const PAYMENT_ICONS = ['Visa', 'MC', 'Amex', 'UPI', 'Net', 'COD'];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className="w-full py-3.5 text-sm text-gray-700 hover:bg-gray-200 transition-colors text-center font-medium bg-gray-100 border-b border-gray-200"
      >
        Back to top
      </button>

      {/* Main footer links */}
      <div className="nexcart-container py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-gray-900 font-bold text-sm mb-4">{section}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-gray-500 text-sm hover:text-indigo-600 hover:underline transition-colors duration-150 font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Brand + Social + Payments */}
      <div className="nexcart-container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:scale-105 transition-transform duration-200">
              <path d="M6 6H13.5L22.5 30H15L6 6Z" fill="url(#nexLogoG1)" />
              <path d="M22.5 30H30V6H22.5V30Z" fill="url(#nexLogoG2)" />
              <path d="M6 6V18L13.5 30L22.5 30L6 6Z" fill="url(#nexLogoG3)" />
            </svg>
            <span className="font-display font-bold text-gray-900 text-lg">
              Nex<span className="text-[#6366F1]">Cart</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {[
              { Icon: Globe,         label: 'Facebook'  },
              { Icon: MessageCircle, label: 'Twitter'   },
              { Icon: Camera,        label: 'Instagram' },
              { Icon: Play,          label: 'YouTube'   },
            ].map(({ Icon, label }, i) => (
              <button
                key={i}
                type="button"
                aria-label={label}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-gray-200 bg-white"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Contact */}
          <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#6366F1]" />
              <span>1800-123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#6366F1]" />
              <span>support@nexcart.com</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {PAYMENT_ICONS.map(p => (
              <span
                key={p}
                className="px-3 py-1 text-xs font-bold text-gray-600 rounded bg-gray-100 border border-gray-200"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-footer */}
      <div className="border-t border-gray-200 bg-gray-100">
        <div className="nexcart-container py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>© 2026 NexCart.com, Inc. or its affiliates. All rights reserved.</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {['Privacy Policy', 'Terms of Use', 'Interest-Based Ads', 'Cookie Preferences'].map(item => (
                <Link key={item} to="#" className="hover:text-indigo-600 hover:underline transition-colors">
                  {item}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-[#6366F1]" />
              <span>Made with ❤️ in India 🇮🇳</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
