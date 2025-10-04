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

      {cart?.items.length === 0 && (
        <div>Your cart is empty.</div>
      )}

      {cart?.items.map((item: any) => (
        <div
          key={item.product.id}
          className="border p-4 rounded flex justify-between items-center"
        >
          <div>
            <div className="font-semibold">{item.product.name}</div>
            <div>
              ₹ {item.product.price.toFixed(2)} × {item.quantity}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleUpdate(item.product.id, item.quantity + 1)}
              className="bg-green-600 text-white px-2 py-1 rounded"
            >
              +
            </button>
            <button
              onClick={() =>
                item.quantity > 1
                  ? handleUpdate(item.product.id, item.quantity - 1)
                  : handleRemove(item.product.id)
              }
              className="bg-red-500 text-white px-2 py-1 rounded"
            >
              -
            </button>
          </div>
        </div>
      ))}

      <div className="text-right font-bold mt-4">
        Total: ₹ {cart.total.toFixed(2)}
      </div>

      <div className="text-right font-bold mt-4">
  Total: ₹ {cart.total.toFixed(2)}
  </div>

  {cart?.items.length > 0 && (
    <div className="text-right mt-4">
      <button
        onClick={() => router.push("/checkout")}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        Proceed to Checkout
      </button>
    </div>
  )}

    </div>
  );
}
