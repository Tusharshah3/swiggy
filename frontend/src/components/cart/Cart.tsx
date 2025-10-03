import React from 'react';

const Cart: React.FC = () => {
    // Sample cart items
    const cartItems = [
        { id: 1, name: 'Pizza', quantity: 2, price: 10 },
        { id: 2, name: 'Burger', quantity: 1, price: 5 },
    ];

    const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <div>
            <h1>Your Cart</h1>
            <ul>
                {cartItems.map(item => (
                    <li key={item.id}>
                        {item.name} - Quantity: {item.quantity} - Price: ${item.price}
                    </li>
                ))}
            </ul>
            <h2>Total Amount: ${totalAmount}</h2>
            <button>Checkout</button>
        </div>
    );
};

export default Cart;