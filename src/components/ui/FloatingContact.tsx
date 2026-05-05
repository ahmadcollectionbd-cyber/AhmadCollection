import { useState } from 'react';
import { FaFacebookMessenger, FaWhatsapp } from 'react-icons/fa';
import { FiMessageCircle, FiPhone, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { callLink, messengerLink, whatsappLink } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';

export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const settings = useSettingsStore((s) => s.settings);
  return (
    <div className="fixed bottom-20 right-5 z-30 flex flex-col items-end gap-3 md:bottom-5 md:z-40">
      <AnimatePresence>
        {open && (
          <>
            <motion.a
              initial={{ opacity: 0, y: 12, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.85 }}
              transition={{ delay: 0.0 }}
              href={messengerLink(settings.messengerUrl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0084ff] text-white shadow-lg transition hover:scale-105"
              aria-label="Messenger"
            >
              <FaFacebookMessenger className="h-5 w-5" />
            </motion.a>
            <motion.a
              initial={{ opacity: 0, y: 12, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.85 }}
              transition={{ delay: 0.05 }}
              href={whatsappLink('Hi! I want to place an order.', settings.whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="h-5 w-5" />
            </motion.a>
            <motion.a
              initial={{ opacity: 0, y: 12, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.85 }}
              transition={{ delay: 0.1 }}
              href={callLink(settings.contactPhone)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition hover:scale-105"
              aria-label="Call"
            >
              <FiPhone className="h-5 w-5" />
            </motion.a>
          </>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand transition hover:scale-110"
        aria-label={open ? 'Close contact options' : 'Open contact options'}
      >
        {open ? <FiX className="h-6 w-6" /> : <FiMessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-1 -top-1 inline-flex h-3 w-3 animate-ping rounded-full bg-emerald-400" />
        )}
      </button>
    </div>
  );
}
