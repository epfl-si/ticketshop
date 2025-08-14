'use client';
import * as packageJson from '../../package.json';

export function Footer() {
    return (
        <footer className="bg-gray-200">
            <div className="ml-6 mr-12 flex flex-col">
                <div className="flex gap-8 items-center h-20">
                    <h3 className="text-xl">Contact</h3>
                    <h3 className="text-sm">EPFL CH-1015 Lausanne</h3>
                    <h3 className="text-sm">+41 21 693 11 11</h3>
                </div>
                <hr className="h-px bg-gray-400 border-0" />
                <div className="flex justify-between h-20 items-center">
                    <div className="flex gap-5">
                        <a 
                            className="text-xs text-gray-600 cursor-pointer underline decoration-red-500 hover:decoration-black transition ease-in-out"
                            href="https://www.epfl.ch/about/overview/fr/reglements-et-directives/mentions-legales/"
                            target="_blank"
                        >
                            Accessibilité
                        </a>
                        <a 
                            className="text-xs text-gray-600 cursor-pointer underline decoration-red-500 hover:decoration-black transition ease-in-out"
                            href="https://www.epfl.ch/about/overview/fr/reglements-et-directives/mentions-legales/"
                            target="_blank"
                        >
                            Mentions légales
                        </a>
                        <a 
                            className="text-xs text-gray-600 cursor-pointer underline decoration-red-500 hover:decoration-black transition ease-in-out"
                            href="https://go.epfl.ch/protection-des-donnees/"
                            target="_blank"
                        >
                            Protection des données
                        </a>
                    </div>
                    <span className="text-xs text-gray-600">© 2025 EPFL, tous droits réservés | TicketShop v{packageJson.version}</span>
                </div>
            </div>
        </footer>
    )
}