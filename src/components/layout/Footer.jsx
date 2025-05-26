import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="py-2 px-4 text-xs text-gray-500 bg-dark border-t border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div>
          © 2025 Generador de documentos legales. Todos los derechos reservados.
        </div>
        <div className="flex space-x-4 mt-1 md:mt-0">
          <Link href="/terms" className="hover:text-gray-300 transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">
            Privacy
          </Link>
          <Link href="/support" className="hover:text-gray-300 transition-colors">
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
