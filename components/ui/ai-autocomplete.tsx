"use client"

import { AccessibleBadge } from "@/components/ui/accessible-badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import * as React from "react"

export interface AIAutocompleteOption {
  value: string
  label: string
  category?: string
  details?: string
}

interface AIAutocompleteProps {
  options: AIAutocompleteOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  multiple?: boolean
  className?: string
  allowCustom?: boolean
  customLabel?: string
  searchEndpoint?: string
  searchType: "conditions" | "medications" | "allergies" | "services"
  expectedOutput?: {
    maxSuggestions?: number
    requireCategory?: boolean
    requireDetails?: boolean
  }
}

export function AIAutocomplete({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  emptyText = "No items found.",
  searchPlaceholder = "Search...",
  multiple = true,
  className,
  allowCustom = true,
  customLabel = "Add custom",
  searchEndpoint = "/api/health-suggestions",
  searchType,
  expectedOutput = { maxSuggestions: 10, requireCategory: false, requireDetails: false },
}: AIAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [aiSuggestions, setAiSuggestions] = React.useState<AIAutocompleteOption[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [justSelected, setJustSelected] = React.useState(false)
  const searchDebounceRef = React.useRef<NodeJS.Timeout>()
  
  // Use ref to access current value without causing re-renders
  const valueRef = React.useRef(value)
  React.useEffect(() => {
    valueRef.current = value
  }, [value])

  const selectedOptions = React.useMemo(() => {
    const allOptions = [...options, ...aiSuggestions]
    return value.map(v => {
      const found = allOptions.find(opt => opt.value === v)
      return found || { value: v, label: v, category: "Custom" }
    })
  }, [options, aiSuggestions, value])

  // AI-powered search with structured output
  React.useEffect(() => {
    // if (searchDebounceRef.current) {
    //   clearTimeout(searchDebounceRef.current)
    // }

    // if (!searchValue || searchValue.length < 2 || justSelected) {
    //   setAiSuggestions([])
    //   return
    // }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      console.log(`AIAutocomplete: Searching for ${searchType} with query:`, searchValue)
      
      try {
        const response = await fetch(searchEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchValue,
            type: searchType,
            existingValues: valueRef.current,
            maxSuggestions: expectedOutput.maxSuggestions,
          }),
        })
        
        if (response.ok) {
          const data: HealthSuggestionsResponse = await response.json()
          console.log(`AIAutocomplete: Received ${data.suggestions?.length || 0} AI suggestions:`, data.suggestions)
          
          // Validate and convert suggestions to AIAutocompleteOption format
          const validSuggestions = data.suggestions
            .filter((suggestion: HealthSuggestion) => {
              // Filter based on expected output requirements
              if (expectedOutput.requireCategory && !suggestion.category) return false
              if (expectedOutput.requireDetails && !suggestion.details) return false
              return true
            })
            .map((suggestion: HealthSuggestion): AIAutocompleteOption => ({
              value: suggestion.value,
              label: suggestion.label,
              category: suggestion.category,
              details: suggestion.details,
            }))
          
          console.log(`AIAutocomplete: Processed ${validSuggestions.length} valid suggestions:`, validSuggestions)
          setAiSuggestions(validSuggestions)
        } else {
          console.error("AI search failed:", response.status, response.statusText)
          setAiSuggestions([])
        }
      } catch (error) {
        console.error("AI search error:", error)
        setAiSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchValue])

  const handleSelect = (optionValue: string) => {
    console.log("AIAutocomplete: Selecting option:", optionValue, "Current values:", value)
    
    // Set flag to prevent immediate search after selection
    setJustSelected(true)
    
    if (multiple) {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue))
      } else {
        onChange([...value, optionValue])
      }
      // Clear search and AI suggestions after selection in multiple mode
      setSearchValue("")
      setAiSuggestions([])
    } else {
      onChange([optionValue])
      setSearchValue("")
      setAiSuggestions([])
      setOpen(false)
    }
    
    // Clear the flag after a short delay
    setTimeout(() => setJustSelected(false), 100)
  }

  const handleRemove = (optionValue: string) => {
    console.log("AIAutocomplete: Removing option:", optionValue)
    onChange(value.filter((v) => v !== optionValue))
  }

  const handleAddCustom = () => {
    console.log("AIAutocomplete: Adding custom option:", searchValue.trim())
    
    if (searchValue.trim() && !value.includes(searchValue.trim())) {
      // Set flag to prevent immediate search after adding custom option
      setJustSelected(true)
      
      onChange([...value, searchValue.trim()])
      setSearchValue("")
      setAiSuggestions([])
      
      // Clear the flag after a short delay
      setTimeout(() => setJustSelected(false), 100)
    }
  }

  // Combine static options with AI suggestions
  const allOptions = React.useMemo(() => {
    const combined = [...options]
    
    // Add AI suggestions that aren't already in options
    aiSuggestions.forEach(suggestion => {
      if (!combined.some(opt => opt.value === suggestion.value)) {
        combined.push(suggestion)
      }
    })
    
    return combined
  }, [options, aiSuggestions])

  // Group options by category
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, AIAutocompleteOption[]> = {}
    
    allOptions.forEach((option) => {
      const category = option.category || "Other"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(option)
    })
    
    return groups
  }, [allOptions])

  const filteredGroups = React.useMemo(() => {
    if (!searchValue) return groupedOptions
    
    const filtered: Record<string, AIAutocompleteOption[]> = {}
    
    Object.entries(groupedOptions).forEach(([category, items]) => {
      const filteredItems = items.filter((item) =>
        item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.value.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.details?.toLowerCase().includes(searchValue.toLowerCase())
      )
      
      if (filteredItems.length > 0) {
        filtered[category] = filteredItems
      }
    })
    
    return filtered
  }, [groupedOptions, searchValue])

  const showCustomOption = allowCustom && searchValue.trim() && 
    !allOptions.some(opt => opt.value.toLowerCase() === searchValue.trim().toLowerCase()) &&
    !value.includes(searchValue.trim())

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={`Select ${searchType}. ${selectedOptions.length} selected.`}
            className="w-full justify-between focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {selectedOptions.length > 0 ? (
              <span className="truncate">
                {multiple
                  ? `${selectedOptions.length} selected`
                  : selectedOptions[0]?.label}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <div className="relative">
              <CommandInput 
                placeholder={searchPlaceholder} 
                value={searchValue}
                onValueChange={setSearchValue}
                aria-label={`Search for ${searchType}`}
                aria-describedby="search-description"
              />
              <span id="search-description" className="sr-only">
                Type to search for {searchType}. AI-powered suggestions will appear as you type.
              </span>
              {isSearching && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <CommandList>
              {Object.keys(filteredGroups).length === 0 && !showCustomOption && !isSearching && (
                <CommandEmpty>{emptyText}</CommandEmpty>
              )}
              
              {showCustomOption && (
                <CommandGroup heading="Custom">
                  <CommandItem
                    value={`custom-${searchValue}`}
                    onSelect={handleAddCustom}
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    <div className="flex-1">
                      <div className="font-medium">{customLabel}: {searchValue}</div>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}
              
              {Object.entries(filteredGroups).map(([category, items]) => (
                <CommandGroup key={category} heading={category}>
                  {items.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        {option.details && (
                          <div className="text-sm text-muted-foreground">
                            {option.details}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              
              {isSearching && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Searching for related {searchType}...
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {multiple && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label={`Selected ${searchType}`}>
          {selectedOptions.map((option) => (
            <div key={option.value} role="listitem">
              <AccessibleBadge
                onRemove={() => handleRemove(option.value)}
                variant="secondary"
                ariaLabel={`${option.label}. Press to remove.`}
              >
                {option.label}
              </AccessibleBadge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}