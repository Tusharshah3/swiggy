import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-gray-100 shadow px-6 py-4 flex justify-around items-end">
      <div className="text-xl flex justify-end font-bold text-purple-700">MiniSwiggy 🍽️</div>
      <div className="space-x-4 text-sm">
        <Link href="/">Home</Link>
        
        <Link href="/cart">Cart</Link>
        <Link href="/orders">Orders</Link>
      </div>
    </nav>
  );
}
