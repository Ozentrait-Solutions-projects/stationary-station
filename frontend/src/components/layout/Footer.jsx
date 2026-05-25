import { Link } from 'react-router-dom';
import { Zap, Mail, Globe, MessageCircle } from 'lucide-react';

const FOOTER_LINKS = {
  'Company': [
    { label: 'About Us', to: '#' },
    { label: 'Careers', to: '#' },
    { label: 'Press', to: '#' },
    { label: 'Blog', to: '#' },
  ],
  'Support': [
    { label: 'Help Center', to: '#' },
    { label: 'Contact Us', to: '#' },
    { label: 'Returns', to: '#' },
    { label: 'Order Tracking', to: '/orders' },
  ],
  'Shop': [
    { label: 'Electronics', to: '/products?category=Electronics' },
    { label: 'Fashion',     to: '/products?category=Fashion' },
    { label: 'Home & Kitchen', to: '/products?category=Home+%26+Kitchen' },
    { label: 'All Products', to: '/products' },
  ],
  'Legal': [
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms of Service', to: '#' },
    { label: 'Cookie Policy', to: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-dark-300 mt-20">
      <div className="nexcart-container py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-sm">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">NexCart</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              The future of online shopping. Premium products, seamless experience, delivered to your doorstep.
            </p>
            {/* Newsletter */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button className="mt-2 w-full btn-primary text-sm py-2.5">Subscribe</button>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-display font-semibold text-white mb-4">{section}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm hover:text-primary-400 transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="divider mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTopColor: '#1e293b' }}>
          <p className="text-sm text-dark-500">© 2026 NexCart. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {[Globe, MessageCircle].map((Icon, i) => (
              <button key={i} type="button" className="p-2 rounded-lg hover:bg-dark-700 text-dark-500 hover:text-primary-400 transition-all duration-200">
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <p className="text-sm text-dark-500">Made with ❤️ in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
