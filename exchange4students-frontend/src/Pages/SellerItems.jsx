import React, { useState, useEffect } from "react";
import axios from "axios";

// SellerItems component allows the seller to view, edit, and delete their own items
export default function SellerItems({ username, token, refreshTrigger }) {
  // State to hold all items posted by this seller
  const [items, setItems] = useState([]);

  // State to handle inline editing
  const [editingItemId, setEditingItemId] = useState(null);

  // State to manage form inputs for the item being edited
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    image: null
  });

  // Fetch seller's items when username/token/refresh changes
  useEffect(() => {
    const fetchItems = async () => {
      if (!username || !token) return;

      try {

        const res = await axios.get(`${process.env.REACT_APP_API_URL}/items`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Filter to only show current user's items
        const sellerItems = res.data.filter(
          (item) => item.seller_username === username
        );

        setItems(sellerItems);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };

    fetchItems();
  }, [username, token, refreshTrigger]);

  // Delete an item by ID
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/items/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  // Prepare form fields for editing an item
  const handleEditClick = (item) => {
    setEditingItemId(item.id);
    setEditForm({
      title: item.title,
      description: item.description,
      price: item.price,
      image: null
    });
  };

  // Track form field edits (text fields)
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Track image file change
  const handleImageChange = (e) => {
    setEditForm({ ...editForm, image: e.target.files[0] });
  };

  // Submit item update to backend
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("price", editForm.price);
      if (editForm.image) {
        formData.append("image", editForm.image);
      }

      await axios.put(
        `${process.env.REACT_APP_API_URL}/items/${editingItemId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      // Refresh UI with updated values
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/items`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Filter to only current user's items
      const sellerItems = res.data.filter(
        (item) => item.seller_username === username
      );

      setItems(sellerItems);
      setEditingItemId(null);
    } catch (err) {
      console.error("Error updating item:", err);
    }
  };

  return (
    <div>
      <h2>Your Posted Items</h2>

      {/* Show message if no items exist */}
      {items.length === 0 && <p>You have not posted any items yet.</p>}

      {/* Loop through seller's items */}
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid gray",
            padding: "1rem",
            marginBottom: "1rem"
          }}
        >
          {editingItemId === item.id ? (
            // Edit mode: display form with current item details
            <form onSubmit={handleEditSubmit} encType="multipart/form-data">
              <input
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
              /><br />
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
              /><br />
              <input
                name="price"
                type="number"
                value={editForm.price}
                onChange={handleEditChange}
              /><br />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              /><br />
              {/* Show preview if new image selected */}
              {editForm.image && (
                <div style={{ marginTop: "0.5rem" }}>
                  <strong>New image:</strong>
                  <img
                    src={URL.createObjectURL(editForm.image)}
                    alt="New Preview"
                    style={{ width: "150px", marginTop: "0.5rem" }}
                  />
                </div>
              )}
              <br />
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditingItemId(null)}>Cancel</button>
            </form>
          ) : (
            // View mode: display item details
            <>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p>Price: ${item.price}</p>
              {item.image && (
                <img
                  src={`${process.env.REACT_APP_API_URL}/uploads/${item.image}`}
                  alt={item.title}
                  style={{ width: "150px", height: "auto" }}
                />
              )}
              <br />
              <button onClick={() => handleEditClick(item)}>Edit</button>
              <button onClick={() => handleDelete(item.id)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
