import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiPhone, FiPlus, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { callLink, whatsappLink } from '../../lib/utils';

export function FloatingContact() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <>
            <motion.a
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ delay: 0.05 }}
              href={whatsappLink('Hi! I want to place an order.')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-glow-brand transition hover:scale-105"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="h-5 w-5" />
            </motion.a>
            <motion.a
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              href={callLink()}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-glow-brand transition hover:scale-105"
              aria-label="Call"
            >
              <FiPhone className="h-5 w-5" />
            </motion.a>
          </>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-13 w-13 h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 p-3 text-white shadow-glow-accent transition hover:scale-110"
        aria-label={open ? 'Close contact options' : 'Open contact options'}
        style={{ height: 56, width: 56 }}
      >
        {open ? <FiX className="h-6 w-6" /> : <FiPlus className="h-6 w-6" />}
      </button>
    </div>
  );
}
