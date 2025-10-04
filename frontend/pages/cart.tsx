import { useQuery, useMutation } from "@apollo/client/react";
import {
  MY_CART,
  UPDATE_CART,
  REMOVE_FROM_CART,
} from "../graphql/cart";
import { useRouter } from "next/router";
import Navbar from "../components/navbar";

export default function CartPage() {  
  const router = useRouter();

  const { data, loading, error, refetch } = useQuery(MY_CART);
  const [updateCart] = useMutation(UPDATE_CART);
  const [removeFromCart] = useMutation(REMOVE_FROM_CART);

  if (loading) {
    return (
      <div className="text-center mt-10">
        Loading cart...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 mt-10">
        Error: {error.message}
      </div>
    );
  }
  //@ts-ignore
  const cart = data?.myCart;

  const handleUpdate = async (productId: string, quantity: number) => {
    await updateCart({ variables: { productId, quantity } });
    refetch();
  };

  const handleRemove = async (productId: string) => {
    await removeFromCart({ variables: { productId } });
    refetch();
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-4">
      <Navbar />
      <h2 className="text-2xl font-bold mb-4">My Cart</h2>

      {cart?.items.map((item: any) => (
        <div
          key={item.product.id}
          className="border rounded-lg p-4 flex gap-4 items-center shadow"
        >
          {/* ✅ Product Image */}
          <img
            src={item.product.image || "https://source.unsplash.com/featured/?food"}
            alt={item.product.name}
            className="w-24 h-24 object-cover rounded"
          />

          {/* ✅ Product Info and Actions */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{item.product.name}</h3>
            <p className="text-gray-600 text-sm mb-2">
              ₹ {item.product.price.toFixed(2)} × {item.quantity}
            </p>

            {/* ✅ Quantity Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUpdate(item.product.id, item.quantity + 1)}
                className="px-3 py-1 bg-green-500 text-white rounded"
              >
                +
              </button>

              <span className="font-semibold">{item.quantity}</span>

              <button
                onClick={() =>
                  item.quantity > 1
                    ? handleUpdate(item.product.id, item.quantity - 1)
                    : handleRemove(item.product.id)
                }
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                –
              </button>
            </div>
          </div>
        </div>
      ))}

          {/* ✅ Cart Footer */}
        <div className="mt-6 p-4 border-t text-right space-y-2">
          <div className="font-bold text-lg">Total: ₹ {cart.total.toFixed(2)}</div>

          <button
            onClick={() => router.push("/checkout")}
            className="bg-purple-600 text-white px-6 py-2 rounded shadow hover:bg-purple-700"
          >
            Proceed to Checkout
          </button>
        </div>


    </div>
  );
}
