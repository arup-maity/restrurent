import * as React from "react";

import { cn } from "@/lib/utils";
import { Eye, EyeOff, X } from "lucide-react";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => {
   return (
      <input
         type={type}
         className={cn(
            "flex h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-1 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-950 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-zinc-800 dark:file:text-zinc-50 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300",
            className,
         )}
         ref={ref}
         {...props}
      />
   );
});
Input.displayName = "Input";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
   onChange?: (value: string) => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(({ className, onChange, type = "text", ...props }, ref) => {
   const [value, setValue] = React.useState("");

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value || "";
      setValue(newValue);
      onChange?.(newValue); // Custom onChange
   };

   const handleClear = () => {
      setValue("");
      onChange?.("");
   };

   return (
      <div className="relative">
         <input
            type={type}
            className={cn(
               "flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-base transition-colors placeholder:text-zinc-500 focus-visible:outline-none dark:border-zinc-800 dark:file:text-zinc-50 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300",
               className,
            )}
            ref={ref}
            value={value}
            onChange={handleChange}
            {...props}
         />
         {value && (
            <div className="absolute right-1.5 top-3 cursor-pointer" onClick={handleClear}>
               <X className="h-4 w-4" />
            </div>
         )}
      </div>
   );
});
SearchInput.displayName = "SearchInput";

const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
   const [showPassword, setShowPassword] = React.useState(false);
   return (
      <div className="relative">
         <input
            type={showPassword ? "text" : "password"}
            className={cn(
               "flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-base transition-colors placeholder:text-zinc-500 focus-visible:outline-none dark:border-zinc-800 dark:file:text-zinc-50 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300",
               className,
            )}
            ref={ref}
            {...props}
         />
         <div className="absolute right-1.5 top-3 cursor-pointer" onClick={() => setShowPassword((prev) => !prev)}>
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
         </div>
      </div>
   );
});
PasswordInput.displayName = "PasswordInput";

export { Input, SearchInput, PasswordInput };
