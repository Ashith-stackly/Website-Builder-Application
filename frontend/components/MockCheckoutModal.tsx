import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaXmark } from "react-icons/fa6";
import { assetPath } from "@/lib/paths";

interface MockCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productName: string;
  productPrice: number;
  productImage?: string;
  productAlt?: string;
  storeName?: string;
  quantity?: number;
}

export default function MockCheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  productName,
  productPrice,
  productImage,
  productAlt = "Product Template",
  storeName = "Stackly Store",
  quantity = 1,
}: MockCheckoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-[390px] mx-4 bg-white rounded-[2rem] p-6 shadow-2xl z-10 overflow-hidden font-sans border border-gray-100"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition p-1"
              aria-label="Close Checkout"
            >
              <FaXmark className="text-xl" />
            </button>

            {/* Header: Razorpay Branding */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <span className="bg-[#06224C] text-white px-3 py-1.5 rounded-lg text-sm font-black tracking-tight select-none">
                Razorpay
              </span>
              <span className="text-sm font-semibold text-gray-500 tracking-wide">
                Mock Checkout
              </span>
            </div>

            {/* Store Information */}
            <div className="mt-5">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                PAYING TO
              </span>
              <span className="text-xl font-black text-[#0B2545] block mt-0.5">
                {storeName}
              </span>
            </div>

            {/* Selected Product Card */}
            {productImage && (
              <div className="mt-4 flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100/80">
                <img
                  src={assetPath(productImage)}
                  alt={productAlt}
                  className="w-12 h-12 object-cover rounded-xl border border-gray-200"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Product</h4>
                  <h3 className="text-sm font-extrabold text-[#0B2545] truncate mt-0.5" title={productName}>
                    {productName}
                  </h3>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                    Quantity: {quantity}
                  </p>
                </div>
              </div>
            )}

            {/* Amount Section */}
            <div className="mt-4 bg-[#f4f8fe] p-4 rounded-2xl flex items-center justify-between border border-[#e3f0fe]">
              <span className="text-sm font-bold text-[#5c728d]">Amount:</span>
              <span className="text-xl font-black text-[#06224C] tabular-nums">
                ₹ {productPrice.toFixed(2)}
              </span>
            </div>

            {/* Action Trigger Button */}
            <button
              type="button"
              onClick={onSuccess}
              className="w-full mt-6 py-4 bg-[#06224C] hover:bg-blue-900 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-blue-500/10 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              Pay Now (Demo)
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
