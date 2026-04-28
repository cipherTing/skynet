'use client';

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
  type MutableRefObject,
} from 'react';
import { createPortal } from 'react-dom';

type FloatingSide = 'top' | 'bottom' | 'left' | 'right';
type FloatingAlign = 'start' | 'center' | 'end';

export interface FloatingAnchorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface FloatingPosition {
  left: number;
  top: number;
}

interface FloatingPortalProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  anchorRect?: FloatingAnchorRect | null;
  placement?: FloatingSide;
  align?: FloatingAlign;
  offset?: number;
  viewportPadding?: number;
  zIndex?: number;
  role?: string;
  id?: string;
  ariaLabelledBy?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onMouseEnter?: (event: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLDivElement>) => void;
}

interface PortalTooltipProps {
  children: ReactElement;
  content: ReactNode;
  placement?: FloatingSide;
  align?: FloatingAlign;
  offset?: number;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  wrapperClassName?: string;
  contentClassName?: string;
  delay?: number;
}

export const FLOATING_Z_INDEX = {
  floating: 100,
  tooltip: 120,
  menu: 120,
  modal: 130,
} as const;

function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
        return;
      }
      (ref as MutableRefObject<T | null>).current = node;
    });
  };
}

function composeHandlers<E>(
  original: ((event: E) => void) | undefined,
  ours: (event: E) => void,
) {
  return (event: E) => {
    original?.(event);
    ours(event);
  };
}

function toRect(anchor: FloatingAnchorRect): DOMRect {
  return {
    left: anchor.left,
    top: anchor.top,
    width: anchor.width,
    height: anchor.height,
    right: anchor.left + anchor.width,
    bottom: anchor.top + anchor.height,
    x: anchor.left,
    y: anchor.top,
    toJSON: () => anchor,
  } as DOMRect;
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function oppositeSide(side: FloatingSide): FloatingSide {
  if (side === 'top') return 'bottom';
  if (side === 'bottom') return 'top';
  if (side === 'left') return 'right';
  return 'left';
}

function getCoords(
  anchor: DOMRect,
  content: DOMRect,
  side: FloatingSide,
  align: FloatingAlign,
  offset: number,
) {
  const anchorCenterX = anchor.left + anchor.width / 2;
  const anchorCenterY = anchor.top + anchor.height / 2;
  let left = anchorCenterX - content.width / 2;
  let top = anchorCenterY - content.height / 2;

  if (side === 'top') top = anchor.top - content.height - offset;
  if (side === 'bottom') top = anchor.bottom + offset;
  if (side === 'left') left = anchor.left - content.width - offset;
  if (side === 'right') left = anchor.right + offset;

  if (side === 'top' || side === 'bottom') {
    if (align === 'start') left = anchor.left;
    if (align === 'end') left = anchor.right - content.width;
  } else {
    if (align === 'start') top = anchor.top;
    if (align === 'end') top = anchor.bottom - content.height;
  }

  return { left, top };
}

function sideFits(
  position: FloatingPosition,
  content: DOMRect,
  side: FloatingSide,
  padding: number,
) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (side === 'top') return position.top >= padding;
  if (side === 'bottom') return position.top + content.height <= height - padding;
  if (side === 'left') return position.left >= padding;
  return position.left + content.width <= width - padding;
}

function computePosition(
  anchor: DOMRect,
  content: DOMRect,
  placement: FloatingSide,
  align: FloatingAlign,
  offset: number,
  padding: number,
): FloatingPosition {
  const preferred = getCoords(anchor, content, placement, align, offset);
  const flippedSide = oppositeSide(placement);
  const flipped = getCoords(anchor, content, flippedSide, align, offset);
  const side = sideFits(preferred, content, placement, padding) || !sideFits(flipped, content, flippedSide, padding)
    ? placement
    : flippedSide;
  const position = side === placement ? preferred : flipped;

  return {
    left: clamp(position.left, padding, window.innerWidth - content.width - padding),
    top: clamp(position.top, padding, window.innerHeight - content.height - padding),
  };
}

export function isEventInsideRefs(
  event: Event,
  refs: Array<RefObject<HTMLElement | null>>,
) {
  const path = event.composedPath();
  return refs.some((ref) => {
    const node = ref.current;
    return node ? path.includes(node) : false;
  });
}

export const FloatingPortal = ({
  open,
  anchorRef,
  anchorRect,
  placement = 'bottom',
  align = 'center',
  offset = 8,
  viewportPadding = 8,
  zIndex = FLOATING_Z_INDEX.tooltip,
  role,
  id,
  ariaLabelledBy,
  className = '',
  style,
  children,
  onMouseEnter,
  onMouseLeave,
}: FloatingPortalProps) => {
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<FloatingPosition | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRect ? toRect(anchorRect) : anchorRef?.current?.getBoundingClientRect();
    const content = floatingRef.current?.getBoundingClientRect();
    if (!anchor || !content) return;
    setPosition(computePosition(anchor, content, placement, align, offset, viewportPadding));
  }, [align, anchorRect, anchorRef, offset, placement, viewportPadding]);

  const scheduleUpdate = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      updatePosition();
    });
  }, [updatePosition]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) {
      setPosition(null);
      return undefined;
    }

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);

    const observer = new ResizeObserver(scheduleUpdate);
    if (anchorRef?.current) observer.observe(anchorRef.current);
    if (floatingRef.current) observer.observe(floatingRef.current);

    return () => {
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
      observer.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [anchorRef, mounted, open, scheduleUpdate]);

  useEffect(() => {
    if (open) scheduleUpdate();
  }, [anchorRect, open, scheduleUpdate]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={floatingRef}
      id={id}
      role={role}
      aria-labelledby={ariaLabelledBy}
      className={className}
      style={{
        position: 'fixed',
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        zIndex,
        visibility: position ? 'visible' : 'hidden',
        ...style,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>,
    document.body,
  );
};

export function PortalTooltip({
  children,
  content,
  placement = 'top',
  align = 'center',
  offset = 8,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
  wrapperClassName,
  contentClassName = '',
  delay = 120,
}: PortalTooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current === null) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const show = useCallback(() => {
    if (disabled) return;
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer, disabled, setOpen]);

  const hide = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, delay);
  }, [clearCloseTimer, delay, setOpen]);

  const hideNow = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer, setOpen]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);
  useEffect(() => {
    if (disabled) hideNow();
  }, [disabled, hideNow]);

  if (!isValidElement(children)) return null;

  const child = children as ReactElement<{
    ref?: Ref<HTMLElement>;
    className?: string;
    onMouseEnter?: (event: MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: MouseEvent<HTMLElement>) => void;
    onFocus?: (event: FocusEvent<HTMLElement>) => void;
    onBlur?: (event: FocusEvent<HTMLElement>) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
    'aria-describedby'?: string;
  }>;

  const describedBy = [child.props['aria-describedby'], tooltipId].filter(Boolean).join(' ');

  const trigger = cloneElement(child, {
    ref: composeRefs(child.props.ref, triggerRef),
    className: [child.props.className, wrapperClassName].filter(Boolean).join(' '),
    onMouseEnter: composeHandlers(child.props.onMouseEnter, show),
    onMouseLeave: composeHandlers(child.props.onMouseLeave, hide),
    onFocus: composeHandlers(child.props.onFocus, show),
    onBlur: composeHandlers(child.props.onBlur, hide),
    onKeyDown: composeHandlers(child.props.onKeyDown, (event) => {
      if (event.key === 'Escape') hideNow();
    }),
    'aria-describedby': open ? describedBy : child.props['aria-describedby'],
  });

  return (
    <>
      {trigger}
      <FloatingPortal
        open={open && !disabled}
        anchorRef={triggerRef}
        placement={placement}
        align={align}
        offset={offset}
        zIndex={FLOATING_Z_INDEX.tooltip}
        id={tooltipId}
        role="tooltip"
        className={[
          'max-w-[280px] rounded-lg border border-copper/30 bg-void-deep px-3 py-2 text-[11px] leading-relaxed text-ink-secondary shadow-[0_8px_24px_rgba(0,0,0,0.42)]',
          contentClassName,
        ].filter(Boolean).join(' ')}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {content}
      </FloatingPortal>
    </>
  );
}
