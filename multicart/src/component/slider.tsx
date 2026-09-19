"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import slide1 from "@/assets/silder.png"; // 👈 Your uploaded image
import slide2 from "@/assets/silder1.png";   // 👈 Example second image (replace later)
import slide3 from "@/assets/silder2.png";   // 👈 Example third image (replace later)
import { useRouter } from "next/navigation";

const slides = [
  {
    image: slide1,
    title: "RUN ON AIR",
    subtitle: "DO IT NOW.",
    description: "Running Shoes",
    button: "DISCOVER",
  },
  {
    image: slide2,
    title: "STYLE & COMFORT",
    subtitle: "NEW COLLECTION",
    description: "Women’s Fashion Accessories",
    button: "DISCOVER",
  },
  {
    image: slide3,
    title: "STEP INTO POWER",
    subtitle: "FEEL THE SPEED",
    description: "Smart Gadgets for Smart People",
    button: "DISCOVER",
  },
];

export default function Slider() {
  const [current, setCurrent] = useState(0);
  const router = useRouter()

  // Auto slide every 3 sec
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

 

  return (
    <div className="relative w-full min-h-[90vh] mt-0 overflow-hidden bg-black text-white md:mt-[60px] pt-0 top-0">

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0  flex justify-center items-center"
        >
          <Image
            src={slides[current].image}
            alt={slides[current].title}
            fill
            priority
            className="object-cover opacity-70"
          />

          {/* Overlay content */}
          <div className="absolute inset-0 flex flex-col items-start justify-center px-10 md:px-24 bg-gradient-to-r from-black/70 to-transparent">
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base uppercase tracking-widest text-gray-300"
            >
              {slides[current].subtitle}
            </motion.h3>

            <motion.h1
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl md:text-6xl font-bold mb-4"
            >
              {slides[current].description}
            </motion.h1>

            <motion.p
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg md:text-xl text-gray-300 mb-6"
            >
              {slides[current].title}
            </motion.p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-lg transition"
              onClick={()=>router.push("/category")}
            >
              {slides[current].button}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Thumbnail navigation */}
      <div className="absolute bottom-6 right-6  flex gap-4">
        {slides.map((slide, index) => (
          <motion.div
            key={index}
            onClick={() => setCurrent(index)}
            whileHover={{ scale: 1.1 }}
            className={`relative w-20 h-12 cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 ${index === current
                ? "border-gary-100 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                : "border-gray-500 hover:border-blue-400"
              }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover opacity-90"
            />
          </motion.div>
        ))}
      </div>


     
    </div>
  );
}
