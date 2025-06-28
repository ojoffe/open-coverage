"use client"

import * as React from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AutocompleteOption {
  value: string
  label: string
  category?: string
  details?: string
}

interface AutocompleteProps {
  options: AutocompleteOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  multiple?: boolean
  className?: string
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  emptyText = "No items found.",
  searchPlaceholder = "Search...",
  multiple = true,
  className,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOptions = options.filter((option) => value.includes(option.value))

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue))
      } else {
        onChange([...value, optionValue])
      }
    } else {
      onChange([optionValue])
      setOpen(false)
    }
  }

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue))
  }

  // Group options by category if available
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, AutocompleteOption[]> = {}
    
    options.forEach((option) => {
      const category = option.category || "Other"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(option)
    })
    
    return groups
  }, [options])

  const filteredGroups = React.useMemo(() => {
    if (!searchValue) return groupedOptions
    
    const filtered: Record<string, AutocompleteOption[]> = {}
    
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

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
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
          <Command>
            <CommandInput 
              placeholder={searchPlaceholder} 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {Object.keys(filteredGroups).length === 0 && (
                <CommandEmpty>{emptyText}</CommandEmpty>
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
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {multiple && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="flex items-center gap-1">
              {option.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleRemove(option.value)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}