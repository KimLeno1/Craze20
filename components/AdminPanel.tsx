import React, { useState, useEffect } from "react";
import {
  Product,
  ViewState,
  Order,
  OrderStatus,
  Notification,
  PromoCode,
} from "../types";
import { databaseService } from "../services/databaseService";
import { MOCK_ORDERS } from "../mockData";
import AdminProductEditor from "./AdminProductEditor";
import AdminOrderManager from "./AdminOrderManager";
import AdminDatabaseView from "./AdminDatabaseView";
import AdminSupplierPanel from "./AdminSupplierPanel";
import AdminSecurityPanel from "./AdminSecurityPanel";
import AdminPriceAnomalyManager from "./AdminPriceAnomalyManager";
import AdminKitManager from "./AdminKitManager";
import AdminNotificationManager from "./AdminNotificationManager";
import AdminPayForMeManager from "./AdminPayForMeManager";
import AdminPromoManager from "./AdminPromoManager";
import AdminMetricsView from "./AdminMetricsView";
import AdminWalletView from "./AdminWalletView";
import AdminSocialPanel from "./AdminSocialPanel";
import AdminTagCategoryManager from "./AdminTagCategoryManager";
import AdminFeedbackPanel from "./AdminFeedbackPanel";
import AdminCustomRequestsPanel from "./AdminCustomRequestsPanel";
import AdminUserPanel from "./AdminUserPanel";
import AdminFlashSaleManager from "./AdminFlashSaleManager";
import { Skeleton } from "./Skeleton";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  Shield,
  Database,
  Bell,
  TrendingUp,
  Truck,
  Trophy,
  Ticket,
  Zap,
  Handshake,
  Calendar,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Upload,
  Globe,
  Sparkles,
  Download,
} from "lucide-react";

interface AdminPanelProps {
  onExit: () => void;
  onNavigate: (view: ViewState) => void;
  onProductsChange?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  onExit,
  onNavigate,
  onProductsChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "METRICS"
    | "INVENTORY"
    | "ORDERS"
    | "USERS"
    | "DATABASE"
    | "SUPPLIERS"
    | "PROMOS"
    | "FLASH_SALES"
    | "SECURITY"
    | "PRICE_ANOMALY"
    | "KITS"
    | "NOTIFICATIONS"
    | "SPONSORSHIPS"
    | "TREASURY"
    | "SOCIAL"
    | "TAGS"
    | "FEEDBACK"
    | "CUSTOM_REQUESTS"
  >("METRICS");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Advanced filters & bulk edit
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterStock, setFilterStock] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("NEWEST");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkStockCount, setBulkStockCount] = useState<string>("");

  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [bulkImageFiles, setBulkImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const productCategories = Array.from(
    new Set(localProducts.map((p) => p.category)),
  ).filter(Boolean);

  const filteredProducts = localProducts
    .filter((p) => {
      const queryLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !queryLower ||
        p.name.toLowerCase().includes(queryLower) ||
        p.id.toLowerCase().includes(queryLower) ||
        (p.category && p.category.toLowerCase().includes(queryLower)) ||
        (p.supplierId && p.supplierId.toLowerCase().includes(queryLower));
      const matchesCategory =
        filterCategory === "ALL" || p.category === filterCategory;
      const matchesStock =
        filterStock === "ALL" ||
        (filterStock === "IN_STOCK" ? p.inStock : !p.inStock);
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === "STOCK_HIGH_LOW")
        return (b.stockCount || 0) - (a.stockCount || 0);
      if (sortBy === "STOCK_LOW_HIGH")
        return (a.stockCount || 0) - (b.stockCount || 0);
      return 0; // NEWEST
    });

  const handleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProductIds(newSelected);
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleExecuteBulkAction = async () => {
    if (selectedProductIds.size === 0 || !bulkAction) return;

    setIsLoading(true);
    try {
      const selectedIds = Array.from(selectedProductIds);
      let updatedProducts = [...localProducts];

      for (const id of selectedIds) {
        const product = updatedProducts.find((p) => p.id === id);
        if (!product) continue;

        let changes: Partial<Product> = {};

        if (bulkAction === "MARK_IN_STOCK") changes = { inStock: true };
        else if (bulkAction === "MARK_OUT_OF_STOCK")
          changes = { inStock: false };
        else if (bulkAction === "SET_STOCK") {
          const count = parseInt(bulkStockCount);
          if (!isNaN(count))
            changes = { stockCount: count, inStock: count > 0 };
        } else if (bulkAction === "DELETE") {
          // Ideally call a delete endpoint here if needed, or set as archived depending on implementation.
          // For now, let's just stick to stock editing for bulk edits.
        }

        if (Object.keys(changes).length > 0) {
          await databaseService.saveProduct({ ...product, ...changes });
        }
      }

      const refreshedProducts = await databaseService.getProducts();
      setLocalProducts(refreshedProducts);
      setSelectedProductIds(new Set());
      setBulkAction("");
      setBulkStockCount("");
    } catch (error) {
      console.error("Bulk action error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "name,price,originalPrice,shippingFee,image,images,category,gender,description,details,inStock,isCustom\nVintage Leather Jacket,150,200,10,jacket.jpg,jacket1.jpg|jacket2.jpg,Outerwear,UNISEX,A beautiful vintage leather jacket,Warm|Stylish,true,false";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "product_bulk_upload_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = async () => {
    try {
      setIsLoading(true);
      const suppliersList = await databaseService.getSuppliers();
      const suppliersMap = new Map<string, string>();
      if (Array.isArray(suppliersList)) {
        suppliersList.forEach((s) => {
          suppliersMap.set(s.id, s.name);
        });
      }

      // Group & Sort products by supplierId (categorized by supplier)
      const sorted = [...localProducts].sort((a, b) => {
        const supplierA = a.supplierId || "ZZZZZZZZ";
        const supplierB = b.supplierId || "ZZZZZZZZ";
        return supplierA.localeCompare(supplierB);
      });

      // Build CSV
      const headers = [
        "SKU/ID",
        "Name",
        "Category",
        "Price (GH₵)",
        "Original Price (GH₵)",
        "Stock Count",
        "In Stock",
        "Supplier ID",
        "Supplier Name",
        "Brand",
        "Delivery Time"
      ];

      const csvRows = [headers.join(",")];

      for (const p of sorted) {
        const supName = p.supplierId ? (suppliersMap.get(p.supplierId) || p.supplierId) : "Direct/Default";
        const row = [
          `"${(p.id || "").replace(/"/g, '""')}"`,
          `"${(p.name || "").replace(/"/g, '""')}"`,
          `"${(p.category || "").replace(/"/g, '""')}"`,
          p.price,
          p.originalPrice,
          p.stockCount ?? "∞",
          p.inStock ? "YES" : "NO",
          `"${(p.supplierId || "").replace(/"/g, '""')}"`,
          `"${supName.replace(/"/g, '""')}"`,
          `"${(p.brand || "").replace(/"/g, '""')}"`,
          `"${(p.deliveryTime || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `product_database_by_supplier_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export products as CSV:", error);
      alert("Failed to export products as CSV.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUploadSubmit = async () => {
    if (!bulkCsvFile) {
      alert("Please select a CSV file first.");
      return;
    }

    try {
      setIsLoading(true);
      const text = await bulkCsvFile.text();
      const rows = text.split("\n").filter((row) => row.trim());

      if (rows.length < 2) {
        alert("CSV needs a header row and at least one data row");
        return;
      }

      const headers = rows[0]
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, ""));
      let count = 0;

      for (let i = 1; i < rows.length; i++) {
        // Very basic CSV parsing
        // To handle commas inside quotes properly we can use a small regex
        const matches = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const columns = matches.map((c) => c.trim().replace(/^"|"$/g, ""));

        const rowData: any = {};
        headers.forEach((h, index) => {
          rowData[h] = columns[index] || "";
        });

        if (!rowData.name) continue;

        let primaryImageUrl =
          rowData.image ||
          "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80";

        // Find matching image file
        if (rowData.image) {
          const matchingFile = bulkImageFiles.find(
            (f) => f.name === rowData.image,
          );
          if (matchingFile) {
            const uploadRes: any = await databaseService.uploadProductImage(
              matchingFile,
              `${rowData.name || "unnamed"}-main`,
            );
            if (uploadRes && uploadRes.url) {
              primaryImageUrl = uploadRes.url;
            }
          }
        }

        let secondaryImages = [];
        if (rowData.images) {
          const imageNames = rowData.images.split("|");
          for (const imgName of imageNames) {
            const matchingFile = bulkImageFiles.find(
              (f) => f.name === imgName.trim(),
            );
            if (matchingFile) {
              const uploadRes: any = await databaseService.uploadProductImage(
                matchingFile,
                `${rowData.name || "unnamed"}-sec`,
              );
              if (uploadRes && uploadRes.url) {
                secondaryImages.push(uploadRes.url);
              }
            } else {
              secondaryImages.push(imgName); // Keep the string if no local file matched
            }
          }
        }

        const newProduct: Partial<Product> = {
          id:
            rowData.id ||
            `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          name: rowData.name,
          price: parseFloat(rowData.price) || 0,
          originalPrice: parseFloat(rowData.originalPrice) || 0,
          shippingFee: parseFloat(rowData.shippingFee) || 0,
          image: primaryImageUrl,
          images: secondaryImages,
          category: rowData.category || "Uncategorized",
          gender: (rowData.gender as any) || "UNISEX",
          description: rowData.description || "",
          details: rowData.details ? rowData.details.split("|") : [],
          inStock:
            rowData.inStock === "true" ||
            rowData.inStock === "1" ||
            rowData.inStock.toLowerCase() === "yes",
          isCustom:
            rowData.isCustom === "true" ||
            rowData.isCustom === "1" ||
            rowData.isCustom.toLowerCase() === "yes",
        };

        await databaseService.saveProduct(newProduct);
        count++;
      }

      const refreshedProducts = await databaseService.getProducts();
      setLocalProducts(refreshedProducts);
      if (onProductsChange) onProductsChange();
      alert(`Successfully uploaded ${count} products.`);
      setShowBulkUploadModal(false);
      setBulkCsvFile(null);
      setBulkImageFiles([]);
    } catch (err) {
      console.error("Error during bulk upload:", err);
      alert("Failed to process bulk upload.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const products = await databaseService.getProducts();
        const orders = await databaseService.getOrders();
        setLocalProducts(products);
        setLocalOrders(orders);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditorOpen(true);
  };

  const handleSaveProduct = async (formData: Partial<Product>) => {
    try {
      await databaseService.saveProduct(formData);
      const products = await databaseService.getProducts();
      setLocalProducts(products);
      setIsEditorOpen(false);
      if (onProductsChange) onProductsChange();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    tracking?: string,
  ) => {
    await databaseService.updateOrderStatus(orderId, status, tracking);
    setLocalOrders(await databaseService.getOrders());
  };

  return (
    <div className="admin-panel-theme fixed inset-0 z-[300] bg-[#09090B] text-zinc-100 flex flex-col font-mono overflow-hidden">
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 px-8 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em]">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-all border border-zinc-700 text-zinc-200"
          >
            <Menu className="w-4 h-4 text-zinc-200" />
          </button>
          <span className="text-zinc-400">SYSTEM_OVERRIDE_ACTIVE</span>
        </div>
        <button
          onClick={async () => {
            try {
              await databaseService.logout("ADMIN");
            } catch (e) {
              console.error("Admin logout error:", e);
            } finally {
              onExit();
            }
          }}
          className="text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 transition-all border border-red-500/30 rounded-lg"
        >
          TERMINATE_SESSION
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`${isSidebarOpen ? "w-64" : "w-0 opacity-0 pointer-events-none"} bg-zinc-900 border-r border-zinc-800 flex flex-col p-4 space-y-2 overflow-y-auto transition-all duration-300 scrollbar-hide`}
        >
          {[
            { id: "METRICS", label: "Analytics", icon: "📊" },
            { id: "INVENTORY", label: "Inventory", icon: "👕" },
            { id: "ORDERS", label: "Orders", icon: "🚚" },
            { id: "USERS", label: "Users", icon: "👥" },
            { id: "DATABASE", label: "Database", icon: "🗄️" },
            { id: "SUPPLIERS", label: "Suppliers", icon: "🏢" },
            { id: "TREASURY", label: "Treasury", icon: "🏦" },
            { id: "PROMOS", label: "Promos", icon: "🎟️" },
            { id: "FLASH_SALES", label: "Flash Sales", icon: "⚡" },
            { id: "KITS", label: "Synergy Kits", icon: "📦" },
            { id: "PRICE_ANOMALY", label: "Global Reduction", icon: "⚡" },
            { id: "NOTIFICATIONS", label: "Broadcast", icon: "📢" },
            { id: "SPONSORSHIPS", label: "Pay For Me", icon: "🤝" },
            { id: "SECURITY", label: "Security", icon: "🛡️" },
            { id: "SOCIAL", label: "Social Feed", icon: "📸" },
            { id: "TAGS", label: "Tags & Categories", icon: "🏷️" },
            { id: "FEEDBACK", label: "Feedback & Content", icon: "💬" },
            { id: "CUSTOM_REQUESTS", label: "Custom Requests", icon: "✨" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === item.id
                  ? "bg-blue-600 text-white font-black shadow-lg"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#09090B] text-zinc-100">
          {activeTab === "METRICS" && <AdminMetricsView />}
          {activeTab === "INVENTORY" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-serif italic text-white">
                    Inventory
                  </h3>
                  <p className="text-[8px] text-zinc-400 font-black tracking-widest uppercase">
                    Global Supply Records
                  </p>
                </div>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Search SKU, category, or supplier ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-xs text-white placeholder-zinc-500 w-64 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Categories</option>
                    {productCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterStock}
                    onChange={(e) => setFilterStock(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Stock Status</option>
                    <option value="IN_STOCK">In Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="NEWEST">Newest First</option>
                    <option value="STOCK_HIGH_LOW">Stock (High-Low)</option>
                    <option value="STOCK_LOW_HIGH">Stock (Low-High)</option>
                  </select>
                  <button
                    onClick={() => setShowBulkUploadModal(true)}
                    className="px-6 py-3 bg-zinc-900 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all rounded-xl flex items-center gap-2 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Bulk Upload
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-6 py-3 bg-zinc-900 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all rounded-xl flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsEditorOpen(true);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all rounded-xl shadow-lg hover:shadow-blue-500/20"
                  >
                    Add New Item
                  </button>
                </div>
              </div>

              {/* Bulk Actions Panel */}
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSelectAllProducts}
                    className="px-4 py-2 border border-zinc-700 bg-zinc-800 rounded-lg text-[10px] font-black text-zinc-200 hover:bg-zinc-700 tracking-widest uppercase"
                  >
                    {selectedProductIds.size === filteredProducts.length &&
                    filteredProducts.length > 0
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <span className="text-xs font-bold text-zinc-400">
                    {selectedProductIds.size} selected
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 p-2 rounded-lg text-[10px] text-white uppercase tracking-widest"
                  >
                    <option value="">Select Bulk Action</option>
                    <option value="MARK_IN_STOCK">Mark In Stock</option>
                    <option value="MARK_OUT_OF_STOCK">Mark Out of Stock</option>
                    <option value="SET_STOCK">Set Stock Count</option>
                  </select>

                  {bulkAction === "SET_STOCK" && (
                    <input
                      type="number"
                      placeholder="Count"
                      value={bulkStockCount}
                      onChange={(e) => setBulkStockCount(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 p-2 rounded-lg text-[10px] text-white w-20"
                    />
                  )}

                  <button
                    disabled={
                      !bulkAction ||
                      selectedProductIds.size === 0 ||
                      (bulkAction === "SET_STOCK" && !bulkStockCount)
                    }
                    onClick={handleExecuteBulkAction}
                    className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Bulk Edit
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {isLoading
                  ? [...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900 p-6 border border-zinc-800 flex items-center justify-between rounded-3xl"
                      >
                        <div className="flex items-center gap-6">
                          <Skeleton className="w-16 h-20 rounded-xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <div className="flex items-center gap-12">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-10 w-24" />
                        </div>
                      </div>
                    ))
                  : filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className={`bg-zinc-900 p-6 border flex items-center justify-between group transition-all rounded-3xl ${selectedProductIds.has(p.id) ? "border-blue-500 bg-blue-950/20" : "border-zinc-800 hover:border-zinc-700"}`}
                      >
                        <div className="flex items-center gap-6">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.has(p.id)}
                            onChange={() => handleSelectProduct(p.id)}
                            className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 checked:bg-blue-600 checked:border-blue-600 cursor-pointer"
                          />
                          <img
                            src={p.image}
                            className="w-16 h-20 object-cover rounded-xl grayscale-0 transition-all border border-zinc-800"
                          />
                          <div className="space-y-1">
                            <div className="text-xs uppercase font-black text-white flex items-center gap-2">
                              {p.name}
                              {p.inStock ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              )}
                            </div>
                            <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                              SKU: {p.id} | Price: GH₵{p.price} | Stock:{" "}
                              {p.stockCount ?? "∞"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-12">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3">
                              {!!p.isHallOfFame && (
                                <span className="text-[8px] font-black text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded uppercase">
                                  Hall of Fame
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleEditProduct(p)}
                            className="px-6 py-3 bg-zinc-800 text-white text-[9px] uppercase font-black tracking-widest transition-all rounded-lg border border-zinc-700 hover:bg-blue-600 hover:border-blue-600 shadow-sm"
                          >
                            Configure
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}
          {activeTab === "ORDERS" && (
            <AdminOrderManager
              orders={localOrders}
              onUpdateStatus={handleUpdateOrderStatus}
            />
          )}
          {activeTab === "USERS" && <AdminUserPanel />}
          {activeTab === "DATABASE" && <AdminDatabaseView />}
          {activeTab === "SUPPLIERS" && <AdminSupplierPanel />}
          {activeTab === "TREASURY" && <AdminWalletView />}
          {activeTab === "PROMOS" && <AdminPromoManager />}
          {activeTab === "FLASH_SALES" && <AdminFlashSaleManager />}
          {activeTab === "PRICE_ANOMALY" && <AdminPriceAnomalyManager />}
          {activeTab === "KITS" && <AdminKitManager />}
          {activeTab === "NOTIFICATIONS" && <AdminNotificationManager />}
          {activeTab === "SPONSORSHIPS" && <AdminPayForMeManager />}
          {activeTab === "SECURITY" && <AdminSecurityPanel />}
          {activeTab === "SOCIAL" && <AdminSocialPanel />}
          {activeTab === "TAGS" && <AdminTagCategoryManager />}
          {activeTab === "FEEDBACK" && <AdminFeedbackPanel />}
          {activeTab === "CUSTOM_REQUESTS" && <AdminCustomRequestsPanel />}
        </main>
      </div>

      {isEditorOpen && (
        <AdminProductEditor
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}

      {showBulkUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 p-8 rounded-3xl w-full max-w-2xl shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-zinc-950">Bulk Upload Products</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <div>
                  <p className="font-bold text-sm text-zinc-950">Step 1: Download Template</p>
                  <p className="text-xs text-zinc-400">
                    Fill this out with your product data.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all rounded-lg"
                >
                  Download CSV
                </button>
              </div>

              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="font-bold text-sm mb-2 text-zinc-950">
                  Step 2: Upload CSV File
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setBulkCsvFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                />
                {bulkCsvFile && (
                  <p className="text-[10px] text-emerald-600 mt-2">
                    Selected: {bulkCsvFile.name}
                  </p>
                )}
              </div>

              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="font-bold text-sm mb-2 text-zinc-950">
                  Step 3: Upload Product Images
                </p>
                <p className="text-xs text-zinc-400 mb-4">
                  Select all local image files referenced in your CSV (e.g.
                  jacket.jpg).
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    setBulkImageFiles(
                      e.target.files ? Array.from(e.target.files) : [],
                    )
                  }
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                />
                {bulkImageFiles.length > 0 && (
                  <p className="text-[10px] text-emerald-600 mt-2">
                    Selected {bulkImageFiles.length} image(s)
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-zinc-100">
                <button
                  onClick={handleBulkUploadSubmit}
                  disabled={isLoading || !bulkCsvFile}
                  className="flex-1 py-3 bg-zinc-950 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all rounded-xl disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Upload Data"}
                </button>
                <button
                  onClick={() => setShowBulkUploadModal(false)}
                  disabled={isLoading}
                  className="px-6 py-3 bg-zinc-100 text-zinc-500 text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
