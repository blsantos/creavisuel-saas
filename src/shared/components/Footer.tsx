import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { useContent } from "@/contexts/ContentContext";
import { Link } from "react-router-dom";
import logotype from "@/assets/logotype.png";

const Footer = () => {
  const { content } = useContent();
  const { footer } = content;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={logotype} alt="B2Santos Communication" className="h-12 w-auto brightness-0 invert" />
            </Link>
            <p className="text-secondary-foreground/80 max-w-sm mb-6 leading-relaxed">
              {footer.description}
            </p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Navigation</h4>
            <ul className="space-y-3 text-secondary-foreground/80">
              <li><Link to="/" className="hover:text-primary transition-colors">Accueil</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Services</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">À Propos</Link></li>
              <li><Link to="/#pricing" className="hover:text-primary transition-colors">Tarifs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Contact</h4>
            <ul className="space-y-3 text-secondary-foreground/80">
              <li><Link to="/contact" className="hover:text-primary transition-colors">Demander une démo</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Support</Link></li>
              <li><a href={`mailto:${footer.email}`} className="hover:text-primary transition-colors">{footer.email}</a></li>
              <li><a href={`tel:${footer.phone}`} className="hover:text-primary transition-colors">{footer.phone}</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-secondary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/70">
            © {currentYear} B2Santos Communication. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm text-secondary-foreground/70">
            <a href="#" className="hover:text-primary transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-primary transition-colors">CGU</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
