import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogBackdrop, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  size = 'md', 
  showCloseButton = true,
  className = ''
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-none w-full h-full'
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className={`flex min-h-full items-center justify-center p-4 text-center ${size === 'full' ? 'p-0' : ''}`}>
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-left align-middle shadow-xl transition-all ${className}`}>
                {title && (
                  <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">
                      {title}
                    </h3>
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
                
                {!title && showCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 rounded-lg p-2 text-gray-400 hover:text-white hover:bg-black/20 transition-colors backdrop-blur-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                <div className={size === 'full' ? 'h-full' : ''}>
                  {children}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}