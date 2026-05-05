"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConfirmationMessageProps {
  /**
   * The message to appear in green box when the process will be successfully completed.
   */
  successMessage?: string;

  /**
   * The name of the organization/bot who performs the operations.
   */
  labelName?: string;

  /**
   * The brief about the process/text/output.
   */
  labelMessage: string;

  /**
   * The icon to display in the checkmark area.
   */
  icon?: React.ReactNode;

  /**
   * Optional receipt-style details to show below the main message.
   */
  details?: React.ReactNode;

  /**
   * Class name for the background element.
   */
  backgroundClassName?: string;

  /**
   * Class name for the container element.
   */
  containerClassName?: string;
}

export default function ConfirmationMessage({
  successMessage = "Process Successful",
  labelName = "Animata",
  labelMessage,
  icon,
  details,
  backgroundClassName,
  containerClassName,
}: ConfirmationMessageProps) {
  return (
    <div
      className={cn(
        "group flex items-center justify-center py-12 relative overflow-hidden rounded-[2.5rem]",
        containerClassName,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 -z-10 h-full w-full items-center bg-gradient-to-r from-teal-500/10 to-emerald-500/10 backdrop-blur-xl",
          backgroundClassName,
        )}
      />

      {/* Parent Container for message */}
      <div className="flex h-64 max-w-lg flex-col items-center justify-center">
        <div className="flex h-16 items-center justify-center overflow-hidden rounded-full bg-emerald-600 shadow-xl shadow-emerald-500/20">
          {/* Icon Area */}
          <div className="z-10 flex h-16 w-16 flex-col content-center items-center justify-center rounded-full bg-emerald-600 text-2xl text-white">
            {icon || <span>&#10003;</span>}
          </div>

          {/* Expanding green box with sliding text */}
          <motion.div
            className="z-0 flex h-16 overflow-hidden rounded-full bg-emerald-600"
            initial={{ width: "0rem" }}
            animate={{ width: "12rem" }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.div
              className="flex items-center text-nowrap pr-6 text-sm font-black uppercase tracking-widest text-white"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1.0, delay: 0.3 }}
            >
              {successMessage}
            </motion.div>
          </motion.div>
        </div>

        {/* Container to control height animation */}
        <motion.div
          className="relative flex h-fit w-full max-w-md overflow-hidden"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          {/* Message box */}
          <div className="my-4 flex h-fit w-full rounded-2xl border border-white/20 bg-white/10 p-6 py-4 shadow-2xl backdrop-blur-md">
            <div className="mr-4 flex h-12 min-w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-black">
              {labelName[0]}
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">{labelName}</p>
              <motion.p
                className="max-w-[300px] text-xs font-bold text-white/80 leading-relaxed mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 0.9 }}
              >
                {labelMessage.length > 200 ? `${labelMessage.slice(0, 199)}...` : labelMessage}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {details && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.5 }}
            className="w-full"
          >
            {details}
          </motion.div>
        )}
      </div>
    </div>
  );
}
