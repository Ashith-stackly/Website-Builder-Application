"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Package,
  X,
  DollarSign,
  User,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useShallow } from "zustand/react/shallow";
import {
  listOrders,
  getOrder,
  updateOrderStatus
} from "@/lib/ecommerceApi";
import type { Order } from "@/types/ecommerce";
import { staggerContainer, staggerChild, spring } from "@/lib/motion";

export default function OrdersPage() {
  const { projects, loadProjects, isLoading: loadingProjects } = useProjectStore(
    useShallow((state) => ({
      projects: state.projects,
      loadProjects: state.loadProjects,
      isLoading: state.isLoading,
    })),
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrdersList, setLoadingOrdersList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Form Fields for Status Update
  const [orderStatus, setOrderStatus] = useState<Order["status"]>("pending");
  const [paymentStatus, setPaymentStatus] = useState<Order["paymentStatus"]>("pending");
  const [paymentId, setPaymentId] = useState("");

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

  // Fetch orders when project changes
  const fetchOrders = async (projectId: string) => {
    if (!projectId) return;
    setLoadingOrdersList(true);
    setError(null);
    try {
      const response = await listOrders(projectId, { limit: 100 });
      setOrders(response.orders || []);
    } catch (err: any) {
      console.error("Error loading orders:", err);
      setError(err?.message || "Failed to load order dashboard.");
    } finally {
      setLoadingOrdersList(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      void fetchOrders(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Open Details Modal & Load latest data
  const handleOpenDetails = async (orderId: string) => {
    setLoadingDetail(true);
    setUpdateError(null);
    try {
      const orderData = await getOrder(orderId);
      setSelectedOrder(orderData);
      setOrderStatus(orderData.status);
      setPaymentStatus(orderData.paymentStatus);
      setPaymentId(orderData.paymentId || "");
      setDetailOpen(true);
    } catch (err: any) {
      console.error("Error fetching order details:", err);
      alert(err?.message || "Failed to load order details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Submit Status updates
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdatingStatus(true);
    setUpdateError(null);

    try {
      const updated = await updateOrderStatus(selectedOrder._id, {
        status: orderStatus,
        paymentStatus: paymentStatus,
        paymentId: paymentId.trim() || undefined
      });
      setSelectedOrder(updated);
      // Refresh list
      if (selectedProjectId) {
        void fetchOrders(selectedProjectId);
      }
      alert("Order status updated successfully!");
    } catch (err: any) {
      console.error("Error updating order status:", err);
      setUpdateError(err?.message || "Failed to update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let pendingCount = 0;
    let processingCount = 0;
    let fulfilledCount = 0;

    orders.forEach((o) => {
      if (o.paymentStatus === "completed" || o.status === "delivered") {
        totalRevenue += o.totalAmount;
      }
      if (o.status === "pending") {
        pendingCount++;
      } else if (o.status === "processing" || o.status === "confirmed") {
        processingCount++;
      } else if (o.status === "delivered") {
        fulfilledCount++;
      }
    });

    return {
      revenue: totalRevenue,
      pending: pendingCount,
      processing: processingCount,
      fulfilled: fulfilledCount,
      total: orders.length
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o._id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

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
            <ClipboardList className="h-8 w-8" />
          </span>
          <h3 className="mt-6 text-xl font-extrabold" style={{ color: "var(--text)" }}>No projects found</h3>
          <p className="mt-2 max-w-md text-sm leading-6" style={{ color: "var(--text-muted)" }}>
            You need a website builder project before you can manage orders. Create a project first in the dashboard.
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
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>Order Operations</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Monitor and fulfill incoming customer purchases from your checkout forms.
          </p>
        </div>
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
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-500/20 p-6 text-center" style={{ background: "var(--surface)" }}>
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <h3 className="mt-3 font-bold text-red-500">Error loading orders</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          <button onClick={() => fetchOrders(selectedProjectId)} className="mt-4 rounded-xl border px-4 py-2 text-xs font-bold transition hover:bg-black/5" style={{ color: "var(--text)", borderColor: "var(--border)" }}>
            Try Again
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Dashboard Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border p-6 flex items-center justify-between shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <span className="text-xs font-bold" style={{ color: "var(--text-faint)" }}>Gross Revenue</span>
                <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text)" }}>₹{stats.revenue.toLocaleString("en-IN")}</h3>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-5 w-5" />
              </span>
            </div>

            <div className="rounded-3xl border p-6 flex items-center justify-between shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <span className="text-xs font-bold" style={{ color: "var(--text-faint)" }}>Pending Action</span>
                <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text)" }}>{stats.pending} orders</h3>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Clock className="h-5 w-5" />
              </span>
            </div>

            <div className="rounded-3xl border p-6 flex items-center justify-between shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <span className="text-xs font-bold" style={{ color: "var(--text-faint)" }}>Processing</span>
                <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text)" }}>{stats.processing} orders</h3>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                <Truck className="h-5 w-5" />
              </span>
            </div>

            <div className="rounded-3xl border p-6 flex items-center justify-between shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <span className="text-xs font-bold" style={{ color: "var(--text-faint)" }}>Delivered</span>
                <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text)" }}>{stats.fulfilled} orders</h3>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: "var(--text-muted)" }}>
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search by customer name, email, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                <Filter className="h-3 w-3" /> Fulfill:
              </span>
              {(["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold capitalize transition-all ${
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

          {/* Orders Table list */}
          {loadingOrdersList ? (
            <div className="flex h-[30vh] w-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading orders ledger...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed py-16 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <Package className="mx-auto h-12 w-12" style={{ color: "var(--text-faint)" }} />
              <h3 className="mt-4 text-base font-bold" style={{ color: "var(--text)" }}>No orders recorded</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {searchQuery || statusFilter !== "all"
                  ? "Try resetting your active filters or search terms."
                  : "Orders will automatically appear here when customers complete checkouts."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border shadow-sm" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                      <th className="px-6 py-4 font-extrabold" style={{ color: "var(--text)" }}>Order ID</th>
                      <th className="px-6 py-4 font-extrabold" style={{ color: "var(--text)" }}>Customer</th>
                      <th className="px-6 py-4 font-extrabold" style={{ color: "var(--text)" }}>Placed On</th>
                      <th className="px-6 py-4 font-extrabold" style={{ color: "var(--text)" }}>Payment Status</th>
                      <th className="px-6 py-4 font-extrabold" style={{ color: "var(--text)" }}>Fulfillment</th>
                      <th className="px-6 py-4 font-extrabold text-right" style={{ color: "var(--text)" }}>Amount</th>
                      <th className="px-6 py-4 font-extrabold" style={{ color: "var(--text)" }}></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-black/5 transition duration-150">
                        <td className="px-6 py-4 font-mono text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                          #{order._id.substring(order._id.length - 8)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold" style={{ color: "var(--text)" }}>{order.customerName || "Walk-in Guest"}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{order.customerEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-xs" style={{ color: "var(--text-muted)" }}>
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              order.paymentStatus === "completed"
                                ? "bg-green-500/15 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                                : order.paymentStatus === "pending" || order.paymentStatus === "processing"
                                ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                                : "bg-red-500/15 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              order.status === "delivered"
                                ? "bg-green-500/15 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                                : order.status === "shipped" || order.status === "processing"
                                ? "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                : order.status === "cancelled"
                                ? "bg-red-500/15 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                : "bg-slate-500/15 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black" style={{ color: "var(--text)" }}>
                          ₹{order.totalAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenDetails(order._id)}
                            className="inline-flex items-center gap-1 text-xs font-bold transition-transform hover:translate-x-0.5"
                            style={{ color: "var(--accent)" }}
                          >
                            View Ops <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Operations Drawer / Detail Modal */}
      <AnimatePresence>
        {detailOpen && selectedOrder && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={spring.soft}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l shadow-2xl flex flex-col"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b p-5" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <ClipboardList className="h-5 w-5 text-indigo-500" /> Order Operations
                  </h3>
                  <p className="text-xs mt-0.5 font-mono uppercase" style={{ color: "var(--text-faint)" }}>
                    Order ID: #{selectedOrder._id}
                  </p>
                </div>
                <button
                  onClick={() => setDetailOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg border hover:bg-black/5"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status Update Form */}
                <form onSubmit={handleStatusSubmit} className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>Fulfillment Controls</h4>

                  {updateError && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs font-bold text-red-500">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{updateError}</span>
                    </div>
                  )}

                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <Truck className="h-3 w-3" /> Ship Status
                      </label>
                      <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value as any)}
                        className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <CreditCard className="h-3 w-3" /> Payment Status
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <ShieldCheck className="h-3 w-3" /> Transaction Payment ID
                    </label>
                    <input
                      type="text"
                      value={paymentId}
                      onChange={(e) => setPaymentId(e.target.value)}
                      placeholder="e.g. pay_Nabc123XyZ"
                      className="w-full rounded-xl border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.01]"
                    style={{ background: "var(--accent)" }}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply Fulfill Modifications"
                    )}
                  </button>
                </form>

                {/* Items Ordered List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>Line Items</h4>
                  <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                          <th className="px-4 py-3 font-bold" style={{ color: "var(--text)" }}>Item</th>
                          <th className="px-4 py-3 font-bold text-center" style={{ color: "var(--text)" }}>Qty</th>
                          <th className="px-4 py-3 font-bold text-right" style={{ color: "var(--text)" }}>Price</th>
                          <th className="px-4 py-3 font-bold text-right" style={{ color: "var(--text)" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                        {selectedOrder.items.map((item) => (
                          <tr key={item._id}>
                            <td className="px-4 py-3 font-bold" style={{ color: "var(--text)" }}>{item.name}</td>
                            <td className="px-4 py-3 text-center" style={{ color: "var(--text-muted)" }}>{item.quantity}</td>
                            <td className="px-4 py-3 text-right" style={{ color: "var(--text-muted)" }}>₹{item.price.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--text)" }}>
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col items-end gap-1 px-2">
                    <div className="flex gap-4 text-xs">
                      <span style={{ color: "var(--text-faint)" }}>Subtotal:</span>
                      <span className="font-bold w-20 text-right" style={{ color: "var(--text)" }}>
                        ₹{selectedOrder.subtotal?.toLocaleString("en-IN") || selectedOrder.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    {selectedOrder.shippingCost > 0 && (
                      <div className="flex gap-4 text-xs">
                        <span style={{ color: "var(--text-faint)" }}>Shipping:</span>
                        <span className="font-bold w-20 text-right" style={{ color: "var(--text)" }}>
                          ₹{selectedOrder.shippingCost.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-4 text-sm font-black border-t pt-1.5 mt-1" style={{ borderColor: "var(--border)" }}>
                      <span style={{ color: "var(--text)" }}>Total Paid:</span>
                      <span className="w-20 text-right" style={{ color: "var(--text)" }}>
                        ₹{selectedOrder.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>Customer Contact</h4>
                  <div className="rounded-2xl border p-4 space-y-2.5 text-xs" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
                      <span className="font-bold" style={{ color: "var(--text)" }}>{selectedOrder.customerName || "Anonymous Purchaser"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
                      <a href={`mailto:${selectedOrder.customerEmail}`} className="hover:underline font-medium" style={{ color: "var(--accent)" }}>
                        {selectedOrder.customerEmail}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Shipping Destination */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>Shipping Address</h4>
                  <div className="rounded-2xl border p-4 space-y-3 text-xs" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    {selectedOrder.shippingAddress && Object.keys(selectedOrder.shippingAddress).length > 0 ? (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4.5 w-4.5 shrink-0 mt-0.5" style={{ color: "var(--text-faint)" }} />
                        <div className="space-y-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          <p className="font-bold" style={{ color: "var(--text)" }}>{selectedOrder.shippingAddress.name || selectedOrder.customerName}</p>
                          <p>{selectedOrder.shippingAddress.street || selectedOrder.shippingAddress.address || "Street Address Unspecified"}</p>
                          <p>
                            {[
                              selectedOrder.shippingAddress.city || selectedOrder.shippingAddress.locality,
                              selectedOrder.shippingAddress.state,
                              selectedOrder.shippingAddress.zip || selectedOrder.shippingAddress.postalCode
                            ].filter(Boolean).join(", ")}
                          </p>
                          {selectedOrder.shippingAddress.country && <p>{selectedOrder.shippingAddress.country}</p>}
                          {selectedOrder.shippingAddress.phone && (
                            <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>Phone: {selectedOrder.shippingAddress.phone}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>No shipping address captured. (Likely Digital / COD checkout)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction Metadata */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>Transaction Ledger</h4>
                  <div className="rounded-2xl border p-4 space-y-2.5 text-xs font-mono" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-faint)" }}>Method:</span>
                      <span className="font-bold capitalize" style={{ color: "var(--text-muted)" }}>
                        {selectedOrder.paymentProvider === "razorpay" ? "Razorpay Gateway" : selectedOrder.paymentProvider || "COD"}
                      </span>
                    </div>
                    {selectedOrder.razorpayOrderId && (
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-faint)" }}>Gateway Order:</span>
                        <span className="font-bold text-[10px] break-all" style={{ color: "var(--text-muted)" }}>
                          {selectedOrder.razorpayOrderId}
                        </span>
                      </div>
                    )}
                    {selectedOrder.razorpayPaymentId && (
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-faint)" }}>Gateway Payment:</span>
                        <span className="font-bold text-[10px] break-all" style={{ color: "var(--text-muted)" }}>
                          {selectedOrder.razorpayPaymentId}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-faint)" }}>Created On:</span>
                      <span className="font-bold text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {new Date(selectedOrder.createdAt).toISOString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-faint)" }}>Last Changed:</span>
                      <span className="font-bold text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {new Date(selectedOrder.updatedAt).toISOString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
