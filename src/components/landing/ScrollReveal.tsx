"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "zoom" | "fade";
  delay?: number; // en milisegundos
  duration?: number; // en milisegundos
  className?: string;
  threshold?: number;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 700,
  className = "",
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once && domRef.current) {
              observer.unobserve(domRef.current);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px", // se activa justo cuando va a entrar
      }
    );

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [threshold, once]);

  // Estilos de transformación inicial según la dirección
  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0) scale(1)";
    switch (direction) {
      case "up":
        return "translate3d(0, 32px, 0) scale(0.99)";
      case "down":
        return "translate3d(0, -32px, 0) scale(0.99)";
      case "left":
        return "translate3d(36px, 0, 0)";
      case "right":
        return "translate3d(-36px, 0, 0)";
      case "zoom":
        return "translate3d(0, 0, 0) scale(0.92)";
      case "fade":
      default:
        return "translate3d(0, 0, 0)";
    }
  };

  return (
    <div
      ref={domRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
