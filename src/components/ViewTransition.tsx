/**
 * View Transition Component
 * 
 * Provides smooth, animated transitions between views (chat/kanban/calendar)
 * with spring physics and gesture support.
 */

"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCurrentView, ViewType } from '@/lib/unified-store';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ViewTransitionProps {
  children: React.ReactNode;
  view: ViewType;
  className?: string;
}

interface TransitionConfig {
  direction: 'left' | 'right' | 'up' | 'down' | 'fade';
  duration: number;
  ease: number[];
}

// View order for determining transition direction
const VIEW_ORDER: ViewType[] = ['chat', 'kanban', 'calendar', 'events'];

// ============================================================================
// TRANSITION VARIANTS
// ============================================================================

const getTransitionConfig = (from: ViewType | null, to: ViewType): TransitionConfig => {
  if (!from) {
    return { direction: 'fade', duration: 0.3, ease: [0.4, 0, 0.2, 1] };
  }
  
  const fromIndex = VIEW_ORDER.indexOf(from);
  const toIndex = VIEW_ORDER.indexOf(to);
  
  if (fromIndex === -1 || toIndex === -1) {
    return { direction: 'fade', duration: 0.25, ease: [0.4, 0, 0.2, 1] };
  }
  
  const direction = toIndex > fromIndex ? 'left' : 'right';
  
  return {
    direction,
    duration: 0.35,
    ease: [0.32, 0.72, 0, 1], // Spring-like curve
  };
};

const slideVariants = {
  enter: (config: TransitionConfig) => {
    switch (config.direction) {
      case 'left':
        return { x: '100%', opacity: 0 };
      case 'right':
        return { x: '-100%', opacity: 0 };
      case 'up':
        return { y: '100%', opacity: 0 };
      case 'down':
        return { y: '-100%', opacity: 0 };
      default:
        return { opacity: 0, scale: 0.98 };
    }
  },
  center: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (config: TransitionConfig) => {
    switch (config.direction) {
      case 'left':
        return { x: '-30%', opacity: 0 };
      case 'right':
        return { x: '30%', opacity: 0 };
      case 'up':
        return { y: '-30%', opacity: 0 };
      case 'down':
        return { y: '30%', opacity: 0 };
      default:
        return { opacity: 0, scale: 0.98 };
    }
  },
};

// ============================================================================
// COMPONENTS
// ============================================================================

export function ViewTransition({
  children,
  view,
  className,
}: ViewTransitionProps) {
  const [lastView, setLastView] = useState<ViewType | null>(null);
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    return () => {
      setLastView(view);
    };
  }, [view]);
  
  const config = getTransitionConfig(lastView, view);
  
  // Skip animations if user prefers reduced motion
  if (prefersReducedMotion) {
    return (
      <div className={cn('w-full h-full', className)}>
        {children}
      </div>
    );
  }
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={view}
        custom={config}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          duration: config.duration,
          ease: config.ease,
        }}
        className={cn('w-full h-full', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// VIEW CONTAINER WITH TRANSITIONS
// ============================================================================

interface ViewContainerProps {
  className?: string;
  children: React.ReactNode;
}

export function ViewContainer({ className, children }: ViewContainerProps) {
  const { view } = useCurrentView();
  
  return (
    <ViewTransition view={view} className={className}>
      {children}
    </ViewTransition>
  );
}

// ============================================================================
// SWIPE NAVIGATION HOOK
// ============================================================================

interface SwipeConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enabled?: boolean;
}

export function useSwipeNavigation({
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
}: SwipeConfig) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, [enabled]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || startX.current === null || startY.current === null) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    
    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current;
    
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    startX.current = null;
    startY.current = null;
  }, [enabled, threshold, onSwipeLeft, onSwipeRight]);
  
  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);
}

// ============================================================================
// VIEW NAVIGATION WITH SWIPE
// ============================================================================

export function useViewSwipeNavigation(enabled = true) {
  const { view, navigate } = useCurrentView();
  
  const getNextView = useCallback((): ViewType | null => {
    const currentIndex = VIEW_ORDER.indexOf(view);
    if (currentIndex === -1 || currentIndex >= VIEW_ORDER.length - 1) return null;
    return VIEW_ORDER[currentIndex + 1];
  }, [view]);
  
  const getPrevView = useCallback((): ViewType | null => {
    const currentIndex = VIEW_ORDER.indexOf(view);
    if (currentIndex <= 0) return null;
    return VIEW_ORDER[currentIndex - 1];
  }, [view]);
  
  useSwipeNavigation({
    enabled,
    threshold: 80,
    onSwipeLeft: () => {
      const next = getNextView();
      if (next) navigate(next, { reason: 'Swipe navigation' });
    },
    onSwipeRight: () => {
      const prev = getPrevView();
      if (prev) navigate(prev, { reason: 'Swipe navigation' });
    },
  });
  
  return { getNextView, getPrevView };
}

// ============================================================================
// PAGE LOADING INDICATOR
// ============================================================================

export function PageLoadingIndicator({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 h-1"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_100%] animate-shimmer"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// VIEW PRELOADER
// ============================================================================

const viewComponents: Record<ViewType, () => Promise<unknown>> = {
  chat: () => import('@/app/chat/ChatView'),
  kanban: () => import('@/app/kanban/KanbanView'),
  calendar: () => import('@/app/calendar/CalendarView'),
  events: () => import('@/app/events/EventsView'),
  home: () => import('@/app/HomeView'),
};

export function useViewPreloader() {
  const { view } = useCurrentView();
  const preloadedRef = useRef<Set<ViewType>>(new Set());
  
  // Preload adjacent views
  useEffect(() => {
    const currentIndex = VIEW_ORDER.indexOf(view);
    
    const viewsToPreload: ViewType[] = [];
    
    if (currentIndex > 0) {
      viewsToPreload.push(VIEW_ORDER[currentIndex - 1]);
    }
    if (currentIndex < VIEW_ORDER.length - 1) {
      viewsToPreload.push(VIEW_ORDER[currentIndex + 1]);
    }
    
    for (const v of viewsToPreload) {
      if (!preloadedRef.current.has(v) && viewComponents[v]) {
        preloadedRef.current.add(v);
        viewComponents[v]().catch(() => {
          // Silently fail preload
          preloadedRef.current.delete(v);
        });
      }
    }
  }, [view]);
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default ViewTransition;
