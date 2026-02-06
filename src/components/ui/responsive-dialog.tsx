import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogCloseProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

const ResponsiveDialogContext = React.createContext<{ isMobile: boolean }>({
  isMobile: false,
});

function useResponsiveDialog() {
  return React.useContext(ResponsiveDialogContext);
}

function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <ResponsiveDialogContext.Provider value={{ isMobile: true }}>
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile: false }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </ResponsiveDialogContext.Provider>
  );
}

function ResponsiveDialogContent({ children, className }: ResponsiveDialogContentProps) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return (
      <DrawerContent className={cn('max-h-[90vh]', className)}>
        <div className="px-4 pb-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={cn('sm:max-w-lg max-h-[90vh] overflow-y-auto', className)}>
      {children}
    </DialogContent>
  );
}

function ResponsiveDialogHeader({ children, className }: ResponsiveDialogHeaderProps) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return (
      <DrawerHeader className={cn('text-left pb-2', className)}>
        {children}
      </DrawerHeader>
    );
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
}

function ResponsiveDialogTitle({ children, className }: ResponsiveDialogTitleProps) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

function ResponsiveDialogDescription({ children, className }: ResponsiveDialogDescriptionProps) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return (
      <DrawerDescription className={cn('text-sm text-muted-foreground', className)}>
        {children}
      </DrawerDescription>
    );
  }

  return <DialogDescription className={className}>{children}</DialogDescription>;
}

function ResponsiveDialogFooter({ children, className }: ResponsiveDialogFooterProps) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>;
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
}

function ResponsiveDialogClose({ children, className, asChild }: ResponsiveDialogCloseProps) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return (
      <DrawerClose className={className} asChild={asChild}>
        {children}
      </DrawerClose>
    );
  }

  return (
    <DialogClose className={className} asChild={asChild}>
      {children}
    </DialogClose>
  );
}

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogClose,
  useResponsiveDialog,
};
