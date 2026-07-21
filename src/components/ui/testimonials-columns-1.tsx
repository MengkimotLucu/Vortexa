"use client";
import React from "react";
import { motion } from "framer-motion";

export interface Testimonial {
  text: string;
  image?: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 16,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, name, role }, i) => (
                <div 
                  className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-md max-w-sm w-full space-y-4 hover:border-blue-500/40 transition-all duration-300" 
                  key={`${index}-${i}`}
                >
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    "{text}"
                  </p>
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">{name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{role}</p>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
