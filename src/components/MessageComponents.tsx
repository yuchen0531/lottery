// import { useState, useRef, useEffect } from "react";
// import { images } from "../assets/image";
import { motion, AnimatePresence } from "framer-motion";

interface MessageModalProps {
  show: boolean;
  text?: string;
  closeText?: string;
  confirmText?: string;
  onClose: () => void;
  onConfirm?: () => void;
}
export function MessageComponents({ show, text, closeText, confirmText, onClose, onConfirm }: MessageModalProps) {
    return (
        <AnimatePresence>
            {show && (
            <motion.div
                key="modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]"
            >
                <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg p-6 max-w-sm w-[85%] shadow-lg text-center"
                >
                <p className="text-[#555] text-lg font-bold mb-3">{text}</p>
                <div className="flex justify-center ">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-[#929292] text-white rounded hover:bg-[#4b4b4b] transition"
                >
                    {closeText}
                </button>
                {(confirmText !== '') && (
                    <button
                        onClick={onConfirm}
                        className="ml-3 px-4 py-2 bg-[#f87171] text-white rounded hover:bg-[#d16a6a] transition"
                    >
                        {confirmText}
                    </button>
                )}
                </div>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
    )
}

