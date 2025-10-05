import { useQuery } from "@apollo/client/react";
import { GET_ORDER_HISTORY } from "../../graphql/order";
export default function OrdersPage() {
  const { data, loading, error } = useQuery(GET_ORDER_HISTORY);

  if (loading) return <div className="text-center mt-10">Loading orders...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error.message}</div>;
    //@ts-ignore
  const orders = data.getOrderHistory;

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Your Orders</h2>
      {orders.length === 0 && <div>No orders found.</div>}
      {orders.map((order: any) => (
        <div key={order.id} className="border p-4 rounded shadow">
          <div className="flex justify-between mb-2">
            <div>
              <strong>Order ID:</strong> {order.id}
            </div>
            <div className={`font-semibold ${order.status === "SUCCESS" ? "text-green-600" : "text-yellow-600"}`}>
              {order.status}
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Placed at: {new Date(order.placedAt).toLocaleString()}
          </div>
          <ul className="ml-4 list-disc text-sm">
            {order.items.map((item: any, idx: number) => (
              <li key={idx}>
                Product ID: {item.productId}, Quantity: {item.quantity}, ₹ {item.priceAtPurchase}
              </li>
            ))}
          </ul>
          <div className="text-right font-bold mt-2">
            Total: ₹ {order.total.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
