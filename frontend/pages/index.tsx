import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PRODUCTS, ADD_TO_CART } from "../graphql/product";
import { useState } from "react";
import { useRouter } from "next/router";


export default function HomePage() {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: { page: 1, limit: 10 },
  });

  const [addToCart] = useMutation(ADD_TO_CART);
  const [adding, setAdding] = useState<string | null>(null);
  const [showCartButton, setShowCartButton] = useState(false);

 const handleAdd = async (id: string) => {
  try {
    setAdding(id);
    await addToCart({
      variables: { productId: id, quantity: 1 },
    });
    setShowCartButton(true); // ✅ show the floating button
  } catch (err) {
    alert("Failed to add to cart ❌");
  } finally {
    setAdding(null);
  }
};


  if (loading) return <p className="text-center mt-10">Loading products...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">Error: {error.message}</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Product Catalog</h1>
      {/* //@ts-ignore */}
      {data.getProducts.map((p: any) => (
        <div
          key={p.id}
          className="border rounded p-4 flex justify-between items-center"
        >
          <div>
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <p>₹ {p.price.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Stock: {p.stock}</p>
          </div>
          <button
            onClick={() => handleAdd(p.id)}
            className="bg-blue-600 text-white px-3 py-1 rounded"
            disabled={adding === p.id}
          >
            {adding === p.id ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      ))}

      {showCartButton && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => router.push("/cart")}
            className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg"
          >
            🛒 View Cart
          </button>
        </div>
      )}

    </div>
  );
}
