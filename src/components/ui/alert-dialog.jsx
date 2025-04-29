import React from "react";
import { motion } from "framer-motion";

const AlertDialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {children}
    </div>
  );
};

const AlertDialogContent = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`bg-background rounded-lg shadow-lg max-w-md w-full p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};

const AlertDialogHeader = ({ children, className = "" }) => {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
};

const AlertDialogTitle = ({ children, className = "" }) => {
  return (
    <h2 className={`text-lg font-semibold text-foreground ${className}`}>
      {children}
    </h2>
  );
};

const AlertDialogDescription = ({ children, className = "" }) => {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
  );
};

const AlertDialogFooter = ({ children, className = "" }) => {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className}`}
    >
      {children}
    </div>
  );
};

const AlertDialogCancel = ({ children, className = "", onClick, ...props }) => {
  return (
    <button
      className={`px-4 py-2 border border-input bg-background rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground mt-2 sm:mt-0 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const AlertDialogAction = ({ children, className = "", onClick, ...props }) => {
  return (
    <button
      className={`px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
};
