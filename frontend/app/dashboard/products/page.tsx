"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Loader2,
  Trash2,
  Pencil,
  AlertCircle,
  Package,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  Tag,
  Warehouse,
  Image as ImageIcon
} from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useShallow } from "zustand/react/shallow";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "@/lib/ecommerceApi";
import type { Product } from "@/types/ecommerce";
import { staggerContainer, staggerChild, spring } from "@/lib/motion";

export default function ProductsPage() {
  const { projects, loadProjects, isLoading: loadingProjects } = useProjectStore(
    useShallow((state) => ({
      projects: state.projects,
      loadProjects: state.loadProjects,
      isLoading: state.isLoading,
    })),
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProductsList, setLoadingProductsList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");

  // Form Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState<number | null>(null);
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [inventory, setInventory] = useState("10");
  const [status, setStatus] = useState<"active" | "draft" | "archived">("active");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Load projects list on mount
  useEffect(() => {
    const controller = new AbortController();
    void loadProjects(controller.signal);
    return () => controller.abort();
  }, [loadProjects]);

  // Set default selected project once loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Load products whenever the selected project changes
  const fetchProducts = async (projectId: string) => {
    if (!projectId) return;
    setLoadingProductsList(true);
    setError(null);
    try {
      const data = await listProducts(projectId);
      setProducts(data);
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err?.message || "Failed to load product catalog.");
    } finally {
      setLoadingProductsList(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      void fetchProducts(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Open Add Modal
  const handleAddOpen = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setSalePrice(null);
    setSku("");
    setCategory("");
    setInventory("10");
    setStatus("active");
    setDescription("");
    setImageUrl("");
    setFormError(null);
    setFormOpen(true);
  };

  // Open Edit Modal
  const handleEditOpen = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(String(product.price));
    setSalePrice(product.salePrice ?? null);
    setSku(product.sku || "");
    setCategory(product.category || "");
    setInventory(String(product.inventory));
    setStatus(product.status);
    setDescription(product.description || "");
    setImageUrl(product.images?.[0] || "");
    setFormError(null);
    setFormOpen(true);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError("Please enter a valid price (greater than or equal to 0).");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const productData = {
      workspaceId: selectedProjectId,
      name: name.trim(),
      price: numPrice,
      sku: sku.trim() || undefined,
      category: category.trim() || undefined,
      inventory: parseInt(inventory) || 0,
      status,
      description: description.trim() || undefined,
      images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, productData);
      } else {
        await createProduct(productData);
      }
      setFormOpen(false);
      void fetchProducts(selectedProjectId);
    } catch (err: any) {
      console.error("Error saving product:", err);
      setFormError(err?.message || "Failed to save product.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Product
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      void fetchProducts(selectedProjectId);
    } catch (err: any) {
      console.error("Error deleting product:", err);
      alert(err?.message || "Failed to delete product.");
    }
  };

  // Filter and Search Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  if (loadingProjects) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: "var(--accent)" }} />
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading project database...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible"
          className="grid place-items-center rounded-3xl border p-16 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <span className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <ShoppingBag className="h-8 w-8" />
          </span>
          <h3 className="mt-6 text-xl font-extrabold" style={{ color: "var(--text)" }}>No projects found</h3>
          <p className="mt-2 max-w-md text-sm leading-6" style={{ color: "var(--text-muted)" }}>
            You need a website builder project before you can manage products. Create a project first in the dashboard.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header & Project Selector */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b pb-6" style={{ borderColor: "var(--border)" }}>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>Product Catalog</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Manage the storefront product inventory and prices for your builder websites.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Select Site:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm font-bold shadow-sm focus:outline-none focus:ring-2"
              style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" }}
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddOpen}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
            style={{ background: "var(--accent)" }}
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Main View */}
      {error ? (
        <div className="mt-8 rounded-2xl border border-red-500/20 p-6 text-center" style={{ background: "var(--surface)" }}>
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <h3 className="mt-3 font-bold text-red-500">Error loading catalog</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          <button onClick={() => fetchProducts(selectedProjectId)} className="mt-4 rounded-xl border px-4 py-2 text-xs font-bold transition hover:bg-black/5" style={{ color: "var(--text)", borderColor: "var(--border)" }}>
            Try Again
          </button>
        </div>
      ) : loadingProductsList ? (
        <div className="flex h-[40vh] w-full flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading product inventory...</span>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Filters and Search Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: "var(--text-muted)" }}>
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                <Filter className="h-3 w-3" /> Status:
              </span>
              {(["all", "active", "draft", "archived"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                    statusFilter === s
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                      : "border hover:bg-black/5"
                  }`}
                  style={{
                    borderColor: statusFilter === s ? "transparent" : "var(--border)",
                    color: statusFilter === s ? "inherit" : "var(--text-muted)"
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <Package className="mx-auto h-12 w-12" style={{ color: "var(--text-faint)" }} />
              <h3 className="mt-4 text-base font-bold" style={{ color: "var(--text)" }}>No products found</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {searchQuery || statusFilter !== "all"
                  ? "Try resetting your active filters or search terms."
                  : "Start selling online by adding your first product to this site."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <button
                  onClick={handleAddOpen}
                  className="mt-5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow"
                  style={{ background: "var(--accent)" }}
                >
                  Add Product
                </button>
              )}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredProducts.map((product) => {
                const isOutOfStock = product.inventory <= 0;
                const isLowStock = product.inventory > 0 && product.inventory < 5;

                return (
                  <motion.div
                    key={product._id}
                    variants={staggerChild}
                    className="flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition-all hover:shadow-md"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                  >
                    <div>
                      {/* Product Header (Status badge + actions) */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            product.status === "active"
                              ? "bg-green-500/15 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                              : product.status === "draft"
                              ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                              : "bg-slate-500/15 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
                          }`}
                        >
                          {product.status}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEditOpen(product)}
                            className="grid h-8 w-8 place-items-center rounded-lg border transition hover:bg-black/5"
                            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                            title="Edit Product"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-red-500/10 transition hover:bg-red-500/10"
                            style={{ color: "var(--text-muted)" }}
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Product Image & Info */}
                      <div className="mt-4 flex gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center" style={{ color: "var(--text-faint)" }}>
                              <ImageIcon className="h-6 w-6" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-sm truncate" style={{ color: "var(--text)" }}>{product.name}</h4>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{product.category || "No Category"}</p>
                          {product.sku && (
                            <p className="mt-1 text-[10px] font-mono uppercase" style={{ color: "var(--text-faint)" }}>
                              SKU: {product.sku}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Description snippet */}
                      {product.description && (
                        <p className="mt-3 text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Footer values (Price & Stock level) */}
                    <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
                      <div>
                        <span className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>Price</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-base" style={{ color: "var(--text)" }}>
                            ₹{product.price.toLocaleString("en-IN")}
                          </span>
                          {product.salePrice && (
                            <span className="text-xs line-through" style={{ color: "var(--text-faint)" }}>
                              ₹{product.salePrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>Stock Level</span>
                        <div className="mt-0.5">
                          {isOutOfStock ? (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide bg-red-500/10 text-red-600 dark:text-red-400">
                              Out of stock
                            </span>
                          ) : isLowStock ? (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Only {product.inventory} left
                            </span>
                          ) : (
                            <span className="text-xs font-black" style={{ color: "var(--text-muted)" }}>
                              {product.inventory} units
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* Edit / Add Slide-over Panel (Modal) */}
      <AnimatePresence>
        {formOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setFormOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs"
            />
            {/* Form Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={spring.soft}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l shadow-2xl flex flex-col"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b p-5" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <ShoppingBag className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-extrabold" style={{ color: "var(--text)" }}>
                    {editingProduct ? "Edit Product" : "New Product"}
                  </h3>
                </div>
                <button
                  onClick={() => setFormOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg border hover:bg-black/5"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Scrollable Body */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                {formError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs font-bold text-red-500">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                    <Tag className="h-3 w-3" /> Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mechanical Keyboard"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>

                {/* Price & Sale Price */}
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <DollarSign className="h-3 w-3" /> Price (INR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="999.00"
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <DollarSign className="h-3 w-3" /> Sale Price (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={salePrice || ""}
                      onChange={(e) => setSalePrice(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="799.00"
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                    />
                  </div>
                </div>

                {/* SKU & Category */}
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <FileText className="h-3 w-3" /> SKU / Model Code
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. KB-MECH-87"
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Tag className="h-3 w-3" /> Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Accessories"
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                    />
                  </div>
                </div>

                {/* Stock Inventory & Status */}
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Warehouse className="h-3 w-3" /> Inventory / Stock
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={inventory}
                      onChange={(e) => setInventory(e.target.value)}
                      placeholder="10"
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                      Visibility Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                    >
                      <option value="active">Active (On Storefront)</option>
                      <option value="draft">Draft (Hidden)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Image URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                    <ImageIcon className="h-3 w-3" /> Image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/keyboard.jpg"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                  {imageUrl.trim() && (
                    <div className="mt-2 h-24 w-24 overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
                      <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                    <FileText className="h-3 w-3" /> Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about sizing, variant options, specifications..."
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex gap-3 pt-6 border-t mt-8" style={{ borderColor: "var(--border)" }}>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="flex-1 rounded-xl border py-2.5 text-sm font-bold transition hover:bg-black/5"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.01]"
                    style={{ background: "var(--accent)" }}
                  >
                    {formSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingProduct ? (
                      "Save Changes"
                    ) : (
                      "Create Product"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
