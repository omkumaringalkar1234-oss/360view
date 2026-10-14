import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { Button } from './Button';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  searchable = false,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.blur();
    }
  };

  return (
    <div className={cn('w-full', className)} ref={dropdownRef}>
      {label && <label className="label-text">{label}</label>}
      <div className="relative">
        <Button
          ref={buttonRef}
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          leftIcon={<ChevronDown className="h-4 w-4 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />}
          className={cn('justify-between', error && 'border-red-500')}
          onKeyDown={handleKeyDown}
        >
          <span className={cn('truncate', !selectedOption && 'text-dark-500')}>
            {selectedOption?.label || placeholder}
          </span>
        </Button>
        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full glass-panel rounded-xl border border-dark-700 overflow-hidden animate-slide-down scrollbar-thin max-h-60">
            {searchable && (
              <div className="p-2 border-b border-dark-700">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
            )}
            <div className="max-h-[300px] overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-center text-dark-500 text-sm">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        setIsOpen(false);
                      }
                    }}
                    disabled={option.disabled}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors duration-150 flex items-center gap-3',
                      value === option.value ? 'bg-primary-600/20' : 'hover:bg-dark-700',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {option.icon && <span className="flex-shrink-0 text-dark-400">{option.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <span className={cn('block truncate', value === option.value ? 'text-primary-300' : 'text-dark-100')}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="block text-xs text-dark-500 truncate mt-0.5">
                          {option.description}
                        </span>
                      )}
                    </div>
                    {value === option.value && <Check className="h-4 w-4 text-primary-400 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-400" role="alert">{error}</p>}
    </div>
  );
}