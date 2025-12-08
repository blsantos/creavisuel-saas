import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { useContent } from "../contexts/ContentContext";
import { Link } from "react-router-dom";
import logotype from "@/assets/logotype.png";

const Footer = () => {
  const { content } = useContent();
  const { footer } = content;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 py-12 lg:py-16 border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={logotype} alt="B2Santos Communication" className="h-12 w-auto brightness-0 invert opacity-80 hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-slate-400 max-w-sm mb-6 leading-relaxed">
              {footer.description}
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Linkedin, Twitter].map((Icon, index) => (
                <a 
                  key={index}
                  href="#" 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-cyan-400 transition-all duration-300"
                  aria-label={Icon.name}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-slate-100">Navigation</h4>
            <ul className="space-y-3 text-slate-400">
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">Accueil</Link></li>
              <li><Link to="/services" className="hover:text-cyan-400 transition-colors">Services</Link></li>
              <li><Link to="/about" className="hover:text-cyan-400 transition-colors">À Propos</Link></li>
              <li><Link to="/#pricing" className="hover:text-cyan-400 transition-colors">Tarifs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4 text-slate-100">Contact</h4>
            <ul className="space-y-3 text-slate-400">
              <li><Link to="/contact" className="hover:text-cyan-400 transition-colors">Demander une démo</Link></li>
              <li><Link to="/contact" className="hover:text-cyan-400 transition-colors">Support</Link></li>
              <li><a href={`mailto:${footer.email}`} className="hover:text-cyan-400 transition-colors">{footer.email}</a></li>
              <li><a href={`tel:${footer.phone}`} className="hover:text-cyan-400 transition-colors">{footer.phone}</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {currentYear} B2Santos Communication. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-cyan-400 transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">CGU</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
