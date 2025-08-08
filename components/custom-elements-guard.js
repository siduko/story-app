"use client";
import { useEffect } from 'react';

export function CustomElementsGuard() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.customElements) return;
    const registry = window.customElements;
    const originalDefine = registry.define.bind(registry);
    registry.define = (name, constructor, options) => {
      if (registry.get(name)) return;
      originalDefine(name, constructor, options);
    };
  }, []);
  return null;
}
