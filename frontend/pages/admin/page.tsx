import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_PRODUCTS,
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
} from "../../graphql/product";

export default function AdminPage() {
  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS, {
    variables: { page: 1, limit: 20 },
  });

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    image: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    try {
      await createProduct({
        variables: {
          name: form.name,
          price: parseFloat(form.price),
          stock: parseInt(form.stock),
          image: form.image || undefined,
        },
      });
      setForm({ name: "", price: "", stock: "", image: "" });
      refetch();
    } catch (err) {
      alert("Failed to create product");
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: p.price.toString(),
      stock: p.stock.toString(),
      image: p.image || "",
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateProduct({
        variables: {
          id,
          name: form.name,
          price: parseFloat(form.price),
          stock: parseInt(form.stock),
          image: form.image || undefined,
        },
      });
      setEditingId(null);
      setForm({ name: "", price: "", stock: "", image: "" });
      refetch();
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteProduct({ variables: { id } });
      refetch();
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error.message}</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6 p-4">
      <h1 className="text-2xl font-bold text-center mb-4">🛠️ Admin Dashboard</h1>

      {/* Add or Edit Product Form */}
      <div className="border p-4 rounded shadow space-y-4">
        <h2 className="text-lg font-semibold">
          {editingId ? "✏️ Edit Product" : "➕ Add Product"}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="image"
            placeholder="Image URL (optional)"
            value={form.image}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={editingId ? () => handleUpdate(editingId) : handleCreate}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {editingId ? "Update Product" : "Create Product"}
        </button>
      </div>

      {/* Product List */}
      <div className="space-y-4">
        {/* @ts-ignore */}
        {data.getProducts.map((p: any) => (
          <div
            key={p.id}
            className="border p-4 rounded flex items-center justify-between shadow"
          >
            <div className="flex items-center space-x-4">
              <img
                src={p.image || "https://via.placeholder.com/100"}
                alt={p.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p>₹ {p.price} | Stock: {p.stock}</p>
              </div>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(p)}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
