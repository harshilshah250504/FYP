"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (q: string, ageGroup: string, healthCondition: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = "Search AQI, traffic, wildfire by place (e.g. Mumbai, Delhi, 19.0760, 72.8777)",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [ageGroup, setAgeGroup] = useState("general");
  const [healthCondition, setHealthCondition] = useState("none");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim(), ageGroup, healthCondition);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl mx-auto space-y-4"
    >
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            "w-full pl-12 pr-4 py-3.5 rounded-xl",
            "bg-[hsl(var(--input))] border border-[hsl(var(--border))]",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent",
            "transition-all duration-200"
          )}
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
            "font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Age group:</span>
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-foreground"
          >
            <option value="general">General</option>
            <option value="children">Children</option>
            <option value="adults">Adults</option>
            <option value="elderly">Elderly</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Health:</span>
          <select
            value={healthCondition}
            onChange={(e) => setHealthCondition(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-foreground"
          >
            <option value="none">None</option>
            <option value="asthma">Asthma</option>
            <option value="heart">Heart condition</option>
            <option value="lung">Lung condition</option>
            <option value="pregnancy">Pregnancy</option>
          </select>
        </label>
      </div>
    </form>
  );
}
