import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Plus, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Tag {
  id: number;
  name: string;
  description?: string | null;
  color: string;
  category?: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface TagInputProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxTags?: number;
}

export function TagInput({
  availableTags = [],
  selectedTags = [],
  onTagsChange,
  placeholder = "Select tags...",
  className,
  disabled = false,
  maxTags
}: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase()) &&
    !selectedTags.some((selected) => selected.id === tag.id)
  );

  const handleTagSelect = (tag: Tag) => {
    if (maxTags && selectedTags.length >= maxTags) {
      return;
    }
    onTagsChange([...selectedTags, tag]);
    setSearch("");
  };

  const handleTagRemove = (tagId: number) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagId));
  };

  const selectedTagsDisplay = React.useMemo(() => {
    return selectedTags.map((tag) => (
      <Badge
        key={tag.id}
        variant="secondary"
        className={cn(
          "text-white border-0 hover:opacity-80 transition-opacity",
          "flex items-center gap-1 px-2 py-1"
        )}
        style={{ backgroundColor: tag.color }}
      >
        <span className="text-xs font-medium">{tag.name}</span>
        {!disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTagRemove(tag.id);
            }}
            className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </Badge>
    ));
  }, [selectedTags, disabled]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTagsDisplay}
        </div>
      )}

      {/* Tag Selection Popover */}
      {!disabled && (!maxTags || selectedTags.length < maxTags) && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <span className="text-muted-foreground">{placeholder}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput
                placeholder="Search tags..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => {
                        handleTagSelect(tag);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{tag.name}</div>
                        {tag.description && (
                          <div className="text-sm text-muted-foreground">
                            {tag.description}
                          </div>
                        )}
                      </div>
                      <Check className="h-4 w-4 opacity-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Max tags reached message */}
      {maxTags && selectedTags.length >= maxTags && (
        <p className="text-sm text-muted-foreground">
          Maximum {maxTags} tags selected
        </p>
      )}
    </div>
  );
}

// Tag display component for read-only contexts
interface TagDisplayProps {
  tags: Tag[];
  className?: string;
  showCategory?: boolean;
  maxDisplay?: number;
}

export function TagDisplay({
  tags = [],
  className,
  showCategory = false,
  maxDisplay
}: TagDisplayProps) {
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const remainingCount = maxDisplay && tags.length > maxDisplay ? tags.length - maxDisplay : 0;

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="text-white border-0"
          style={{ backgroundColor: tag.color }}
          title={tag.description || tag.name}
        >
          <span className="text-xs font-medium">
            {showCategory && tag.category ? `${tag.category}: ${tag.name}` : tag.name}
          </span>
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}

// Tag filter component for filtering by tags
interface TagFilterProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagFilter({
  availableTags = [],
  selectedTags = [],
  onTagsChange,
  placeholder = "Filter by tags...",
  className
}: TagFilterProps) {
  return (
    <TagInput
      availableTags={availableTags}
      selectedTags={selectedTags}
      onTagsChange={onTagsChange}
      placeholder={placeholder}
      className={className}
    />
  );
}