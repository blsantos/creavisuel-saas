import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import creavisuelLogo from "@/assets/logo-creavisuel2025.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "Services", href: "/services" },
    { label: "À Propos", href: "/about" },
    { label: "Tarifs", href: "/#pricing" },
    { label: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.replace("/#", "/"));
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 scifi-glass border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={creavisuelLogo} 
              alt="CréaVisuel" 
              className="h-8 lg:h-10 w-auto transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`font-semibold transition-all duration-300 relative group ${
                  isActive(link.href) 
                    ? "text-cyan-400" 
                    : "text-slate-300 hover:text-cyan-400"
                }`}
              >
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-px bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300 ${
                  isActive(link.href) ? "w-full" : "w-0 group-hover:w-full"
                }`} />
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link to="/admin">
              <Button 
                variant="outline" 
                className="border border-cyan-500/50 text-cyan-400 bg-transparent hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold"
              >
                Se connecter
              </Button>
            </Link>
            <Link to="/contact">
              <Button className="scifi-button font-semibold">
                Demander une démo
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10 animate-fade-in scifi-glass">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    isActive(link.href)
                      ? "text-cyan-400 bg-cyan-500/10"
                      : "text-slate-300 hover:text-cyan-400 hover:bg-white/5"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                <Link to="/admin">
                  <Button 
                    variant="outline" 
                    className="w-full border border-cyan-500/50 text-cyan-400 bg-transparent hover:bg-cyan-500/10"
                  >
                    Se connecter
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button className="w-full scifi-button">
                    Demander une démo
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
