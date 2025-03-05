import Link from "next/link";

export function Header() {
    return (
        <header className="flex justify-between items-center p-4 px-8 bg-gray-200 text-white">
            <h1 className="text-2xl font-bold text-black">TicketShop</h1>
            <nav>
                <ul className="flex space-x-4 text-black">
                    <li>
                        <Link href="/">Accueil</Link>
                    </li>
                </ul>
            </nav>
        </header>
    )
}