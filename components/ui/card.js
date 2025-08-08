import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-4", className)} {...props} />
);
const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("text-base font-semibold leading-none tracking-tight", className)} {...props} />
);
const CardDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);
const CardContent = ({ className, ...props }) => (
  <div className={cn("p-4 pt-0", className)} {...props} />
);
const CardFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center p-4 pt-0", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

