import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Input } from "./input";
import { Label } from "./label";
import { Eye, EyeOff, Check, X } from "lucide-react";

export const StrengthLevel = {
  EMPTY: "empty",
  WEAK: "weak",
  MEDIUM: "medium",
  STRONG: "strong",
  VERY_STRONG: "very-strong"
};

// Password strength calculation based on common rules
const calculateStrength = (password) => {
  if (!password) return { score: 0, level: StrengthLevel.EMPTY };
  
  let score = 0;
  
  // Length check
  if (password.length > 5) score += 1;
  if (password.length > 8) score += 1;
  
  // Character variety checks
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Determine level based on score
  let level = StrengthLevel.EMPTY;
  if (score === 0) level = StrengthLevel.EMPTY;
  else if (score <= 2) level = StrengthLevel.WEAK;
  else if (score <= 4) level = StrengthLevel.MEDIUM;
  else if (score <= 5) level = StrengthLevel.STRONG;
  else level = StrengthLevel.VERY_STRONG;
  
  return { score, level };
};

// Colors for different strength levels
const strengthColors = {
  [StrengthLevel.EMPTY]: "bg-gray-200",
  [StrengthLevel.WEAK]: "bg-red-500",
  [StrengthLevel.MEDIUM]: "bg-orange-500",
  [StrengthLevel.STRONG]: "bg-green-500",
  [StrengthLevel.VERY_STRONG]: "bg-emerald-500",
};

// Text labels for different strength levels
const strengthLabels = {
  [StrengthLevel.EMPTY]: "Empty",
  [StrengthLevel.WEAK]: "Weak",
  [StrengthLevel.MEDIUM]: "Medium",
  [StrengthLevel.STRONG]: "Strong",
  [StrengthLevel.VERY_STRONG]: "Very Strong",
};

export function PasswordStrengthIndicator({
  value,
  compareValue, // Value to compare against (e.g., for "Confirm Password" field)
  className,
  label = "Password",
  showScore = true,
  showScoreNumber = false,
  onChange,
  onStrengthChange,
  placeholder = "Enter your password",
  showVisibilityToggle = true,
  inputProps,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const displayValue = value || "";
  
  // Calculate raw strength
  const { score: rawScore, level: rawLevel } = calculateStrength(displayValue);
  
  // Determine if we are in "matching" mode
  const isComparing = compareValue !== undefined;
  const isMatching = isComparing && displayValue && displayValue === compareValue;
  const isMismatched = isComparing && displayValue && displayValue !== compareValue;
  
  // Adjust score and level based on matching status if in comparison mode
  let score = rawScore;
  let level = rawLevel;
  let displayLabel = strengthLabels[level];
  
  if (isComparing && displayValue) {
    if (isMatching) {
      score = 6;
      level = StrengthLevel.VERY_STRONG;
      displayLabel = "Passwords match";
    } else if (isMismatched) {
      score = 1;
      level = StrengthLevel.WEAK;
      displayLabel = "Passwords do not match";
    }
  }
  
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(level);
    }
  }, [level, onStrengthChange]);
  
  const handleChange = (e) => {
    if (onChange) onChange(e.target.value);
  };

  
  const toggleVisibility = () => {
    setShowPassword(!showPassword);
    // Focus back on input after toggling visibility
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex justify-between items-center">
          <Label htmlFor="password">{label}</Label>
          {showScoreNumber && !isComparing && (
            <span className="text-xs text-gray-500">
              {Math.floor((score / 6) * 10)}/10
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="password"
          type={showPassword ? "text" : "password"}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="pr-10"
          {...inputProps}
        />
        
        {showVisibilityToggle && (
          <button
            type="button"
            onClick={toggleVisibility}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
        
        {displayValue && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300",
              level === StrengthLevel.WEAK ? "bg-red-500" : level === StrengthLevel.MEDIUM ? "bg-orange-500" : "bg-green-500"
            )}>
              {level === StrengthLevel.WEAK ? (
                <X className="h-4 w-4 text-white" />
              ) : (
                <Check className="h-4 w-4 text-white" />
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Password strength bar */}
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-full flex-1 rounded-full transition-all duration-300",
              i < Math.min(Math.ceil(score / 1.5), 4) ? strengthColors[level] : "bg-gray-200"
            )}
          />
        ))}
      </div>
      
      {/* Strength/Match label */}
      {showScore && level !== StrengthLevel.EMPTY && (
        <p className={cn(
          "text-xs font-medium transition-colors duration-300",
          level === StrengthLevel.WEAK ? "text-red-500" :
          level === StrengthLevel.MEDIUM ? "text-orange-500" :
          level === StrengthLevel.STRONG ? "text-green-500" :
          "text-emerald-500"
        )}>
          {displayLabel}
        </p>
      )}
    </div>
  );
}

