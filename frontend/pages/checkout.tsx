import { useMutation } from "@apollo/client/react";
import { CHECKOUT_MUTATION } from "../graphql/order";
import { useRouter } from "next/router";
import { useState } from "react";
import Navbar from "../components/navbar";
export default function CheckoutPage() {
  const router = useRouter();
  const [checkout, { loading, error }] = useMutation(CHECKOUT_MUTATION);
  const [done, setDone] = useState(false);

  const handleCheckout = async () => {
    try {
      const key = "order-" + Math.random().toString(36).substring(2, 8);
      const { data } = await checkout({ variables: { key } });
      //@ts-ignore
      if (data?.checkout) {
        setDone(true);
        setTimeout(() => router.push("/orders"), 2000);
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 text-center space-y-6">
      <Navbar />
      <h2 className="text-2xl font-bold">Ready to Place Order?</h2>
      <button
        onClick={handleCheckout}
        className="bg-purple-600 text-white px-4 py-2 rounded"
        disabled={loading || done}
      >
        {loading ? "Processing..." : done ? "Success 🎉" : "Checkout"}
      </button>
      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  );
}
