import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const useProductManagement = (fetchData) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: 0, description: '', is_service: false });
  const [variants, setVariants] = useState([]);
  const [extras, setExtras] = useState([]);
  const [file, setFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([null, null, null]);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState([null, null, null]);

  const resetForm = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingItem(null);
    setFile(null);
    setVariants([]);
    setExtras([]);
    setAdditionalFiles([null, null, null]);
    setExistingAdditionalImages([null, null, null]);
    setNewProduct({ name: '', price: '', stock: 0, description: '', is_service: false });
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setNewProduct({ name: item.name, price: item.price, stock: item.stock || 0, description: item.description || '', is_service: item.is_service || false });
    setVariants(item.variants || []);
    setExtras(item.extras || []);

    const existing = [null, null, null];
    if (item.additional_images) {
      item.additional_images.forEach((url, i) => { if (i < 3) existing[i] = url; });
    }
    setExistingAdditionalImages(existing);

    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newProduct).forEach(key => formData.append(key, newProduct[key]));
    formData.append("variants", JSON.stringify(variants));
    formData.append("extras", JSON.stringify(extras));

    const keptImages = existingAdditionalImages.filter(img => img !== null);
    formData.append("existing_additional_images", JSON.stringify(keptImages));

    if (file) formData.append("image", file);
    additionalFiles.forEach((f) => { if (f) formData.append("additional_images", f); });

    try {
      if (isEditing) await api.put(`/business/items/${editingItem.id}`, formData);
      else await api.post("/business/items", formData);
      toast.success("¡Operación exitosa!");
      resetForm();
      fetchData();
    } catch (err) { toast.error("Error al guardar"); }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("¿Eliminar este ítem?")) return;
    try {
      await api.delete(`/business/items/${itemId}`);
      toast.success("Eliminado");
      fetchData();
    } catch (err) { toast.error("Error al eliminar"); }
  };

  return {
    isModalOpen, setIsModalOpen,
    newProduct, setNewProduct,
    variants, setVariants,
    extras, setExtras,
    file, setFile,
    isEditing,
    editingItem,
    additionalFiles, setAdditionalFiles,
    existingAdditionalImages, setExistingAdditionalImages,
    resetForm,
    openEdit,
    handleProductSubmit,
    handleDelete
  };
};

export default useProductManagement;