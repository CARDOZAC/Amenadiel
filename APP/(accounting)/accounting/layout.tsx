import Link from "next/link";
import { LogoutButton } from "@/app/components/LogoutButton";

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">CONTADOR - Auditoría y Cierre</h1>
            <LogoutButton />
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="/accounting" className="hover:underline">
              Panel de Control
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
